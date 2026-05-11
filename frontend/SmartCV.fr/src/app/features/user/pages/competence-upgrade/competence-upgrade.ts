import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfilService } from '../../../../core/services/profil.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GenerateCvStateService } from '../../../../core/services/generate-cv-state.service';
import { RoadmapResumeService } from '../../../../core/services/roadmap-resume.service';
import {
  CompetenceUpgradeService,
  CompetenceGapDto,
  QuestionDto,
  ReponseDto,
  EtapeRoadmapDto,
  RoadmapDetailDto,
} from '../../../../core/services/competence-upgrade.service';

type Etape = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface EtapeInfo {
  num: number;
  label: string;
}

// Per-skill progress stored in memory and partially in localStorage
interface SkillProgress {
  testId: number;
  roadmapId: number;
  questions: QuestionDto[];
  scoreInitial: number;
  niveauInitial: string;
  roadmapEtapes: EtapeRoadmapDto[];
  objectifFinal: string;
  etapesCompletees: boolean[];  // persisted to localStorage
  etapeActive: Etape;
}

const STORAGE_PREFIX = 'smartcv_roadmap_progress_';

@Component({
  selector: 'app-competence-upgrade',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './competence-upgrade.html',
  styleUrl: './competence-upgrade.scss',
})
export class CompetenceUpgrade implements OnInit {

  // ─── Stepper ──────────────────────────────────────────────────────────────
  etapeActive: Etape = 1;
  etapes: EtapeInfo[] = [
    { num: 1, label: 'Écarts détectés' },
    { num: 2, label: 'Choix compétence' },
    { num: 3, label: 'Test de niveau' },
    { num: 4, label: 'Roadmap IA' },
    { num: 5, label: 'Parcours' },
    { num: 6, label: 'Certification' },
    { num: 7, label: 'Profil mis à jour' },
  ];

  // ─── Étape 1 : Gaps ───────────────────────────────────────────────────────
  chargementGaps = false;
  competencesManquantes: CompetenceGapDto[] = [];
  competencesActuelles: string[] = [];
  competencesRequises: string[] = [];
  offreTitre = '';
  offreEntreprise = '';
  offreVille = '';
  dateAnalyse = '';
  totalManquantes = 0;

  // ─── Étape 2 : Sélection ──────────────────────────────────────────────────
  competenceSelectionnee: CompetenceGapDto | null = null;

  // ─── Multi-skill progress map ─────────────────────────────────────────────
  skillProgressMap: Map<string, SkillProgress> = new Map();

  // ─── Active skill state (shortcuts into skillProgressMap) ─────────────────
  chargementTest = false;
  chargementRoadmap = false;

  get activeSkillKey(): string {
    return this.competenceSelectionnee?.nom ?? '';
  }

  get activeProgress(): SkillProgress | null {
    return this.skillProgressMap.get(this.activeSkillKey) ?? null;
  }

  get testId(): number { return this.activeProgress?.testId ?? 0; }
  get questions(): QuestionDto[] { return this.activeProgress?.questions ?? []; }
  get scoreInitial(): number { return this.activeProgress?.scoreInitial ?? 0; }
  get niveauInitial(): string { return this.activeProgress?.niveauInitial ?? ''; }
  get roadmapId(): number { return this.activeProgress?.roadmapId ?? 0; }
  get roadmapEtapes(): EtapeRoadmapDto[] { return this.activeProgress?.roadmapEtapes ?? []; }
  get objectifFinal(): string { return this.activeProgress?.objectifFinal ?? ''; }
  get etapesCompletees(): boolean[] { return this.activeProgress?.etapesCompletees ?? []; }

  // ─── Étape 3 : Test ───────────────────────────────────────────────────────
  questionCourante = 0;
  reponseSelectionnee: string | null = null;
  reponses: ReponseDto[] = [];

  // ─── Étape 5 : Parcours ───────────────────────────────────────────────────
  get progressionParcours(): number {
    if (!this.roadmapEtapes.length) return 0;
    return Math.round((this.etapesCompletees.filter(Boolean).length / this.roadmapEtapes.length) * 100);
  }

  get toutesEtapesCompletees(): boolean {
    return this.roadmapEtapes.length > 0 && this.etapesCompletees.every(Boolean);
  }

