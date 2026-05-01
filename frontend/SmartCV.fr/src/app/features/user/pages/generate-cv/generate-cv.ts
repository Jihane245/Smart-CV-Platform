import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, AdminTemplateDto } from '../../../../core/services/admin.service';
import {
  ProfilService,
  ProfilMeResponse,
  normalizeCompetenceNiveau,
} from '../../../../core/services/profil.service';
import {
  CvService,
  AnalyseOffreResponse,
  RecommandationsDto,
} from '../../../../core/services/cv.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthService } from '../../../../core/services/auth.service';

interface CompetenceAnalysee {
  nom: string;
  statut: 'maitrise' | 'partiel' | 'renforcer';
}

interface CompetenceCvPreview {
  nom: string;
  pct: number;
}

const NIVEAU_PCT: Record<string, number> = {
  Debutant: 30,
  Intermediaire: 55,
  Avance: 75,
  Expert: 95,
};

const LANGUE_CODE: Record<string, string> = {
  'Français': 'fr',
  'Anglais': 'en',
  'Arabe': 'ar',
  'Espagnol': 'es',
};

@Component({
  selector: 'app-generate-cv',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './generate-cv.html',
  styleUrl: './generate-cv.scss',
})
export class GenerateCv implements OnInit {

  @ViewChild('cvPreview') cvPreviewRef!: ElementRef<HTMLElement>;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  // ─── Navigation ──────────────────────────────────────────────────────────────
  etapeActive = 1;
  etapesCompletes: number[] = [];

  etapes = [
    { num: 1, label: "Offre d'emploi" },
    { num: 2, label: 'Analyse IA' },
    { num: 3, label: 'Choix du template' },
    { num: 4, label: 'Validation & export' },
  ];

  // ─── Loading states ──────────────────────────────────────────────────────────
  chargementProfil = true;
  chargementTemplates = false;
  analyseEnCours = false;
  generationEnCours = false;
  telechargementEnCours = false;

  // ─── Profil réel ─────────────────────────────────────────────────────────────
  prenom = '';
  nom = '';
  email = '';
  titre = '';
  ville = '';
  linkedIn = '';
  resume = '';
  competencesCv: CompetenceCvPreview[] = [];
  competencesNoms: string[] = [];
  experiencesCv: ProfilMeResponse['experiences'] = [];
  formationsCv: ProfilMeResponse['formations'] = [];

  // ─── Étape 1 ─────────────────────────────────────────────────────────────────
  offreTexte = '';

  // ─── Étape 2 ─────────────────────────────────────────────────────────────────
  scoreCompatibilite = 0;
  scoreLabel = '';
  niveauLabel = '';
  competencesAnalysees: CompetenceAnalysee[] = [];
  recommandations: RecommandationsDto | null = null;
  resumeIA = '';

  // ─── Étape 3 ─────────────────────────────────────────────────────────────────
  templatesDisponibles: AdminTemplateDto[] = [];
  templateSelectionne: AdminTemplateDto | null = null;

  couleurs = ['#6B4E2A', '#3B5E3A', '#8B1A1A', '#1A3A5E'];
  couleurAccent = '#6B4E2A';

  langues = ['Français', 'Anglais', 'Arabe', 'Espagnol'];
  langueSelectionnee = 'Français';

  // ─── Étape 4 ─────────────────────────────────────────────────────────────────
  cvCreéId: number | null = null;
  resumeEdite = '';
  titreCv = '';
  scoreApresOptimisation = 0;
  pointsGagnes = 0;

  constructor(
    private adminService: AdminService,
    private profilService: ProfilService,
    private cvService: CvService,
    private notifService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.chargerProfil();
  }

