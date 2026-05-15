import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfilService } from '../../../../core/services/profil.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GapSessionStateService } from '../../../../core/services/gap-session-state.service';
import {
  CompetenceUpgradeService,
  GapSessionDetailDto,
  GapSessionSkillDto,
  QuestionDto,
  ReponseDto,
  EtapeRoadmapDto,
} from '../../../../core/services/competence-upgrade.service';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Steps for a single skill's upgrade journey */
type SkillStep = 'test' | 'roadmap' | 'parcours' | 'certification' | 'valide';

/** Full in-memory state for one skill being worked on */
interface SkillState {
  /** GapSessionSkill.id from backend */
  skillId: number;
  nomCompetence: string;
  priorite: 'haute' | 'renforcer' | 'evaluer';

  /** Which step this skill is currently on */
  step: SkillStep;

  // ── Test ──────────────────────────────────────────────────────────────────
  testId: number;
  questions: QuestionDto[];
  scoreInitial: number;
  niveauInitial: string;

  // ── Roadmap ───────────────────────────────────────────────────────────────
  roadmapId: number;
  etapesRoadmap: EtapeRoadmapDto[];
  objectifFinal: string;
  etapesCompletees: boolean[];

  // ── Certification result ───────────────────────────────────────────────────
  scoreFinal: number;
  niveauFinal: string;
  competenceValidee: boolean;
}

const STORAGE_KEY = (roadmapId: number) => `smartcv_parcours_${roadmapId}`;

// Page-level steps (the stepper across the top)
type PageStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

@Component({
  selector: 'app-competence-upgrade',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './competence-upgrade.html',
  styleUrl: './competence-upgrade.scss',
})
export class CompetenceUpgrade implements OnInit {

  // ─── Session ──────────────────────────────────────────────────────────────
  session: GapSessionDetailDto | null = null;
  sessionId: number | null = null;
  chargementSession = true;

  // ─── Page stepper ─────────────────────────────────────────────────────────
  pageStep: PageStep = 1;

  readonly stepLabels: { num: number; label: string }[] = [
    { num: 1, label: 'Écarts détectés' },
    { num: 2, label: 'Choix compétence' },
    { num: 3, label: 'Test de niveau' },
    { num: 4, label: 'Roadmap IA' },
    { num: 5, label: 'Parcours' },
    { num: 6, label: 'Certification' },
    { num: 7, label: 'Profil mis à jour' },
  ];

  // ─── Skills ───────────────────────────────────────────────────────────────
  /** All skills from the session, initialized once session loads */
  skills: SkillState[] = [];

  /** Currently focused skill */
  activeSkillIndex: number | null = null;

  get activeSkill(): SkillState | null {
    return this.activeSkillIndex !== null ? this.skills[this.activeSkillIndex] : null;
  }

  // ─── Profil (for step 7 success card) ────────────────────────────────────
  profilNom = '';
  profilPrenom = '';
  profilTitre = '';
  profilCompetences: string[] = [];

  // ─── Loading flags ────────────────────────────────────────────────────────
  chargementTest = false;
  chargementRoadmap = false;

  // ─── Test UI state ────────────────────────────────────────────────────────
  questionCourante = 0;
  reponseSelectionnee: string | null = null;
  reponses: ReponseDto[] = [];

  // ─── Certification UI state ───────────────────────────────────────────────
  questionsCertif: QuestionDto[] = [];
  questionCouranteCertif = 0;
  reponseSelectionneCertif: string | null = null;
  reponsesCertif: ReponseDto[] = [];
  resultatCertifAffiche = false;
  messageCertif = '';
  peutReessayer = false;

  constructor(
    private competenceUpgradeService: CompetenceUpgradeService,
    private profilService: ProfilService,
    private gapSessionState: GapSessionStateService,
    private notif: NotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.chargerProfil();

    // Priority 1: in-memory state from GapSessionStateService (set before navigation)
    const { detail, sessionId } = this.gapSessionState.consume();

    // Priority 2: ?sessionId= query param (supports page refresh)
    const paramId = this.route.snapshot.queryParamMap.get('sessionId');
    const resolvedId = sessionId ?? (paramId ? Number(paramId) : null);

    if (!resolvedId) {
      // No session — redirect back to CV generation
      this.notif.error('Aucune session de mise à niveau trouvée. Veuillez analyser une offre d\'emploi.');
      this.router.navigate(['/user/generate-cv']);
      return;
    }

    this.sessionId = resolvedId;

    if (detail && detail.id === resolvedId) {
      // Fast path — detail already in memory
      this.initFromSession(detail);
    } else {
      // Fetch from backend (page refresh or navigated with id only)
      this.competenceUpgradeService.getGapSessionDetail(resolvedId).subscribe({
        next: (d) => this.initFromSession(d),
        error: () => {
          this.notif.error('Impossible de charger la session. Veuillez réessayer.');
          this.router.navigate(['/user/generate-cv']);
        },
      });
    }
  }

