import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import {
  ExperienceDtoPayload,
  FormationDtoPayload,
  ProfilMeResponse,
  ProfilService,
  normalizeCompetenceNiveau,
} from '../../../../core/services/profil.service';
import { Competence, Experience, Formation, NiveauCompetence } from '../../../../core/models/models';

interface LigneSection {
  detail: string;
  description: string;
}

interface Section {
  titre: string;
  lignes: LigneSection[];
}

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})
export class MonProfil implements OnInit {
  prenom = '';
  nom = '';
  email = '';

  titre = '';
  telephone = '';
  ville = '';
  linkedIn = '';
  resume = '';

  // Snapshot of last saved values — used for dirty detection (not private: template needs access)
  savedTitre = '';
  savedTelephone = '';
  savedVille = '';
  savedLinkedIn = '';
  savedResume = '';

  // Snapshots of saved experience values keyed by idExp — for modified detection
  expSnapshots = new Map<number, { poste: string; entreprise: string; dateDebut: string; dateFin: string | undefined; description: string }>();

  // Snapshots of saved formation values keyed by idFrmt
  formSnapshots = new Map<number, { diplome: string; etablissement: string; annee: number; mention: string }>();

  competences: Competence[] = [];
  experiences: Experience[] = [];
  formations: Formation[] = [];
  sections: Section[] = [];

  completude = 0;
  initiales = '?';

  loading = false;
  saving = false;

  nouvelleCompetence = '';
  ajoutCompetenceVisible = false;

  private profilId = 0;

  constructor(
    private profilService: ProfilService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      status: this.authService.getStatus().pipe(catchError(() => of(null))),
      profil: this.profilService.getMe().pipe(
        catchError((err) => {
          console.error('Erreur chargement profil', err);
          return of(null);
        })
      ),
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe(({ status, profil }) => {
        if (status) {
          this.prenom = status.givenName ?? '';
          this.nom = status.surname ?? '';
          this.email = status.email ?? '';
          this.initiales = this.computeInitiales(this.prenom, this.nom);
        }
        if (profil) {
          this.applyProfil(profil);
        }
        this.recalcCompletude();
        this.cdr.markForCheck();
      });
  }

  // ─── Dirty detection ──────────────────────────────────────────────────────

  get isInfoDirty(): boolean {
    return (
      this.titre !== this.savedTitre ||
      this.telephone !== this.savedTelephone ||
      this.ville !== this.savedVille ||
      this.linkedIn !== this.savedLinkedIn ||
      this.resume !== this.savedResume
    );
  }

  isExpDirty(exp: Experience): boolean {
    return exp.idExp === 0;
  }

  isExpModified(exp: Experience): boolean {
    if (exp.idExp === 0) return false;
    const snap = this.expSnapshots.get(exp.idExp);
    if (!snap) return false;
    return (
      exp.poste !== snap.poste ||
      exp.entreprise !== snap.entreprise ||
      exp.dateDebut !== snap.dateDebut ||
      exp.dateFin !== snap.dateFin ||
      exp.description !== snap.description
    );
  }

  isFormationNew(f: Formation): boolean {
    return f.idFrmt === 0;
  }

  isFormationModified(f: Formation): boolean {
    if (f.idFrmt === 0) return false;
    const snap = this.formSnapshots.get(f.idFrmt);
    if (!snap) return false;
    return (
      f.diplome !== snap.diplome ||
      f.etablissement !== snap.etablissement ||
      f.annee !== snap.annee ||
      f.mention !== snap.mention
    );
  }

  hasFormationDirty(): boolean {
    return this.formations.some((f) => this.isFormationNew(f) || this.isFormationModified(f));
  }

