import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
  import { environment } from '../../../../../environments/environment'
import { AdminService, AdminTemplateDto, TemplateBoxDto, TemplateLayoutId } from '../../../../core/services/admin.service';
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
import { CvComponentRenderer } from '../../../admin/template-editor/cv-component-renderer/cv-component-renderer';
import { CvData, buildCvDataFromProfil, presentLabelFor, ALL_PRESENT_VALUES } from './cv-data';
import { GenerateCvStateService } from '../../../../core/services/generate-cv-state.service';
import { CompetenceUpgradeService } from '../../../../core/services/competence-upgrade.service';
import { GapSessionStateService } from '../../../../core/services/gap-session-state.service';

interface CompetenceAnalysee {
  nom: string;
  statut: 'maitrise' | 'renforcer';
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

// Inverse de LANGUE_CODE — utilisé pour pré-remplir le select quand on charge un CV existant
const LANGUE_NAME: Record<string, string> = {
  'fr': 'Français',
  'en': 'Anglais',
  'ar': 'Arabe',
  'es': 'Espagnol',
};

@Component({
  selector: 'app-generate-cv',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CvComponentRenderer],
  templateUrl: './generate-cv.html',
  styleUrl: './generate-cv.scss',
})
export class GenerateCv implements OnInit {

  @ViewChild('cvPreview') cvPreviewRef!: ElementRef<HTMLElement>;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  // ─── Navigation (persisté) ───────────────────────────────────────────────────
  get etapeActive(): number { return this.cvState.state.etapeActive; }
  set etapeActive(v: number) { this.cvState.patch({ etapeActive: v }); }

  get etapesCompletes(): number[] { return this.cvState.state.etapesCompletes; }
  set etapesCompletes(v: number[]) { this.cvState.patch({ etapesCompletes: v }); }

  etapes = [
    { num: 1, label: "Offre d'emploi" },
    { num: 2, label: 'Analyse IA' },
    { num: 3, label: 'Choix du template' },
    { num: 4, label: 'Validation & export' },
  ];

  // ─── Loading states (local) ───────────────────────────────────────────────────
  chargementProfil = true;
  chargementTemplates = false;
  analyseEnCours = false;
  generationEnCours = false;
  telechargementEnCours = false;
  comblerEnCours = false;

  // ─── Profil (persisté) ───────────────────────────────────────────────────────
  get prenom(): string { return this.cvState.state.prenom; }
  set prenom(v: string) { this.cvState.patch({ prenom: v }); }

  get nom(): string { return this.cvState.state.nom; }
  set nom(v: string) { this.cvState.patch({ nom: v }); }

  get email(): string { return this.cvState.state.email; }
  set email(v: string) { this.cvState.patch({ email: v }); }

  get titre(): string { return this.cvState.state.titre; }
  set titre(v: string) { this.cvState.patch({ titre: v }); }

  get ville(): string { return this.cvState.state.ville; }
  set ville(v: string) { this.cvState.patch({ ville: v }); }

  get linkedIn(): string { return this.cvState.state.linkedIn; }
  set linkedIn(v: string) { this.cvState.patch({ linkedIn: v }); }

  get resume(): string { return this.cvState.state.resume; }
  set resume(v: string) { this.cvState.patch({ resume: v }); }

  get competencesCv(): CompetenceCvPreview[] { return this.cvState.state.competencesCv; }
  set competencesCv(v: CompetenceCvPreview[]) { this.cvState.patch({ competencesCv: v }); }

  get competencesNoms(): string[] { return this.cvState.state.competencesNoms; }
  set competencesNoms(v: string[]) { this.cvState.patch({ competencesNoms: v }); }

  // Non persisté — rechargé depuis profil à chaque visite
  experiencesCv: ProfilMeResponse['experiences'] = [];
  formationsCv: ProfilMeResponse['formations'] = [];

  // ─── Étape 1 (persisté) ───────────────────────────────────────────────────────
  get offreTexte(): string { return this.cvState.state.offreTexte; }
  set offreTexte(v: string) { this.cvState.patch({ offreTexte: v }); }

  // ─── Étape 2 (persisté) ───────────────────────────────────────────────────────
  get scoreCompatibilite(): number { return this.cvState.state.scoreCompatibilite; }
  set scoreCompatibilite(v: number) { this.cvState.patch({ scoreCompatibilite: v }); }