  // ─── Chargement profil ───────────────────────────────────────────────────────
  private chargerProfil(): void {
    this.chargementProfil = true;

    forkJoin({
      profil: this.profilService.getMe(),
      status: this.authService.getStatus(),
    }).subscribe({
      next: ({ profil, status }) => {
        this.titre = profil.titre ?? '';
        this.ville = profil.adresse ?? '';
        this.linkedIn = profil.linkedIn ?? '';
        this.resume = profil.description ?? '';
        this.resumeEdite = profil.description ?? '';

        this.competencesNoms = (profil.competences ?? []).map(c => c.nom);
        this.competencesCv = (profil.competences ?? []).map(c => ({
          nom: c.nom,
          pct: NIVEAU_PCT[normalizeCompetenceNiveau(c.niveau)] ?? 50,
        }));

        this.experiencesCv = profil.experiences ?? [];
        this.formationsCv = profil.formations ?? [];

        this.prenom = status.givenName ?? '';
        this.nom = status.surname ?? '';
        this.email = status.email ?? '';
        this.titreCv = this.titre || `CV — ${this.prenom} ${this.nom}`.trim();

        this.chargementProfil = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifService.error('Impossible de charger votre profil.');
        this.chargementProfil = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Étape 1 — Analyse texte ─────────────────────────────────────────────────
  analyser(): void {
    if (!this.offreTexte.trim()) return;
    this.analyseEnCours = true;

    this.cvService.analyserTexte(this.offreTexte, this.competencesNoms).subscribe({
      next: (res) => this.traiterResultatAnalyse(res),
      error: () => {
        this.notifService.error("Erreur lors de l'analyse. Veuillez réessayer.");
        this.analyseEnCours = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Étape 1 — Analyse image ─────────────────────────────────────────────────
  analyserImage(): void {
    this.imageInput.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.analyseEnCours = true;

    this.cvService.analyserImage(file, this.competencesNoms).subscribe({
      next: (res) => this.traiterResultatAnalyse(res),
      error: () => {
        this.notifService.error("Erreur lors de l'analyse de l'image.");
        this.analyseEnCours = false;
        this.cdr.detectChanges();
      }
    });
  }

  private traiterResultatAnalyse(res: AnalyseOffreResponse): void {
    this.scoreCompatibilite = res.score_compatibilite;
    this.scoreLabel = this.calculerScoreLabel(res.score_compatibilite);
    this.niveauLabel = res.niveau ?? '';
    this.resumeIA = res.resume ?? this.resume;
    this.resumeEdite = res.resume ?? this.resume;
    this.recommandations = res.recommandations ?? null;

    const matchSet = new Set(
      (res.competences_match ?? []).map(n => n.toLowerCase())
    );
    const manquantSet = new Set(
      (res.competences_manquantes ?? []).map(n => n.toLowerCase())
    );

    this.competencesAnalysees = [
      ...(res.competences_match ?? []).map(nom => ({
        nom,
        statut: 'maitrise' as const,
      })),
      ...(res.competences_manquantes ?? []).map(nom => ({
        nom,
        statut: 'renforcer' as const,
      })),
      ...this.competencesNoms
        .filter(n =>
          !matchSet.has(n.toLowerCase()) &&
          !manquantSet.has(n.toLowerCase())
        )
        .map(nom => ({ nom, statut: 'partiel' as const })),
    ];

    this.analyseEnCours = false;
    this.etapesCompletes.push(1);
    this.etapeActive = 2;
    this.cdr.detectChanges();
  }

  // ─── Étape 2 → 3 ─────────────────────────────────────────────────────────────
  allerEtape3(): void {
    this.etapesCompletes.push(2);
    this.chargementTemplates = true;
    this.etapeActive = 3;

    this.http.get<AdminTemplateDto[]>('http://localhost:5000/api/templates', {
      withCredentials: true
    }).subscribe({
      next: (templates) => {
        this.templatesDisponibles = templates;
        this.templateSelectionne = templates[0] ?? null;
        this.chargementTemplates = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifService.error('Impossible de charger les templates.');
        this.chargementTemplates = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Étape 3 → 4 — Génération CV ─────────────────────────────────────────────
  generer(): void {
    if (!this.templateSelectionne) {
      this.notifService.warning('Veuillez sélectionner un template.');
      return;
    }

    this.generationEnCours = true;

    this.cvService.creerCv({
      templateId: this.templateSelectionne.id,
      couleurPrimaire: this.couleurAccent,
      langue: LANGUE_CODE[this.langueSelectionnee] ?? 'fr',
    }).subscribe({
      next: (cv) => {
        this.cvCreéId = cv.id;
        this.scoreApresOptimisation = Math.min(
          100,
          this.scoreCompatibilite + 6
        );
        this.pointsGagnes =
          this.scoreApresOptimisation - this.scoreCompatibilite;
        this.generationEnCours = false;
        this.etapesCompletes.push(3);
        this.etapeActive = 4;
        this.notifService.success('CV généré avec succès !');
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifService.error(
          'Erreur lors de la génération du CV. Veuillez réessayer.'
        );
        this.generationEnCours = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Étape 4 — Téléchargement PDF ────────────────────────────────────────────
  telechargerPdf(): void {
    if (!this.cvCreéId) {
      this.notifService.warning('Aucun CV généré à télécharger.');
      return;
    }

    const previewEl = this.cvPreviewRef?.nativeElement;
    if (!previewEl) {
      this.notifService.error('Aperçu CV introuvable.');
      return;
    }

    const styles = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch {
          return [];
        }
      })
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${styles}</style>
</head>
<body>
  ${previewEl.outerHTML}
</body>
</html>`;

    this.telechargementEnCours = true;

    this.cvService.exporterPdf(this.cvCreéId, htmlContent).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV_${this.prenom}_${this.nom}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.telechargementEnCours = false;
        this.notifService.success('CV téléchargé avec succès !');
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifService.error('Erreur lors de la génération du PDF.');
        this.telechargementEnCours = false;
        this.cdr.detectChanges();
      }
    });
  }

  enregistrerCandidature(): void {
    this.notifService.info(
      'Enregistrement candidature — disponible prochainement.'
    );
  }

  // ─── Navigation helpers ───────────────────────────────────────────────────────
  allerEtape(n: number): void {
    if (n <= Math.max(...this.etapesCompletes, 1) + 1) {
      this.etapeActive = n;
    }
  }

  etapePrecedente(): void {
    if (this.etapeActive > 1) this.etapeActive--;
  }

  estComplete(n: number): boolean {
    return this.etapesCompletes.includes(n);
  }

  statutCompetence(statut: string): string {
    if (statut === 'maitrise') return '✓';
    if (statut === 'partiel') return '~';
    return '✕';
  }

  couleurPriorite(priorite: string): string {
    if (priorite === 'haute') return '#8B1A1A';
    if (priorite === 'moyenne') return '#B8720A';
    return '#3B5E3A';
  }

  private calculerScoreLabel(score: number): string {
    if (score >= 85) return 'Excellent match';
    if (score >= 70) return 'Bon match';
    if (score >= 50) return 'Match partiel';
    return 'Match faible';
  }

  // ─── CV Preview helpers ───────────────────────────────────────────────────────
  get formationPrincipale() {
    return this.formationsCv[0] ?? null;
  }

  formatPeriode(exp: ProfilMeResponse['experiences'][0]): string {
    const debut = exp.dateDebut
      ? new Date(exp.dateDebut).toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        })
      : '';
    const fin = exp.dateFin
      ? new Date(exp.dateFin).toLocaleDateString('fr-FR', {
          month: 'short',
          year: 'numeric',
        })
      : 'Présent';
    return `${debut} – ${fin}`;
  }
}