  // ─── Session init ─────────────────────────────────────────────────────────

  private initFromSession(session: GapSessionDetailDto): void {
    this.session = session;
    this.chargementSession = false;
    this.skills = session.skills.map(sk => this.skillStateFromDto(sk));

    this.activeSkillIndex = null;
    this.pageStep = 1;

    this.cdr.detectChanges();
  }

  private skillStateFromDto(sk: GapSessionSkillDto): SkillState {
    const step = this.phaseToSkillStep(sk.phase, sk.roadmapId);
    return {
      skillId: sk.id,
      nomCompetence: sk.nomCompetence,
      priorite: sk.priorite,
      step,
      // test — will be populated when test is generated
      testId: 0,
      questions: [],
      scoreInitial: sk.testScore ?? 0,
      niveauInitial: sk.niveauDepart ?? '',
      // roadmap
      roadmapId: sk.roadmapId ?? 0,
      etapesRoadmap: [],
      objectifFinal: '',
      etapesCompletees: [],
      // certification
      scoreFinal: 0,
      niveauFinal: '',
      competenceValidee: sk.completee ?? false,
    };
  }

  private phaseToSkillStep(
    phase: GapSessionSkillDto['phase'],
    roadmapId: number | null,
  ): SkillStep {
    if (!roadmapId) return 'test';
    switch (phase) {
      case 'Validee':          return 'valide';
      case 'PreteAuTestFinal':
      case 'TestFinalEchoue':  return 'certification';
      case 'AParcourir':       return 'parcours';
      default:                 return 'test';
    }
  }

  private skillStepToPageStep(step: SkillStep): PageStep {
    const map: Record<SkillStep, PageStep> = {
      test:          3,
      roadmap:       4,
      parcours:      5,
      certification: 6,
      valide:        7,
    };
    return map[step];
  }

  // ─── Profil ───────────────────────────────────────────────────────────────

  private chargerProfil(): void {
    this.profilService.getMe().subscribe({
      next: (p) => {
        this.profilCompetences = (p.competences ?? []).map(c => c.nom);
        this.profilTitre = p.titre ?? '';
      },
      error: () => {},
    });
  }

  // ─── Getters for template ─────────────────────────────────────────────────

  get skillsNonValides(): SkillState[] {
    return this.skills.filter(s => !s.competenceValidee);
  }

  get skillsValides(): SkillState[] {
    return this.skills.filter(s => s.competenceValidee);
  }

  get totalSkills(): number { return this.skills.length; }
  get skillsTerminesCount(): number { return this.skillsValides.length; }

  get offreTitre(): string {
    return this.session?.titreOffre || this.session?.texteOffre?.substring(0, 60) + '…' || 'Offre analysée';
  }

  get offreEntreprise(): string { return this.session?.entreprise ?? ''; }
  get scoreCompatibilite(): number { return this.session?.scoreCompatibilite ?? 0; }

  estComplete(stepNum: number): boolean { return stepNum < this.pageStep; }

  // ─── Step 1 → 2 ───────────────────────────────────────────────────────────

  allerEtape2(): void { this.pageStep = 2; }

  // ─── Step 2: select skill and launch test ─────────────────────────────────

  selectionnerSkill(index: number): void {
    const skill = this.skills[index];
    this.activeSkillIndex = index;

    if (skill.roadmapId && skill.step !== 'test') {
      // Already has a roadmap — go to its current step
      // If returning to parcours, reload etapes from backend
      if (skill.etapesRoadmap.length === 0 && skill.roadmapId) {
        this.chargerDetailRoadmap(skill);
      } else {
        this.pageStep = this.skillStepToPageStep(skill.step);
        if (skill.step === 'certification') this.initCertificationUI(skill);
        this.cdr.detectChanges();
      }
    } else {
      // Fresh — launch the level test
      this.lancerTest();
    }
  }