  get scoreLabel(): string { return this.cvState.state.scoreLabel; }
  set scoreLabel(v: string) { this.cvState.patch({ scoreLabel: v }); }

  get niveauLabel(): string { return this.cvState.state.niveauLabel; }
  set niveauLabel(v: string) { this.cvState.patch({ niveauLabel: v }); }

  get competencesAnalysees(): CompetenceAnalysee[] { return this.cvState.state.competencesAnalysees; }
  set competencesAnalysees(v: CompetenceAnalysee[]) { this.cvState.patch({ competencesAnalysees: v }); }

  get recommandations(): RecommandationsDto | null { return this.cvState.state.recommandations; }
  set recommandations(v: RecommandationsDto | null) { this.cvState.patch({ recommandations: v }); }

  get resumeIA(): string { return this.cvState.state.resumeIA; }
  set resumeIA(v: string) { this.cvState.patch({ resumeIA: v }); }

  // ─── Étape 3 (persisté partiellement) ────────────────────────────────────────
  templatesDisponibles: AdminTemplateDto[] = [];
  templateSelectionne: AdminTemplateDto | null = null;

  couleurs = ['#6B4E2A', '#3B5E3A', '#8B1A1A', '#1A3A5E'];

  get couleurAccent(): string { return this.cvState.state.couleurAccent; }
  set couleurAccent(v: string) { this.cvState.patch({ couleurAccent: v }); }

  langues = ['Français', 'Anglais', 'Arabe', 'Espagnol'];

  get langueSelectionnee(): string { return this.cvState.state.langueSelectionnee; }
  set langueSelectionnee(v: string) { this.cvState.patch({ langueSelectionnee: v }); }

  // ─── Étape 4 (persisté) ───────────────────────────────────────────────────────
  get cvCreeId(): number | null { return this.cvState.state.cvCreeId; }
  set cvCreeId(v: number | null) { this.cvState.patch({ cvCreeId: v }); }

  get resumeEdite(): string { return this.cvState.state.resumeEdite; }
  set resumeEdite(v: string) { this.cvState.patch({ resumeEdite: v }); }

  get titreCv(): string { return this.cvState.state.titreCv; }
  set titreCv(v: string) { this.cvState.patch({ titreCv: v }); }

  get scoreApresOptimisation(): number { return this.cvState.state.scoreApresOptimisation; }
  set scoreApresOptimisation(v: number) { this.cvState.patch({ scoreApresOptimisation: v }); }

  get pointsGagnes(): number { return this.cvState.state.pointsGagnes; }
  set pointsGagnes(v: number) { this.cvState.patch({ pointsGagnes: v }); }

  // ─── CV data (local — reconstruit depuis profil) ──────────────────────────────
  cvData: CvData | null = null;
  userHiddenFields: Partial<Record<string, string[]>> = {};

  constructor(
    private adminService: AdminService,
    private profilService: ProfilService,
    private cvService: CvService,
    private notifService: NotificationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    public cvState: GenerateCvStateService,
    private route: ActivatedRoute,
    private router: Router,
    private competenceUpgradeService: CompetenceUpgradeService,
    private gapSessionState: GapSessionStateService,
  ) {}

  ngOnInit(): void {
    // Toujours recharger le profil (données fraîches après édition profil)
    this.chargerProfil();

    // Si on revient à l'étape 3 avec des templates déjà chargés, les recharger
    if (this.cvState.hasAnalyse && this.etapeActive === 3) {
      this.chargerTemplates();
    }
  }

  // ─── Nouvelle analyse — reset complet ────────────────────────────────────────
  nouvelleAnalyse(): void {
    this.cvState.reset();
    this.cvData = null;
    this.templatesDisponibles = [];
    this.templateSelectionne = null;
    // Si la page est ouverte avec ?cvId=X depuis l'historique, on charge le
    // CV existant et on saute directement à l'étape 4 (validation/export).
    const cvIdParam = this.route.snapshot.queryParamMap.get('cvId');
    const cvId = cvIdParam ? Number(cvIdParam) : NaN;

    if (!isNaN(cvId)) {
      this.chargerCvExistant(cvId);
    } else {
      this.chargerProfil();
    }
  }

