import { Injectable } from '@angular/core';
import { RecommandationsDto } from './cv.service';

// ─── Types miroirs de generate-cv.ts ─────────────────────────────────────────

export interface CompetenceAnalyseeState {
  nom: string;
  statut: 'maitrise' | 'renforcer';
}

export interface CompetenceCvPreviewState {
  nom: string;
  pct: number;
}

export interface GenerateCvState {
  // Étape courante
  etapeActive: number;
  etapesCompletes: number[];

  // Profil
  prenom: string;
  nom: string;
  email: string;
  titre: string;
  ville: string;
  linkedIn: string;
  resume: string;
  competencesCv: CompetenceCvPreviewState[];
  competencesNoms: string[];

  // Étape 1
  offreTexte: string;

  // Étape 2 — résultats analyse IA
  scoreCompatibilite: number;
  scoreLabel: string;
  niveauLabel: string;
  competencesAnalysees: CompetenceAnalyseeState[];
  recommandations: RecommandationsDto | null;
  resumeIA: string;

  // Étape 3
  couleurAccent: string;
  langueSelectionnee: string;
  templateId: number | null;

  // Étape 4
  cvCreeId: number | null;
  resumeEdite: string;
  titreCv: string;
  scoreApresOptimisation: number;
  pointsGagnes: number;
}

const INITIAL_STATE: GenerateCvState = {
  etapeActive: 1,
  etapesCompletes: [],
  prenom: '',
  nom: '',
  email: '',
  titre: '',
  ville: '',
  linkedIn: '',
  resume: '',
  competencesCv: [],
  competencesNoms: [],
  offreTexte: '',
  scoreCompatibilite: 0,
  scoreLabel: '',
  niveauLabel: '',
  competencesAnalysees: [],
  recommandations: null,
  resumeIA: '',
  couleurAccent: '#6B4E2A',
  langueSelectionnee: 'Français',
  templateId: null,
  cvCreeId: null,
  resumeEdite: '',
  titreCv: '',
  scoreApresOptimisation: 0,
  pointsGagnes: 0,
};

@Injectable({ providedIn: 'root' })
export class GenerateCvStateService {
  private _state: GenerateCvState = { ...INITIAL_STATE };

  get state(): GenerateCvState {
    return this._state;
  }

  patch(partial: Partial<GenerateCvState>): void {
    this._state = { ...this._state, ...partial };
  }

  reset(): void {
    this._state = { ...INITIAL_STATE };
  }

  get hasAnalyse(): boolean {
    return this._state.competencesAnalysees.length > 0;
  }

  get competencesManquantes(): string[] {
    return this._state.competencesAnalysees
      .filter(c => c.statut === 'renforcer')
      .map(c => c.nom);
  }
}