  private chargerDetailRoadmap(skill: SkillState): void {
    this.chargementRoadmap = true;
    this.competenceUpgradeService.getRoadmapDetail(skill.roadmapId).subscribe({
      next: (detail) => {
        skill.etapesRoadmap    = detail.etapes;
        skill.objectifFinal    = '';
        skill.testId           = detail.test?.id ?? skill.testId;
        skill.questions        = detail.test?.questions ?? skill.questions;
        skill.scoreInitial     = detail.test?.score ?? skill.scoreInitial;
        skill.niveauInitial    = detail.test?.niveauDetecte ?? skill.niveauInitial;
        skill.etapesCompletees = this.loadParcoursFromStorage(skill.roadmapId)
          ?? new Array(detail.etapes.length).fill(false);
        this.chargementRoadmap = false;
        this.pageStep = this.skillStepToPageStep(skill.step);
        if (skill.step === 'certification') this.initCertificationUI(skill);
        this.cdr.detectChanges();
      },
      error: () => {
        this.chargementRoadmap = false;
        this.notif.error('Impossible de charger la roadmap.');
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Step 3: Test ─────────────────────────────────────────────────────────

  lancerTest(): void {
    const skill = this.activeSkill;
    if (!skill || this.chargementTest) return;

    this.chargementTest = true;
    this.pageStep = 3;
    this.questionCourante = 0;
    this.reponses = [];
    this.reponseSelectionnee = null;
    this.cdr.detectChanges();

    this.competenceUpgradeService.genererTest(skill.nomCompetence).subscribe({
      next: (res) => {
        if (!res.questions?.length) {
          this.notif.error('Le test n\'a pas pu être généré. Veuillez réessayer.');
          this.chargementTest = false;
          this.pageStep = 2;
          this.cdr.detectChanges();
          return;
        }
        skill.testId    = res.testId;
        skill.questions = res.questions;
        skill.step      = 'test';
        this.chargementTest = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Erreur lors de la génération du test.');
        this.chargementTest = false;
        this.pageStep = 2;
        this.cdr.detectChanges();
      },
    });
  }

  choisirReponse(choix: string): void {
    this.reponseSelectionnee = choix;
  }

  get estDerniereQuestion(): boolean {
    return this.questionCourante === (this.activeSkill?.questions.length ?? 0) - 1;
  }

  questionSuivante(): void {
    const skill = this.activeSkill;
    if (!skill || this.reponseSelectionnee === null) return;

    const q = skill.questions[this.questionCourante];
    this.reponses.push({ Numero: q.numero, ReponseChoisie: this.reponseSelectionnee });
    this.reponseSelectionnee = null;

    if (this.questionCourante < skill.questions.length - 1) {
      this.questionCourante++;
    } else {
      this.evaluerTest();
    }
  }

  private evaluerTest(): void {
    const skill = this.activeSkill;
    if (!skill) return;

    this.competenceUpgradeService.evaluerTest(skill.testId, this.reponses).subscribe({
      next: (res) => {
        skill.scoreInitial  = res.score;
        skill.niveauInitial = res.niveau;
        this.genererRoadmap();
      },
      error: () => {
        this.notif.error('Erreur lors de l\'évaluation. Veuillez réessayer.');
        this.pageStep = 2;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Step 4: Roadmap ──────────────────────────────────────────────────────

  private genererRoadmap(): void {
    const skill = this.activeSkill;
    if (!skill) return;

    this.chargementRoadmap = true;
    this.pageStep = 4;
    this.cdr.detectChanges();

    this.competenceUpgradeService.genererRoadmap(skill.testId).subscribe({
      next: (res) => {
        skill.roadmapId        = res.roadmapId;
        skill.etapesRoadmap    = res.etapes;
        skill.objectifFinal    = res.objectifFinal;
        skill.etapesCompletees = new Array(res.etapes.length).fill(false);
        skill.step             = 'roadmap';

        // Link roadmap to the session skill in backend
        if (this.sessionId) {
          this.competenceUpgradeService
            .linkRoadmapToSkill(this.sessionId, skill.skillId, res.roadmapId)
            .subscribe({ error: () => {} }); // non-blocking
        }

        this.chargementRoadmap = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback roadmap so user isn't blocked
        skill.roadmapId        = 0;
        skill.etapesRoadmap    = this.fallbackEtapes(skill.nomCompetence);
        skill.etapesCompletees = new Array(3).fill(false);
        skill.step             = 'roadmap';
        this.chargementRoadmap = false;
        this.notif.error('Roadmap générée en mode hors-ligne.');
        this.cdr.detectChanges();
      },
    });
  }

  demarrerParcours(): void {
    const skill = this.activeSkill;
    if (!skill) return;
    skill.step = 'parcours';
    this.pageStep = 5;
    this.cdr.detectChanges();
  }

  // ─── Step 5: Parcours ─────────────────────────────────────────────────────

  toggleEtape(index: number): void {
    const skill = this.activeSkill;
    if (!skill) return;
    skill.etapesCompletees[index] = !skill.etapesCompletees[index];
    if (skill.roadmapId) {
      this.saveParcoursToStorage(skill.roadmapId, skill.etapesCompletees);
    }
    this.cdr.detectChanges();
  }

  get progressionParcours(): number {
    const skill = this.activeSkill;
    if (!skill?.etapesRoadmap.length) return 0;
    return Math.round(
      (skill.etapesCompletees.filter(Boolean).length / skill.etapesRoadmap.length) * 100
    );
  }

  get toutesEtapesCompletees(): boolean {
    const skill = this.activeSkill;
    return !!skill?.etapesRoadmap.length && skill.etapesCompletees.every(Boolean);
  }

  passerCertification(): void {
    const skill = this.activeSkill;
    if (!skill) return;

    if (skill.roadmapId) {
      this.competenceUpgradeService
        .marquerRoadmapSuivie(skill.roadmapId)
        .subscribe({ error: () => {} });
    }

    skill.step = 'certification';
    this.initCertificationUI(skill);
  }

  // ─── Step 6: Certification ────────────────────────────────────────────────

  private initCertificationUI(skill: SkillState): void {
    this.pageStep = 6;
    this.questionsCertif = [...skill.questions];
    this.questionCouranteCertif = 0;
    this.reponseSelectionneCertif = null;
    this.reponsesCertif = [];
    this.resultatCertifAffiche = false;
    this.messageCertif = '';
    this.peutReessayer = false;
    this.cdr.detectChanges();
  }

  choisirReponseCertif(choix: string): void {
    this.reponseSelectionneCertif = choix;
  }

  get estDerniereQuestionCertif(): boolean {
    return this.questionCouranteCertif === this.questionsCertif.length - 1;
  }

  questionSuivanteCertif(): void {
    if (this.reponseSelectionneCertif === null) return;
    const q = this.questionsCertif[this.questionCouranteCertif];
    this.reponsesCertif.push({ Numero: q.numero, ReponseChoisie: this.reponseSelectionneCertif });
    this.reponseSelectionneCertif = null;
    if (this.questionCouranteCertif < this.questionsCertif.length - 1) {
      this.questionCouranteCertif++;
    }
  }

  voirResultat(): void {
    if (this.reponseSelectionneCertif !== null) {
      const q = this.questionsCertif[this.questionCouranteCertif];
      this.reponsesCertif.push({ Numero: q.numero, ReponseChoisie: this.reponseSelectionneCertif });
    }
    this.evaluerCertification();
  }

  private evaluerCertification(): void {
    const skill = this.activeSkill;
    if (!skill) return;

    this.competenceUpgradeService
      .repasserTest(skill.roadmapId, this.reponsesCertif)
      .subscribe({
        next: (res) => {
          skill.scoreFinal      = res.score;
          skill.niveauFinal     = res.niveau;
          skill.competenceValidee = res.competenceAjoutee;
          this.messageCertif    = res.message;
          this.peutReessayer    = res.peutReessayer;

          if (res.competenceAjoutee) {
            skill.step = 'valide';
            this.profilCompetences = [...this.profilCompetences, skill.nomCompetence];
            if (skill.roadmapId) this.clearParcoursFromStorage(skill.roadmapId);
            this.pageStep = 7;
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

  revoirRoadmap(): void {
    const skill = this.activeSkill;
    if (!skill) return;
    skill.step = 'parcours';
    this.resultatCertifAffiche = false;
    this.pageStep = 5;
    this.cdr.detectChanges();
  }

  reessayerCertification(): void {
    const skill = this.activeSkill;
    if (!skill) return;
    this.initCertificationUI(skill);
  }

  // ─── Step 7: Success / continue ───────────────────────────────────────────

  continuerCompetencesRestantes(): void {
    const restantes = this.skillsNonValides;
    if (!restantes.length) return;

    const nextIndex = this.skills.findIndex(s => !s.competenceValidee);
    this.activeSkillIndex = nextIndex;
    this.pageStep = 2;
    this.reponses = [];
    this.reponsesCertif = [];
    this.questionCourante = 0;
    this.questionCouranteCertif = 0;
    this.cdr.detectChanges();
  }

  toutesCompetencesValidees(): boolean {
    return this.skills.length > 0 && this.skills.every(s => s.competenceValidee);
  }

  // ─── Sidebar: switch between skills mid-session ───────────────────────────

  switcherSkill(index: number): void {
    const skill = this.skills[index];
    if (!skill) return;
    this.activeSkillIndex = index;
    this.questionCourante = 0;
    this.reponses = [];
    this.reponseSelectionnee = null;

    if (skill.competenceValidee) {
      this.pageStep = 7;
      this.cdr.detectChanges();
      return;
    }

    if (!skill.roadmapId) {
      // Fresh skill — generate test
      this.lancerTest();
      return;
    }

    // Has a roadmap — load its detail if not yet loaded
    if (skill.etapesRoadmap.length === 0) {
      this.chargerDetailRoadmap(skill);
    } else {
      this.pageStep = this.skillStepToPageStep(skill.step);
      if (skill.step === 'certification') this.initCertificationUI(skill);
      this.cdr.detectChanges();
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  labelPriorite(priorite: string): string {
    switch (priorite) {
      case 'haute':     return 'Priorité haute';
      case 'renforcer': return 'À renforcer';
      default:          return 'À évaluer';
    }
  }

  iconEtapeType(type: string): string {
    switch (type) {
      case 'video':  return '▶';
      case 'doc':    return '□';
      case 'projet': return '✦';
      default:       return '○';
    }
  }

  roadmapStagePercent(index: number): number {
    const skill = this.activeSkill;
    if (!skill?.etapesRoadmap.length) return 0;
    return Math.round(((index + 1) / skill.etapesRoadmap.length) * 100);
  }

  get niveauInitialLabel(): string { return this.niveauLabel(this.activeSkill?.niveauInitial ?? ''); }
  get niveauFinalLabel(): string   { return this.niveauLabel(this.activeSkill?.niveauFinal ?? ''); }

  niveauLabel(n: string): string {
    const map: Record<string, string> = { Debutant: 'Débutant', Moyen: 'Moyen', Expert: 'Expert' };
    return map[n] ?? n;
  }

  get bonnesReponsesCertif(): number {
    return Math.round(((this.activeSkill?.scoreFinal ?? 0) / 100) * (this.questionsCertif.length || 5));
  }

  etapeUrl(etape: EtapeRoadmapDto): string | null {
    if (!etape.url) return null;
    // Ensure absolute URL
    return etape.url.startsWith('http') ? etape.url : `https://${etape.url}`;
  }

  private fallbackEtapes(nom: string): EtapeRoadmapDto[] {
    return [
      { ordre: 1, type: 'video',  titre: `${nom} Full Course`, description: 'Regarder la vidéo complète', url: 'https://www.youtube.com', duree: '~2h30' },
      { ordre: 2, type: 'doc',    titre: `Documentation officielle ${nom}`, description: 'Lire les sections principales', url: null, duree: '~1h' },
      { ordre: 3, type: 'projet', titre: 'Réaliser un mini-projet', description: 'Publier sur GitHub avec README', url: null, duree: '~3h' },
    ];
  }

  // ─── localStorage ─────────────────────────────────────────────────────────

  private saveParcoursToStorage(roadmapId: number, etapes: boolean[]): void {
    try { localStorage.setItem(STORAGE_KEY(roadmapId), JSON.stringify(etapes)); } catch { /**/ }
  }

  private loadParcoursFromStorage(roadmapId: number): boolean[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(roadmapId));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private clearParcoursFromStorage(roadmapId: number): void {
    try { localStorage.removeItem(STORAGE_KEY(roadmapId)); } catch { /**/ }
  }
}