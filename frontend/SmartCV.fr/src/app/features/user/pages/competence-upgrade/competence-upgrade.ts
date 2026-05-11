import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProfilService } from '../../../../core/services/profil.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GenerateCvStateService } from '../../../../core/services/generate-cv-state.service';
import {
  CompetenceUpgradeService,
  CompetenceGapDto,
  QuestionDto,
  ReponseDto,
  EtapeRoadmapDto,
} from '../../../../core/services/competence-upgrade.service';

type Etape = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface EtapeInfo {
  num: number;
  label: string;
}

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

  // ─── Étape 3 : Test de niveau ─────────────────────────────────────────────
  chargementTest = false;
  testId = 0;             // int, pas string
  questions: QuestionDto[] = [];
  questionCourante = 0;
  reponseSelectionnee: string | null = null;
  reponses: ReponseDto[] = [];
  scoreInitial = 0;
  niveauInitial = '';

  // ─── Étape 4 : Roadmap ────────────────────────────────────────────────────
  chargementRoadmap = false;
  roadmapId = 0;          // int, pas string
  roadmapEtapes: EtapeRoadmapDto[] = [];
  objectifFinal = '';

  // ─── Étape 5 : Parcours ───────────────────────────────────────────────────
  etapesCompletees: boolean[] = [];

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

  constructor(
    private competenceUpgradeService: CompetenceUpgradeService,
    private profilService: ProfilService,
    private notif: NotificationService,
    private generateCvState: GenerateCvStateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.chargerProfil();
    this.chargerGapsDepuisState();
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
    // Nom/prénom depuis le state GenCV (déjà chargé depuis Keycloak)
    const state = this.generateCvState.state;
    if (state.prenom || state.nom) {
      this.profilNom = state.nom;
      this.profilPrenom = state.prenom;
    }
  }

  // ─── Gaps depuis l'analyse GenCV déjà en mémoire ─────────────────────────
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
      this.offreTitre = state.niveauLabel ? `Offre analysée` : 'Offre analysée';
      this.totalManquantes = this.competencesManquantes.length;
      this.competencesRequises = [
        ...state.competencesAnalysees
          .filter(c => c.statut === 'maitrise')
          .map(c => c.nom + ' +'),
        ...this.competencesManquantes.map(c => c.nom + ' -'),
      ];
      return;
    }

    // Fallback si on arrive directement sans passer par GenCV
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
    this.lancerTest();
  }

  // ─── Étape 2 → 3 : Lancer test ───────────────────────────────────────────
  lancerTest(): void {
    if (!this.competenceSelectionnee || this.chargementTest) return; // guard against duplicate calls
    this.chargementTest = true;
    this.etapeActive = 3;
    this.questionCourante = 0;
    this.reponses = [];
    this.reponseSelectionnee = null;
    this.cdr.detectChanges();

    this.competenceUpgradeService.genererTest(this.competenceSelectionnee.nom).subscribe({
      next: (res) => {
        this.testId = res.testId;
        this.questions = res.questions ?? [];
        if (this.questions.length === 0) {
          this.notif.error('Le test n\'a pas pu être généré. Veuillez réessayer.');
          this.chargementTest = false;
          this.etapeActive = 2;
          this.cdr.detectChanges();
          return;
        }
        this.chargementTest = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Erreur lors de la génération du test.');
        this.chargementTest = false;
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
    this.reponses.push({ numero: q.numero, reponseChoisie: this.reponseSelectionnee });
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
        this.scoreInitial = res.score;
        this.niveauInitial = res.niveau;
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
        this.roadmapId = res.roadmapId;
        this.roadmapEtapes = res.etapes;
        this.objectifFinal = res.objectifFinal;
        this.etapesCompletees = new Array(res.etapes.length).fill(false);
        this.chargementRoadmap = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.roadmapId = 0;
        this.roadmapEtapes = [
          { ordre: 1, type: 'video', titre: `${this.competenceSelectionnee?.nom} Full Course`, description: 'Regarder la vidéo complète', url: 'https://www.youtube.com', duree: '~2h30' },
          { ordre: 2, type: 'doc', titre: `Lire la doc officielle ${this.competenceSelectionnee?.nom}`, description: 'Sections principales', url: null, duree: '~1h' },
          { ordre: 3, type: 'projet', titre: 'Réaliser et publier le mini-projet', description: 'Publier sur GitHub avec README', url: null, duree: '~3h' },
        ];
        this.etapesCompletees = new Array(this.roadmapEtapes.length).fill(false);
        this.chargementRoadmap = false;
        this.cdr.detectChanges();
      },
    });
  }

  demarrerParcours(): void {
    this.etapeActive = 5;
    this.cdr.detectChanges();
  }

  // ─── Étape 5 : Parcours ───────────────────────────────────────────────────
  toggleEtape(index: number): void {
    this.etapesCompletees[index] = !this.etapesCompletees[index];
  }

  passerCertification(): void {
    if (this.roadmapId) {
      this.competenceUpgradeService.marquerRoadmapSuivie(this.roadmapId).subscribe({ error: () => {} });
    }
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
    this.reponsesCertif.push({ numero: q.numero, reponseChoisie: this.reponseSelectionnoCertif });
    this.reponseSelectionnoCertif = null;
    if (this.questionCouranteCertif < this.questionsCertif.length - 1) {
      this.questionCouranteCertif++;
    }
  }

  voirResultat(): void {
    if (this.reponseSelectionnoCertif) {
      const q = this.questionsCertif[this.questionCouranteCertif];
      this.reponsesCertif.push({ numero: q.numero, reponseChoisie: this.reponseSelectionnoCertif });
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
    const total = this.questionsCertif.length || 12;
    return Math.round((this.scoreFinale / 100) * total);
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
    this.competenceSelectionnee = null;
    this.reponses = [];
    this.reponsesCertif = [];
    this.questionCourante = 0;
    this.questionCouranteCertif = 0;
    this.testId = 0;
    this.roadmapId = 0;
    this.etapeActive = 1;
    this.cdr.detectChanges();
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
    const map: Record<string, string> = { Debutant: 'Débutant', Intermediaire: 'Intermédiaire', Avance: 'Avancé', Expert: 'Expert' };
    return map[this.niveauInitial] ?? this.niveauInitial;
  }

  get niveauValideLabel(): string {
    const map: Record<string, string> = { Debutant: 'Débutant', Intermediaire: 'Intermédiaire', Avance: 'Avancé', Expert: 'Expert' };
    return map[this.niveauValide] ?? this.niveauValide;
  }

  roadmapStagePercent(index: number): number {
    return Math.round(((index + 1) / this.roadmapEtapes.length) * 100);
  }
}