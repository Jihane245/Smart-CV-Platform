import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import {
  StatutCandidature,
  STATUT_CANDIDATURE_LABELS,
} from '../../../../core/models/models';
import {
  CandidatureListeItem,
  CandidatureService,
  CandidatureStats,
} from '../../../../core/services/candidature.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CandidatureDraft,
  CandidatureDraftService,
} from '../../../../core/services/candidature-draft.service';

const STATUT_OPTIONS: StatutCandidature[] = [
  StatutCandidature.enregistree,
  StatutCandidature.envoyee,
  StatutCandidature.recue,
  StatutCandidature.en_cours_d_examen,
  StatutCandidature.entretien,
  StatutCandidature.acceptee,
  StatutCandidature.refusee,
  StatutCandidature.archivee,
];

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './applications.html',
  styleUrl: './applications.scss',
})
export class Applications implements OnInit, AfterViewInit {
  readonly statutOptions = STATUT_OPTIONS;

  chargement = true;
  enregistrement = false;
  prefillActif = false;
  candidatures: CandidatureListeItem[] = [];
  stats: CandidatureStats | null = null;

  majStatutId: number | null = null;

  formEntreprise = '';
  formPoste = '';
  formDate = '';
  formStatut: StatutCandidature = StatutCandidature.envoyee;

  constructor(
    private candidatureService: CandidatureService,
    private candidatureDraft: CandidatureDraftService,
    private notif: NotificationService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const draft = this.candidatureDraft.consumeDraft();
    if (draft) {
      this.appliquerBrouillon(draft);
    }
    this.recharger();
  }

  ngAfterViewInit(): void {
    const scrollToForm =
      this.prefillActif || this.route.snapshot.fragment === 'nouvelle-candidature';
    if (scrollToForm) {
      requestAnimationFrame(() => {
        document.getElementById('nouvelle-candidature')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      });
    }
  }

  private appliquerBrouillon(draft: CandidatureDraft): void {
    if (draft.entreprise) this.formEntreprise = draft.entreprise;
    if (draft.poste) this.formPoste = draft.poste;
    if (draft.date) this.formDate = draft.date;
    if (draft.statut) this.formStatut = draft.statut;
    this.prefillActif = true;
    this.notif.info('Formulaire pré-rempli depuis votre CV — vous pouvez modifier les champs avant d\'ajouter.');
  }

  recharger(silencieux = false): void {
    if (!silencieux) {
      this.chargement = true;
    }
    forkJoin({
      list: this.candidatureService.getMesCandidatures(),
      stats: this.candidatureService.getStats(),
    })
      .pipe(
        finalize(() => {
          this.chargement = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ list, stats }) => {
          this.candidatures = list ?? [];
          this.stats = stats ?? null;
        },
        error: () => {
          this.notif.error('Impossible de charger vos candidatures.');
          this.candidatures = [];
          this.stats = null;
        },
      });
  }

  get nombreReponses(): number {
    const p = this.stats?.parStatut;
    if (!p) return 0;
    return p.acceptee + p.refusee + p.recue + p.enCoursExamen + p.entretien;
  }

  get tauxReponsePct(): number {
    const t = this.stats?.total ?? 0;
    if (!t) return 0;
    return Math.round((this.nombreReponses / t) * 1000) / 10;
  }

  get tauxAcceptationPct(): number {
    return this.stats?.tauxAcceptation ?? 0;
  }

  get pieGradient(): string {
    const p = this.stats?.parStatut;
    const total = this.stats?.total ?? 0;
    if (!p || total === 0) {
      return 'conic-gradient(#e8e0d4 0turn 1turn)';
    }
    const acceptee = p.acceptee;
    const refusee = p.refusee;
    const envoyee = p.envoyee;
    const attente =
      p.enregistree + p.recue + p.enCoursExamen + p.entretien + p.archivee;
    const sum = acceptee + refusee + envoyee + attente;
    const base = sum > 0 ? sum : total;
    const toTurn = (n: number) => (n / base) * 1;
    let a = 0;
    const g = (color: string, frac: number): string => {
      if (frac <= 0) return '';
      const start = a;
      a += frac;
      return `${color} ${start}turn ${a}turn`;
    };
    const parts = [
      g('#8ba17e', toTurn(acceptee)),
      g('#d2b48c', toTurn(attente)),
      g('#a52a2a', toTurn(refusee)),
      g('#c9a86c', toTurn(envoyee)),
    ].filter(Boolean);
    return `conic-gradient(${parts.join(', ')})`;
  }

  statutLabel(statut: string): string {
    const key = statut as StatutCandidature;
    return STATUT_CANDIDATURE_LABELS[key] ?? statut;
  }

  statutPillClass(statut: string): string {
    const s = statut as StatutCandidature;
    if (s === StatutCandidature.acceptee) return 'pill-acceptee';
    if (s === StatutCandidature.refusee) return 'pill-refusee';
    if (s === StatutCandidature.envoyee) return 'pill-envoyee';
    if (s === StatutCandidature.archivee) return 'pill-archivee';
    return 'pill-attente';
  }

  onStatutChange(row: CandidatureListeItem, event: Event): void {
    const sel = event.target as HTMLSelectElement;
    const next = sel.value as StatutCandidature;
    if (next === row.statut) return;

    this.majStatutId = row.id;
    this.candidatureService.changerStatut(row.id, next).subscribe({
      next: () => {
        row.statut = next;
        this.notif.success('Statut mis à jour.');
        this.majStatutId = null;
        this.candidatureService.getStats().subscribe({
          next: (st) => {
            this.stats = st;
            this.cdr.markForCheck();
          },
          error: () => {
            this.cdr.markForCheck();
          },
        });
        this.cdr.markForCheck();
      },
      error: () => {
        sel.value = row.statut;
        this.notif.error('Impossible de mettre à jour le statut.');
        this.majStatutId = null;
        this.cdr.markForCheck();
      },
    });
  }

  ajouter(): void {
    const entreprise = this.formEntreprise.trim();
    const poste = this.formPoste.trim();
    if (!entreprise || !poste) {
      this.notif.error('Renseignez au moins l’entreprise et le poste.');
      return;
    }
    if (!this.formDate) {
      this.notif.error('Indiquez la date d’envoi.');
      return;
    }

    const dateEnvoi = new Date(this.formDate + 'T12:00:00').toISOString();
    this.enregistrement = true;

    this.candidatureService
      .ajouter({ entreprise, poste, dateEnvoi, notes: null })
      .pipe(
        finalize(() => {
          this.enregistrement = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ id }) => {
          const chainStatut =
            this.formStatut !== StatutCandidature.enregistree
              ? this.candidatureService.changerStatut(id, this.formStatut)
              : null;
          if (chainStatut) {
            chainStatut.subscribe({
              next: () => this.afterAjoutOk(),
              error: () => {
                this.notif.error(
                  'Candidature créée, mais le statut n’a pas pu être appliqué. Modifiez-le dans le tableau.',
                );
                this.afterAjoutOk();
              },
            });
          } else {
            this.afterAjoutOk();
          }
        },
        error: () => {
          this.notif.error('Impossible d’enregistrer la candidature.');
        },
      });
  }

  private afterAjoutOk(): void {
    this.notif.success('Candidature enregistrée.');
    this.formEntreprise = '';
    this.formPoste = '';
    this.formDate = '';
    this.formStatut = StatutCandidature.envoyee;
    this.prefillActif = false;
    this.recharger(true);
  }
}