  // Toggle add-competence input; also resets field if hiding
  toggleAjoutCompetence(): void {
    this.ajoutCompetenceVisible = !this.ajoutCompetenceVisible;
    if (!this.ajoutCompetenceVisible) {
      this.nouvelleCompetence = '';
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private computeInitiales(prenom: string, nom: string): string {
    const a = prenom.trim().charAt(0);
    const b = nom.trim().charAt(0);
    if (!a && !b) return '?';
    return (a + b).toUpperCase();
  }

  private applyProfil(p: ProfilMeResponse): void {
    this.profilId = p.id;
    this.titre = p.titre ?? '';
    this.telephone = p.telephone ?? '';
    this.ville = p.adresse ?? '';
    this.linkedIn = p.linkedIn ?? '';
    this.resume = p.description ?? '';

    // Update snapshots to match saved state
    this.savedTitre = this.titre;
    this.savedTelephone = this.telephone;
    this.savedVille = this.ville;
    this.savedLinkedIn = this.linkedIn;
    this.savedResume = this.resume;

    this.competences = (p.competences ?? []).map((c) => ({
      idComp: c.idComp,
      profilId: this.profilId,
      nom: c.nom ?? '',
      niveau: normalizeCompetenceNiveau(c.niveau),
      categorie: c.categorie ?? '',
    }));

    this.experiences = (p.experiences ?? []).map((e) => ({
      idExp: e.idExp,
      profilId: e.profilId ?? this.profilId,
      poste: e.poste ?? '',
      entreprise: e.entreprise ?? '',
      dateDebut: this.isoToInputDate(e.dateDebut),
      dateFin: e.dateFin ? this.isoToInputDate(e.dateFin) : undefined,
      description: e.description ?? '',
    }));

    // Rebuild experience snapshots
    this.expSnapshots.clear();
    for (const exp of this.experiences) {
      this.expSnapshots.set(exp.idExp, {
        poste: exp.poste,
        entreprise: exp.entreprise ?? '',
        dateDebut: exp.dateDebut,
        dateFin: exp.dateFin,
        description: exp.description ?? '',
      });
    }

    this.formations = (p.formations ?? []).map((f) => ({
      idFrmt: f.idFrmt,
      profilId: f.profilId ?? this.profilId,
      diplome: f.diplome ?? '',
      etablissement: f.etablissement ?? '',
      annee: f.annee ?? 0,
      mention: f.mention ?? '',
    }));

    // Rebuild formation snapshots
    this.formSnapshots.clear();
    for (const f of this.formations) {
      this.formSnapshots.set(f.idFrmt, {
        diplome: f.diplome ?? '',
        etablissement: f.etablissement ?? '',
        annee: f.annee ?? 0,
        mention: f.mention ?? '',
      });
    }
  }

  private isoToInputDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  private inputDateToIso(date: string): string {
    if (!date) return new Date().toISOString();
    return new Date(date + 'T12:00:00.000Z').toISOString();
  }

  experienceActuelle(exp: Experience): boolean {
    return !exp.dateFin || exp.dateFin === '';
  }

  onExperienceActuelleChange(exp: Experience, checked: boolean): void {
    if (checked) {
      exp.dateFin = undefined;
    } else if (!exp.dateFin) {
      exp.dateFin = this.isoToInputDate(new Date().toISOString());
    }
  }

  private recalcCompletude(): void {
    let filled = 0;
    const total = 10;
    if (this.titre.trim()) filled++;
    if (this.telephone.trim()) filled++;
    if (this.ville.trim()) filled++;
    if (this.linkedIn.trim()) filled++;
    if (this.resume.trim().length > 20) filled++;
    if (this.competences.length) filled++;
    if (this.experiences.some((e) => e.poste?.trim())) filled++;
    if (this.formations.some((f) => f.diplome?.trim() || f.etablissement?.trim())) filled++;
    if (this.prenom.trim() && this.nom.trim()) filled++;
    if (this.email.trim()) filled++;
    this.completude = Math.round((filled / total) * 100);
  }

  // ─── Compétences ──────────────────────────────────────────────────────────

  ajouterCompetence(): void {
    const nom = this.nouvelleCompetence.trim();
    if (!nom) return;

    this.profilService
      .addCompetence({ nom, niveau: 1, categorie: '' })
      .subscribe({
        next: (res: any) => {
          this.nouvelleCompetence = '';
          this.ajoutCompetenceVisible = false;
          // FIX issue 3: append locally instead of reloading the whole profil,
          // which would overwrite unsaved field edits.
          this.competences.push({
            idComp: res?.idComp ?? 0,
            profilId: this.profilId,
            nom,
            niveau: NiveauCompetence.Intermediaire,
            categorie: '',
          });
          this.recalcCompletude();
        },
        error: (err) => console.error('Erreur ajout compétence', err),
      });
  }

  supprimerCompetence(index: number): void {
    const c = this.competences[index];
    if (!c?.idComp) return;
    this.profilService.deleteCompetence(c.idComp).subscribe({
      next: () => {
        this.competences.splice(index, 1);
        this.recalcCompletude();
      },
      error: (err) => console.error('Erreur suppression compétence', err),
    });
  }

  onTelephoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Allow digits, +, -, spaces, parentheses
    input.value = input.value.replace(/[^\d+\-\s()]/g, '');
    this.telephone = input.value;
  }

  // ─── Expériences ──────────────────────────────────────────────────────────

  ajouterExperience(): void {
    this.experiences.push({
      idExp: 0,
      profilId: this.profilId,
      poste: '',
      entreprise: '',
      dateDebut: this.isoToInputDate(new Date().toISOString()),
      dateFin: undefined,
      description: '',
    });
  }

  supprimerExperience(index: number): void {
    const exp = this.experiences[index];
    if (exp.idExp === 0) {
      // Not yet saved — just remove locally
      this.experiences.splice(index, 1);
      this.recalcCompletude();
      return;
    }
    this.profilService.deleteExperience(exp.idExp).subscribe({
      next: () => {
        this.experiences.splice(index, 1);
        this.expSnapshots.delete(exp.idExp);
        this.recalcCompletude();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur suppression expérience', err),
    });
  }

  // ─── Formations ───────────────────────────────────────────────────────────

  ajouterFormation(): void {
    this.formations.push({
      idFrmt: 0,
      profilId: this.profilId,
      diplome: '',
      etablissement: '',
      annee: new Date().getFullYear(),
      mention: '',
    });
  }

  supprimerFormation(index: number): void {
    const f = this.formations[index];
    if (f.idFrmt === 0) {
      this.formations.splice(index, 1);
      this.recalcCompletude();
      return;
    }
    this.profilService.deleteFormation(f.idFrmt).subscribe({
      next: () => {
        this.formations.splice(index, 1);
        this.formSnapshots.delete(f.idFrmt);
        this.recalcCompletude();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur suppression formation', err),
    });
  }

  private reloadProfil(): void {
    this.profilService.getMe().subscribe({
      next: (p) => {
        this.applyProfil(p);
        this.recalcCompletude();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur rechargement profil', err),
    });
  }

  private toExperiencePayload(exp: Experience): ExperienceDtoPayload {
    return {
      poste: exp.poste ?? '',
      entreprise: exp.entreprise ?? '',
      dateDebut: this.inputDateToIso(exp.dateDebut),
      dateFin: exp.dateFin ? this.inputDateToIso(exp.dateFin) : null,
      description: exp.description ?? '',
    };
  }

  private toFormationPayload(f: Formation): FormationDtoPayload {
    return {
      diplome: f.diplome ?? '',
      etablissement: f.etablissement ?? '',
      annee: f.annee ?? 0,
      mention: f.mention ?? '',
    };
  }

  enregistrer(): void {
    this.saving = true;

    // FIX issue 4: capture arrays BEFORE updateMe fires, because applyProfil()
    // inside switchMap would overwrite this.experiences/formations with the
    // server state (which doesn't yet contain new items with idExp/idFrmt === 0).
    const experiencesSnapshot = [...this.experiences];
    const formationsSnapshot = [...this.formations];

    this.profilService
      .updateMe({
        titre: this.titre,
        telephone: this.telephone,
        adresse: this.ville,
        linkedIn: this.linkedIn,
        description: this.resume,
      })
      .pipe(
        switchMap((p) => {
          // Update snapshots so dirty indicators clear, but keep local arrays
          // intact — don't call applyProfil here, it would destroy the snapshot.
          this.savedTitre = p.titre ?? '';
          this.savedTelephone = p.telephone ?? '';
          this.savedVille = p.adresse ?? '';
          this.savedLinkedIn = p.linkedIn ?? '';
          this.savedResume = p.description ?? '';

          const tasks: Observable<unknown>[] = [];

          for (const exp of experiencesSnapshot) {
            const payload = this.toExperiencePayload(exp);
            if (!exp.idExp) {
              tasks.push(this.profilService.addExperience(payload));
            } else {
              tasks.push(this.profilService.updateExperience(exp.idExp, payload));
            }
          }

          for (const f of formationsSnapshot) {
            const payload = this.toFormationPayload(f);
            if (!f.idFrmt) {
              tasks.push(this.profilService.addFormation(payload));
            } else {
              tasks.push(this.profilService.updateFormation(f.idFrmt, payload));
            }
          }

          if (!tasks.length) return of(null);
          return forkJoin(tasks);
        }),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        // Full reload after all tasks complete — gets real IDs for newly added items
        next: () => this.reloadProfil(),
        error: (err) => console.error('Erreur mise à jour profil', err),
      });
  }

  // ─── Sections dynamiques ──────────────────────────────────────────────────

  ajouterSection(): void {
    this.sections.push({
      titre: 'Section #',
      lignes: [
        { detail: 'Détail 1', description: '' },
        { detail: 'Détail 2', description: '' },
      ],
    });
  }

  supprimerSection(index: number): void {
    this.sections.splice(index, 1);
  }

  ajouterLigne(section: Section): void {
    section.lignes.push({ detail: `Détail ${section.lignes.length + 1}`, description: '' });
  }

  supprimerLigne(section: Section, index: number): void {
    section.lignes.splice(index, 1);
  }
}