  // ─── Chargement d'un CV existant (depuis l'historique) ───────────────────────
  // → Charge profil + sections + status + le CV + les templates en parallèle,
  //   pré-remplit l'éditeur avec le template/couleur/langue du CV, puis saute
  //   directement à l'étape 4 où l'user peut éditer et re-télécharger.
  private chargerCvExistant(cvId: number): void {
    this.chargementProfil = true;

    forkJoin({
      profil: this.profilService.getMe(),
      status: this.authService.getStatus(),
      sections: this.profilService.getSections(),
      cv: this.cvService.getCv(cvId),
      templates: this.http.get<AdminTemplateDto[]>(
       `${environment.backendUrl}/api/templates`,
        { withCredentials: true },
      ),
    }).subscribe({
      next: ({ profil, status, sections, cv, templates }) => {
        // 1. Données de profil (identique à chargerProfil)
        this.titre = profil.titre ?? '';
        this.ville = profil.adresse ?? '';
        this.linkedIn = profil.linkedIn ?? '';
        this.resume = profil.description ?? '';

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

        // 2. Données issues du CV existant : on pré-remplit le template, la
        //    couleur et la langue choisis lors de la 1ère génération.
        this.cvCreeId = cv.id;
        this.templatesDisponibles = templates;
        this.templateSelectionne =
          templates.find(t => t.id === cv.templateId) ?? templates[0] ?? null;
        this.couleurAccent = cv.styles?.couleurPrimaire || this.couleurAccent;
        this.langueSelectionnee = LANGUE_NAME[cv.langue] ?? 'Français';

        // 3. Titre du CV : on récupère celui stocké si dispo, sinon on construit
        this.resumeEdite = (cv.contenu?.resume as string) || profil.description || '';
        this.titreCv = (cv.contenu?.titre as string)
                    || this.titre
                    || `CV — ${this.prenom} ${this.nom}`.trim();

        // 4. cvData : on reconstruit depuis le profil courant (l'utilisateur
        //    pourra éditer ses champs inline). Le contenu est éphémère côté
        //    frontend de toute façon — l'export PDF se fait depuis le DOM.
        this.cvData = buildCvDataFromProfil(
          profil,
          { prenom: this.prenom, nom: this.nom, email: this.email },
          this.langueCode,
          sections,
        );

        // 5. On marque les 3 premières étapes comme complètes et on saute à la 4ème
        this.etapesCompletes = [1, 2, 3];
        this.etapeActive = 4;
        this.scoreApresOptimisation = 0;
        this.pointsGagnes = 0;

        this.chargementProfil = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifService.error('Impossible de charger ce CV. Démarrage d\'un nouveau CV à la place.');
        // Fallback : flux normal depuis l'étape 1
        this.chargerProfil();
      }
    });
  }