  // ─── Étape 6 : Certification ──────────────────────────────────────────────
  questionsCertif: QuestionDto[] = [];
  questionCouranteCertif = 0;
  reponseSelectionnoCertif: string | null = null;
  reponsesCertif: ReponseDto[] = [];
  scoreFinale = 0;
  competenceValidee = false;
  peutReessayer = false;
  resultatCertifAffiche = false;
  messageCertif = '';
  niveauCertif = '';

  // ─── Étape 7 : Succès ─────────────────────────────────────────────────────
  niveauValide = '';
  profilNom = '';
  profilPrenom = '';
  profilTitre = '';
  profilCompetences: string[] = [];

  // ─── Skills in progress (shown in sidebar for quick switching) ────────────
  get skillsEnCours(): { nom: string; etape: Etape }[] {
    return Array.from(this.skillProgressMap.entries())
      .filter(([, p]) => p.etapeActive < 7)
      .map(([nom, p]) => ({ nom, etape: p.etapeActive }));
  }

  constructor(
    private competenceUpgradeService: CompetenceUpgradeService,
    private profilService: ProfilService,
    private notif: NotificationService,
    private generateCvState: GenerateCvStateService,
    private roadmapResumeService: RoadmapResumeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.chargerProfil();

    const resume = this.roadmapResumeService.consumeResume();
    if (resume) {
      this.restaurerDepuisHistorique(resume);
    } else {
      this.chargerGapsDepuisState();
    }
  }

  // ─── Restore from history ─────────────────────────────────────────────────
  // FIX: use roadmapId (not id), niveauDetecte (not niveau), null-safe test,
  //      and phase-based step mapping from backend's derived state.
  private restaurerDepuisHistorique(detail: RoadmapDetailDto): void {
    const comp: CompetenceGapDto = { nom: detail.nomCompetence, priorite: 'haute' };
    this.competenceSelectionnee = comp;

    // Restore localStorage parcours progress if available
    // FIX: backend uses roadmapId, not id
    const savedProgress = this.loadParcoursFromStorage(detail.roadmapId);

    // FIX: map backend phase → local etape number
    // Phase is the authoritative state; fallback to flag-based logic if absent
    const etapeFromPhase = (phase: RoadmapDetailDto['phase']): Etape => {
      switch (phase) {
        case 'Validee':          return 7;
        case 'PreteAuTestFinal':
        case 'TestFinalEchoue':  return 6;
        case 'AParcourir':
        default:                 return 5;
      }
    };

    const etapeActive = etapeFromPhase(detail.phase);

    const progress: SkillProgress = {
      // FIX: null-safe test — test can be null per the updated DTO
      testId:           detail.test?.id ?? 0,
      roadmapId:        detail.roadmapId,           // FIX: was detail.id
      questions:        detail.test?.questions ?? [], // populated by backend TestInfoDto fix
      scoreInitial:     detail.test?.score ?? 0,
      niveauInitial:    detail.test?.niveauDetecte ?? '', // FIX: was detail.test.niveau
      roadmapEtapes:    detail.etapes,
      objectifFinal:    '',
      etapesCompletees: savedProgress ?? new Array(detail.etapes.length).fill(false),
      etapeActive,
    };

    // Must set map BEFORE calling lancerCertification so this.questions resolves
    this.skillProgressMap.set(detail.nomCompetence, progress);
    this.etapeActive = etapeActive;

    if (etapeActive === 6) {
      this.lancerCertification();
    }

    this.cdr.detectChanges();
  }

  // ─── Chargement profil ────────────────────────────────────────────────────
  chargerProfil(): void {
    this.profilService.getMe().subscribe({
      next: (profil) => {
        this.competencesActuelles = profil.competences.map(c => c.nom);
        this.profilCompetences = [...this.competencesActuelles];
        this.profilTitre = profil.titre ?? '';
      },
      error: () => {},
    });
    const state = this.generateCvState.state;
    if (state.prenom || state.nom) {
      this.profilNom = state.nom;
      this.profilPrenom = state.prenom;
    }
  }