  // ─── Chargement profil ───────────────────────────────────────────────────────
  private chargerProfil(): void {
    this.chargementProfil = true;

    forkJoin({
      profil: this.profilService.getMe(),
      status: this.authService.getStatus(),
      sections: this.profilService.getSections(),
    }).subscribe({
      next: ({ profil, status, sections }) => {
        this.titre = profil.titre ?? '';
        this.ville = profil.adresse ?? '';
        this.linkedIn = profil.linkedIn ?? '';
        this.resume = profil.description ?? '';

        // Ne pas écraser resumeEdite si l'utilisateur l'a déjà modifié
        if (!this.cvState.state.resumeEdite) {
          this.resumeEdite = profil.description ?? '';
        }

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

        if (!this.cvState.state.titreCv) {
          this.titreCv = this.titre || `CV — ${this.prenom} ${this.nom}`.trim();
        }

        this.cvData = buildCvDataFromProfil(
          profil,
          { prenom: this.prenom, nom: this.nom, email: this.email },
          this.langueCode,
          sections,
        );

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

  private chargerTemplates(): void {
    this.chargementTemplates = true;
    this.http.get<AdminTemplateDto[]>('http://localhost:5000/api/templates', {
      withCredentials: true,
    }).subscribe({
      next: (templates) => {
        this.templatesDisponibles = templates;
        const savedId = this.cvState.state.templateId;
        this.templateSelectionne = templates.find(t => t.id === savedId) ?? templates[0] ?? null;
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

    // If offer came from image, offreTexte is empty — use the AI summary as fallback
    if (!this.offreTexte.trim()) {
      this.offreTexte = res.resume ?? '';
    }

    const matchSet = new Set((res.competences_match ?? []).map(n => n.toLowerCase()));
    const manquantSet = new Set((res.competences_manquantes ?? []).map(n => n.toLowerCase()));

    this.competencesAnalysees = [
      ...(res.competences_match ?? []).map(nom => ({ nom, statut: 'maitrise' as const })),
      ...(res.competences_manquantes ?? []).map(nom => ({ nom, statut: 'renforcer' as const })),
    ];

    this.analyseEnCours = false;
    this.cvState.patch({ etapesCompletes: [...this.etapesCompletes, 1] });
    this.etapeActive = 2;
    this.cdr.detectChanges();
  }

  // ─── Étape 2 → 3 ─────────────────────────────────────────────────────────────
  allerEtape3(): void {
    this.cvState.patch({ etapesCompletes: [...this.etapesCompletes, 2] });
    this.etapeActive = 3;

    this.http.get<AdminTemplateDto[]>(`${environment.backendUrl}/api/templates`, {
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

    // ─── Gérer les écarts/Gaps ──────────────────────────────────────────────────

  /**
  * Builds the CreateGapSessionRequest from the current analysis state,
  * calls the backend to persist it, stores the result in GapSessionStateService,
  * then navigates to /user/competence-upgrade?sessionId=X.
  *
  * Called from:
  *  (a) the "Combler les écarts" button on step 2
  *  (b) telechargerPdf() — so gaps are always saved when a CV is downloaded
  */
  private sauvegarderGapSession(): Promise<number | null> {
    const toutes = this.competencesAnalysees
      .filter(c => c.statut === 'renforcer')
      .map(c => ({ nomCompetence: c.nom, priorite: 'haute' as const }));
    if (!toutes.length) return Promise.resolve(null);

    return new Promise((resolve) => {
      this.competenceUpgradeService.createGapSession({
        texteOffre:           this.offreTexte || this.resumeIA || '',
        titreOffre:           undefined,   // AI doesn't return a parsed title
        entreprise:           undefined,   // AI doesn't return a parsed company
        scoreCompatibilite:   this.scoreCompatibilite,
        competencesManquantes: toutes,
      }).subscribe({
        next: ({ sessionId }) => resolve(sessionId),
        error: ()            => resolve(null),   // non-blocking — CV download must not fail
      });
    });
  }

  async comblerLesEcarts(): Promise<void> {
    if (this.comblerEnCours) return;
    this.comblerEnCours = true;

    const sessionId = await this.sauvegarderGapSession();

    if (!sessionId) {
      this.notifService.error(
        'Impossible de sauvegarder les écarts. Veuillez réessayer.'
      );
      this.comblerEnCours = false;
      this.cdr.detectChanges();
      return;
    }

    // Fetch the full session detail so the upgrade page has it immediately
    this.competenceUpgradeService.getGapSessionDetail(sessionId).subscribe({
      next: (detail) => {
        this.gapSessionState.setSession(detail);
        this.comblerEnCours = false;
        this.router.navigate(['/user/competence-upgrade'], {
          queryParams: { sessionId },
        });
      },
      error: () => {
        // Still navigate — upgrade page will fetch it on its own
        this.gapSessionState.setSessionId(sessionId);
        this.comblerEnCours = false;
        this.router.navigate(['/user/competence-upgrade'], {
          queryParams: { sessionId },
        });
      },
    });
  }

  // ─── Étape 3 → 4 ─────────────────────────────────────────────────────────────
  generer(): void {
    if (!this.templateSelectionne) {
      this.notifService.warning('Veuillez sélectionner un template.');
      return;
    }

    this.generationEnCours = true;
    this.cvState.patch({ templateId: this.templateSelectionne.id });

    this.cvService.creerCv({
      templateId: this.templateSelectionne.id,
      couleurPrimaire: this.couleurAccent,
      langue: LANGUE_CODE[this.langueSelectionnee] ?? 'fr',
    }).subscribe({
      next: (cv) => {
        this.cvCreeId = cv.id;
        this.scoreApresOptimisation = Math.min(100, this.scoreCompatibilite + 6);
        this.pointsGagnes = this.scoreApresOptimisation - this.scoreCompatibilite;
        this.generationEnCours = false;
        this.cvState.patch({ etapesCompletes: [...this.etapesCompletes, 3] });
        this.etapeActive = 4;
        this.notifService.success('CV généré avec succès !');
        this.cdr.detectChanges();
      },
      error: () => {
        this.notifService.error('Erreur lors de la génération du CV. Veuillez réessayer.');
        this.generationEnCours = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Étape 4 — PDF ───────────────────────────────────────────────────────────
  telechargerPdf(): void {
    if (!this.cvCreeId) {
      this.notifService.warning('Aucun CV généré à télécharger.');
      return;
    }

    const previewEl = this.cvPreviewRef?.nativeElement;
    if (!previewEl) {
      this.notifService.error('Aperçu CV introuvable.');
      return;
    }

    const cleanedHtml = this.cleanPreviewForPdf(previewEl);
    const styles = this.collectRelevantStyles(previewEl);

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${styles}</style>
</head>
<body>
  ${cleanedHtml}
</body>
</html>`;

    this.telechargementEnCours = true;

    // Capture le prénom/nom RÉELLEMENT présents dans le PDF (= ce que l'user a
    // tapé inline dans l'aperçu, ou les valeurs initiales venant du profil).
    const infosPerso = (this.cvData?.['infos-personnelles'] ?? {}) as { prenom?: string; nom?: string };
    const prenomPdf = (infosPerso.prenom ?? this.prenom).trim();
    const nomPdf    = (infosPerso.nom    ?? this.nom).trim();

    // Construit le nom du fichier dans l'ordre CV_Nom_Prenom.pdf
    // en utilisant les valeurs réellement présentes dans le PDF
    let downloadName = 'CV.pdf';
    if (nomPdf && prenomPdf)      downloadName = `CV_${nomPdf}_${prenomPdf}.pdf`;
    else if (nomPdf)              downloadName = `CV_${nomPdf}.pdf`;
    else if (prenomPdf)           downloadName = `CV_${prenomPdf}.pdf`;

    this.cvService.exporterPdf(this.cvCreeId, htmlContent, prenomPdf, nomPdf).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.telechargementEnCours = false;
        this.notifService.success('CV téléchargé avec succès !');
        // ── NEW: persist gap session silently after PDF download ──────────
        // Only if there are skills to save and no session has been saved yet
        const hasGaps = this.competencesAnalysees.some(c => c.statut === 'renforcer');
        if (hasGaps) {
          this.sauvegarderGapSession().then(sessionId => {
            if (sessionId) {
              this.competenceUpgradeService.getGapSessionDetail(sessionId).subscribe({
                next: (detail) => this.gapSessionState.setSession(detail),
                error: ()      => this.gapSessionState.setSessionId(sessionId),
              });
            }
          });
        }
        // ─────────────────────────────────────────────────────────────────
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
    this.notifService.info('Enregistrement candidature — disponible prochainement.');
  }

  // ─── Étape 4 — Lettre de motivation ──────────────────────────────────────────
  genererLettreMotivation(): void {
    if (!this.cvCreeId) {
      this.notifService.warning('Veuillez d\'abord générer votre CV.');
      return;
    }

    this.router.navigate(['/user/lettre-motivation'], {
      queryParams: {
        cvId: this.cvCreeId,
        offreText: this.offreTexte,
      },
    });
  }

  // ─── CSS pour PDF ─────────────────────────────────────────────────────────────
  private collectRelevantStyles(previewEl: HTMLElement): string {
    const out: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule) {
          if (this.selectorMatchesPreview(rule.selectorText, previewEl)) out.push(rule.cssText);
        } else if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
          const inner: string[] = [];
          for (const sub of Array.from(rule.cssRules)) {
            if (sub instanceof CSSStyleRule && this.selectorMatchesPreview(sub.selectorText, previewEl)) {
              inner.push(sub.cssText);
            }
          }
          if (inner.length) {
            const cond = rule instanceof CSSMediaRule
              ? `@media ${rule.media.mediaText}`
              : `@supports ${(rule as any).conditionText}`;
            out.push(`${cond} { ${inner.join(' ')} }`);
          }
        } else if (rule instanceof CSSFontFaceRule || rule instanceof CSSKeyframesRule) {
          out.push(rule.cssText);
        }
      }
    }
    return out.join('\n');
  }

  private selectorMatchesPreview(selectorText: string, previewEl: HTMLElement): boolean {
    for (const sel of selectorText.split(',').map(s => s.trim()).filter(Boolean)) {
      try {
        if (previewEl.matches(sel) || previewEl.querySelector(sel)) return true;
      } catch { }
    }
    return false;
  }

  private cleanPreviewForPdf(previewEl: HTMLElement): string {
    const root = previewEl.cloneNode(true) as HTMLElement;

    const liveInputs = previewEl.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input.ed, textarea.ed-area');
    const cloneInputs = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input.ed, textarea.ed-area');

    cloneInputs.forEach((cloneEl, i) => {
      const value = (liveInputs[i]?.value ?? '').trim();
      if (value) {
        const span = document.createElement('span');
        span.textContent = value;
        cloneEl.classList.forEach(c => { if (c !== 'ed' && c !== 'ed-area') span.classList.add(c); });
        cloneEl.replaceWith(span);
      } else {
        cloneEl.remove();
      }
    });

    root.querySelectorAll('.ed-rm, .ed-add').forEach(el => el.remove());
    root.querySelectorAll<HTMLElement>('span.cv-li-mid').forEach(el => {
      if (el.children.length === 0 && /^\s*[—·–\-]?\s*$/.test(el.textContent || '')) el.remove();
    });
    root.querySelectorAll<HTMLElement>('li').forEach(el => {
      if (el.children.length === 0) {
        const txt = (el.textContent || '').trim();
        if (txt.length <= 2 && !/[a-zA-ZÀ-ÿ0-9]/.test(txt)) el.remove();
      }
    });
    root.querySelectorAll<HTMLElement>('.cv-list-item, .cv-skill, .cv-langue').forEach(el => {
      if (!el.textContent?.trim()) el.remove();
    });

    return root.outerHTML;
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────
  allerEtape(n: number): void {
    if (n <= Math.max(...this.etapesCompletes, 1) + 1) this.etapeActive = n;
  }

  etapePrecedente(): void {
    if (this.etapeActive > 1) this.etapeActive--;
  }

  estComplete(n: number): boolean {
    return this.etapesCompletes.includes(n);
  }

  statutCompetence(statut: string): string {
    if (statut === 'maitrise') return '✓';
    return '✕';
  }

  couleurPriorite(statut: string): string {
    return statut === 'maitrise' ? '✓' : '✕';
  }

  get competencesManquantesNoms(): string[] {
    return this.cvState.competencesManquantes;
  }

  private calculerScoreLabel(score: number): string {
    if (score >= 85) return 'Excellent match';
    if (score >= 70) return 'Bon match';
    if (score >= 50) return 'Match partiel';
    return 'Match faible';
  }

  // ─── CV preview helpers ───────────────────────────────────────────────────────
  get formationPrincipale() { return this.formationsCv[0] ?? null; }

  get langueCode(): string { return LANGUE_CODE[this.langueSelectionnee] ?? 'fr'; }

  onLanguageChange(): void {
    if (!this.cvData) return;
    const newPresent = presentLabelFor(this.langueCode);
    for (const exp of this.cvData['experiences'] ?? []) {
      if (ALL_PRESENT_VALUES.includes(exp.dateFin)) exp.dateFin = newPresent;
    }
  }

  onFieldHide(componentType: string, fieldKey: string): void {
    const list = this.userHiddenFields[componentType] ?? [];
    if (!list.includes(fieldKey)) {
      this.userHiddenFields = { ...this.userHiddenFields, [componentType]: [...list, fieldKey] };
    }
  }

  hiddenFieldsFor(componentType: string): string[] {
    return this.userHiddenFields[componentType] ?? [];
  }

  get templateBoxes(): TemplateBoxDto[] { return this.templateSelectionne?.structure?.boxes ?? []; }

  get templateLayoutId(): TemplateLayoutId {
    return (this.templateSelectionne?.structure?.layout as TemplateLayoutId) || 'sidebar-left';
  }

  get hasTemplateStructure(): boolean {
    const boxes = this.templateBoxes;
    return boxes.length > 0 && boxes.some(b => b.components.length > 0);
  }

  trackBoxById = (_: number, b: TemplateBoxDto) => b.id;
  trackComponentById = (_: number, c: { id: string }) => c.id;

  formatPeriode(exp: ProfilMeResponse['experiences'][0]): string {
    const debut = exp.dateDebut
      ? new Date(exp.dateDebut).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      : '';
    const fin = exp.dateFin
      ? new Date(exp.dateFin).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
      : 'Présent';
    return `${debut} – ${fin}`;
  }
}