  // ─── Gaps depuis l'analyse GenCV ─────────────────────────────────────────
  chargerGapsDepuisState(): void {
    const state = this.generateCvState.state;

    if (this.generateCvState.hasAnalyse && state.competencesAnalysees.length > 0) {
      const manquantes = state.competencesAnalysees
        .filter(c => c.statut === 'renforcer')
        .map(c => ({ nom: c.nom, priorite: 'haute' as const }));

      const partielles = state.competencesAnalysees
        .filter(c => c.statut === 'partiel')
        .map(c => ({ nom: c.nom, priorite: 'renforcer' as const }));

      this.competencesManquantes = [...manquantes, ...partielles];
      this.offreTitre = 'Offre analysée';
      this.totalManquantes = this.competencesManquantes.length;
      this.competencesRequises = [
        ...state.competencesAnalysees
          .filter(c => c.statut === 'maitrise')
          .map(c => c.nom + ' +'),
        ...this.competencesManquantes.map(c => c.nom + ' -'),
      ];
      return;
    }

    this.competencesManquantes = [];
    this.chargementGaps = false;
  }

  // ─── Sidebar droite ───────────────────────────────────────────────────────
  get offreAnalyseeInfo() {
    return {
      titre: this.offreTitre || 'Offre analysée',
      entreprise: this.offreEntreprise,
      ville: this.offreVille,
      dateAnalyse: this.dateAnalyse,
    };
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  estComplete(num: number): boolean {
    return num < this.etapeActive;
  }

  allerEtape(num: number): void {
    if (num < this.etapeActive) this.etapeActive = num as Etape;
  }

  allerEtape2(): void {
    this.etapeActive = 2;
  }

  selectionnerEtLancer(comp: CompetenceGapDto): void {
    this.competenceSelectionnee = comp;

    const existing = this.skillProgressMap.get(comp.nom);
    if (existing) {
      this.etapeActive = existing.etapeActive;
      this.questionCourante = 0;
      this.reponses = [];
      this.reponseSelectionnee = null;
      this.cdr.detectChanges();
      return;
    }

    this.lancerTest();
  }

  // ─── Switch between skills in progress ────────────────────────────────────
  switcherSkill(nom: string): void {
    const comp = this.competencesManquantes.find(c => c.nom === nom)
      ?? { nom, priorite: 'haute' as const };
    this.selectionnerEtLancer(comp);
  }

  // ─── Étape 2 → 3 : Lancer test ───────────────────────────────────────────
  lancerTest(): void {
    if (!this.competenceSelectionnee || this.chargementTest) return;
    this.chargementTest = true;
    this.etapeActive = 3;
    this.questionCourante = 0;
    this.reponses = [];
    this.reponseSelectionnee = null;
    this.cdr.detectChanges();

    this.competenceUpgradeService.genererTest(this.competenceSelectionnee.nom).subscribe({
      next: (res) => {
        const progress: SkillProgress = {
          testId: res.testId,
          roadmapId: 0,
          questions: res.questions ?? [],
          scoreInitial: 0,
          niveauInitial: '',
          roadmapEtapes: [],
          objectifFinal: '',
          etapesCompletees: [],
          etapeActive: 3,
        };

        if (progress.questions.length === 0) {
          this.notif.error('Le test n\'a pas pu être généré. Veuillez réessayer.');
          this.chargementTest = false;
          this.etapeActive = 2;
          this.cdr.detectChanges();
          return;
        }

        this.skillProgressMap.set(this.activeSkillKey, progress);
        this.chargementTest = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Erreur lors de la génération du test.');
        this.chargementTest = false;
        this.etapeActive = 2;
        this.cdr.detectChanges();
      },
    });
  }

  choisirReponse(choix: string): void {
    this.reponseSelectionnee = choix;
  }

  questionSuivante(): void {
    if (this.reponseSelectionnee === null) return;
    const q = this.questions[this.questionCourante];
    this.reponses.push({ Numero: q.Numero, ReponseChoisie: this.reponseSelectionnee });
    this.reponseSelectionnee = null;

    if (this.questionCourante < this.questions.length - 1) {
      this.questionCourante++;
    } else {
      this.evaluerTest();
    }
  }

  evaluerTest(): void {
    this.competenceUpgradeService.evaluerTest(this.testId, this.reponses).subscribe({
      next: (res) => {
        const progress = this.skillProgressMap.get(this.activeSkillKey);
        if (progress) {
          progress.scoreInitial = res.score;
          progress.niveauInitial = res.niveau;
        }
        this.cdr.detectChanges();
        this.genererRoadmap();
      },
      error: () => {
        this.notif.error('Erreur lors de l\'évaluation. Veuillez réessayer.');
        this.chargementTest = false;
        this.etapeActive = 2;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Étape 4 : Roadmap ────────────────────────────────────────────────────
  genererRoadmap(): void {
    this.chargementRoadmap = true;
    this.etapeActive = 4;
    this.cdr.detectChanges();

    this.competenceUpgradeService.genererRoadmap(this.testId).subscribe({
      next: (res) => {
        const progress = this.skillProgressMap.get(this.activeSkillKey);
        if (progress) {
          progress.roadmapId = res.roadmapId;
          progress.roadmapEtapes = res.etapes;
          progress.objectifFinal = res.objectifFinal;
          progress.etapesCompletees = new Array(res.etapes.length).fill(false);
          progress.etapeActive = 4;
        }
        this.chargementRoadmap = false;
        this.cdr.detectChanges();
      },
      error: () => {
        const progress = this.skillProgressMap.get(this.activeSkillKey);
        if (progress) {
          progress.roadmapId = 0;
          progress.roadmapEtapes = [
            { ordre: 1, type: 'video', titre: `${this.competenceSelectionnee?.nom} Full Course`, description: 'Regarder la vidéo complète', url: 'https://www.youtube.com', duree: '~2h30' },
            { ordre: 2, type: 'doc', titre: `Lire la doc officielle ${this.competenceSelectionnee?.nom}`, description: 'Sections principales', url: null, duree: '~1h' },
            { ordre: 3, type: 'projet', titre: 'Réaliser et publier le mini-projet', description: 'Publier sur GitHub avec README', url: null, duree: '~3h' },
          ];
          progress.etapesCompletees = new Array(progress.roadmapEtapes.length).fill(false);
          progress.etapeActive = 4;
        }
        this.chargementRoadmap = false;
        this.cdr.detectChanges();
      },
    });
  }

  demarrerParcours(): void {
    const progress = this.skillProgressMap.get(this.activeSkillKey);
    if (progress) progress.etapeActive = 5;
    this.etapeActive = 5;
    this.cdr.detectChanges();
  }

  // ─── Étape 5 : Parcours ───────────────────────────────────────────────────
  toggleEtape(index: number): void {
    const progress = this.skillProgressMap.get(this.activeSkillKey);
    if (!progress) return;
    progress.etapesCompletees[index] = !progress.etapesCompletees[index];
    this.saveParcoursToStorage(progress.roadmapId, progress.etapesCompletees);
    this.cdr.detectChanges();
  }

  passerCertification(): void {
    if (this.roadmapId) {
      this.competenceUpgradeService.marquerRoadmapSuivie(this.roadmapId).subscribe({ error: () => {} });
    }
    const progress = this.skillProgressMap.get(this.activeSkillKey);
    if (progress) progress.etapeActive = 6;
    this.lancerCertification();
  }

  // ─── Étape 6 : Certification ──────────────────────────────────────────────
  lancerCertification(): void {
    this.etapeActive = 6;
    this.questionsCertif = [...this.questions];
    this.questionCouranteCertif = 0;
    this.reponsesCertif = [];
    this.reponseSelectionnoCertif = null;
    this.resultatCertifAffiche = false;
    this.messageCertif = '';
    this.niveauCertif = '';
    this.cdr.detectChanges();
  }

  choisirReponseCertif(choix: string): void {
    this.reponseSelectionnoCertif = choix;
  }

  questionSuivanteCertif(): void {
    if (this.reponseSelectionnoCertif === null) return;
    const q = this.questionsCertif[this.questionCouranteCertif];
    this.reponsesCertif.push({ Numero: q.Numero, ReponseChoisie: this.reponseSelectionnoCertif });
    this.reponseSelectionnoCertif = null;
    if (this.questionCouranteCertif < this.questionsCertif.length - 1) {
      this.questionCouranteCertif++;
    }
  }

  voirResultat(): void {
    if (this.reponseSelectionnoCertif) {
      const q = this.questionsCertif[this.questionCouranteCertif];
      this.reponsesCertif.push({ Numero: q.Numero, ReponseChoisie: this.reponseSelectionnoCertif });
    }
    this.evaluerCertification();
  }

  evaluerCertification(): void {
    this.competenceUpgradeService.repasserTest(this.roadmapId, this.reponsesCertif).subscribe({
      next: (res) => {
        this.scoreFinale = res.score;
        this.competenceValidee = res.competenceAjoutee;
        this.peutReessayer = res.peutReessayer;
        this.niveauCertif = res.niveau;
        this.messageCertif = res.message || '';

        if (this.competenceValidee) {
          this.niveauValide = res.niveau;
          this.profilCompetences = [...this.profilCompetences, this.competenceSelectionnee!.nom + ' ✓'];
          this.clearParcoursFromStorage(this.roadmapId);
          const progress = this.skillProgressMap.get(this.activeSkillKey);
          if (progress) progress.etapeActive = 7;
          this.etapeActive = 7;
        } else {
          this.resultatCertifAffiche = true;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Erreur lors de l\'évaluation finale.');
      },
    });
  }

  get bonnesReponsesCertif(): number {
    return Math.round((this.scoreFinale / 100) * (this.questionsCertif.length || 12));
  }

  get totalQuestionsCertif(): number {
    return this.questionsCertif.length || 12;
  }

  get pointsManquantsCertif(): number {
    return Math.max(0, 80 - this.scoreFinale);
  }

  revoirRoadmap(): void {
    this.resultatCertifAffiche = false;
    this.etapeActive = 5;
    this.cdr.detectChanges();
  }

  reessayerCertification(): void {
    this.lancerCertification();
  }

  // ─── Étape 7 : Continuer ──────────────────────────────────────────────────
  continuerCompetencesRestantes(): void {
    this.competencesManquantes = this.competencesManquantes.filter(
      c => c.nom !== this.competenceSelectionnee?.nom
    );
    if (this.competenceSelectionnee) {
      this.skillProgressMap.delete(this.competenceSelectionnee.nom);
    }
    this.competenceSelectionnee = null;
    this.reponses = [];
    this.reponsesCertif = [];
    this.questionCourante = 0;
    this.questionCouranteCertif = 0;
    this.etapeActive = 1;
    this.cdr.detectChanges();
  }

  // ─── localStorage helpers for parcours progress ───────────────────────────
  private storageKey(roadmapId: number): string {
    return `${STORAGE_PREFIX}${roadmapId}`;
  }

  private saveParcoursToStorage(roadmapId: number, etapesCompletees: boolean[]): void {
    if (!roadmapId) return;
    try {
      localStorage.setItem(this.storageKey(roadmapId), JSON.stringify(etapesCompletees));
    } catch { /* localStorage unavailable */ }
  }

  private loadParcoursFromStorage(roadmapId: number): boolean[] | null {
    try {
      const raw = localStorage.getItem(this.storageKey(roadmapId));
      if (!raw) return null;
      return JSON.parse(raw) as boolean[];
    } catch { return null; }
  }

  private clearParcoursFromStorage(roadmapId: number): void {
    try {
      localStorage.removeItem(this.storageKey(roadmapId));
    } catch { /* localStorage unavailable */ }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  labelPriorite(priorite: string): string {
    switch (priorite) {
      case 'haute': return 'Priorité haute';
      case 'renforcer': return 'À renforcer';
      default: return 'À évaluer';
    }
  }

  iconEtapeType(type: string): string {
    switch (type) {
      case 'video': return '▶';
      case 'doc': return '□';
      case 'projet': return '✦';
      default: return '○';
    }
  }

  get estDerniereQuestionTest(): boolean {
    return this.questionCourante === this.questions.length - 1;
  }

  get estDerniereQuestionCertif(): boolean {
    return this.questionCouranteCertif === this.questionsCertif.length - 1;
  }

  get niveauInitialLabel(): string {
    const map: Record<string, string> = { Debutant: 'Débutant', Moyen: 'Moyen', Expert: 'Expert' };
    return map[this.niveauInitial] ?? this.niveauInitial;
  }

  get niveauValideLabel(): string {
    const map: Record<string, string> = { Debutant: 'Débutant', Moyen: 'Moyen', Expert: 'Expert' };
    return map[this.niveauValide] ?? this.niveauValide;
  }

  roadmapStagePercent(index: number): number {
    return Math.round(((index + 1) / this.roadmapEtapes.length) * 100);
  }
}