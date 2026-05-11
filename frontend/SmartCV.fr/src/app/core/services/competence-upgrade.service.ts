import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = `${environment.backendUrl}/api/competences`;

// ─── DTOs alignés sur le backend C# ──────────────────────────────────────────

export interface CompetenceGapDto {
  nom: string;
  priorite: 'haute' | 'renforcer' | 'evaluer';
}

export interface QuestionDto {
  Numero: number;
  enonce: string;
  options: string[];
  bonne_reponse?: string;
}

export interface TestGeneratedDto {
  testId: number;
  nomCompetence: string;
  questions: QuestionDto[];
}

export interface ReponseDto {
  Numero: number;
  ReponseChoisie: string;
}

export interface EvaluationResultDto {
  testId: number;
  score: number;
  niveau: string;
  message: string;
  roadmapNecessaire: boolean;
}

export interface EtapeRoadmapDto {
  ordre: number;
  type: string;
  titre: string;
  description: string;
  url: string | null;
  duree: string | null;
}

export interface RoadmapDto {
  roadmapId: number;
  nomCompetence: string;
  niveauDepart: string;
  objectifFinal: string;
  etapes: EtapeRoadmapDto[];
}

export interface RetestResultDto {
  score: number;
  niveau: string;
  competenceAjoutee: boolean;
  message: string;
  peutReessayer: boolean;
}

// ─── Historique (list) ────────────────────────────────────────────────────────

export interface RoadmapHistoriqueDto {
  id: number;
  nomCompetence: string;
  niveauDepart: string;
  completee: boolean;
  createdAt: string;
  testScore?: number;
  testStatut?: string;
}

// ─── Détail roadmap — GET /api/competences/roadmaps/{id} ─────────────────────
// Aligned with backend RoadmapDetailsDto + TestInfoDto

export interface RoadmapTestDetail {
  id: number;
  nomCompetence: string;
  score: number | null;         // nullable — backend: int?
  niveauDetecte: string | null; // backend field is NiveauDetecte, not niveau
  statut: string;
  createdAt: string;
  completedAt: string | null;
  questions: QuestionDto[];     // populated by backend fix in TestInfoDto
}

export interface RoadmapDetailDto {
  // Identification — backend uses roadmapId, not id
  roadmapId: number;
  userId: number;
  nomCompetence: string;
  niveauDepart: string;
  createdAt: string;

  // Content
  etapes: EtapeRoadmapDto[];
  nombreEtapes: number;

  // Raw state flags
  roadmapSuivie: boolean;
  completee: boolean;

  // Associated test (may be null)
  test: RoadmapTestDetail | null;

  // Derived phase state — from backend
  phase: 'AParcourir' | 'PreteAuTestFinal' | 'TestFinalEchoue' | 'Validee';
  phaseLibelle: string;
  prochaineAction: string;
  progression: number;          // 0–100
  peutPasserTestFinal: boolean;
  peutReessayer: boolean;
}

@Injectable({ providedIn: 'root' })
export class CompetenceUpgradeService {
  constructor(private http: HttpClient) {}

  genererTest(nomCompetence: string): Observable<TestGeneratedDto> {
    return this.http.post<TestGeneratedDto>(
      `${BASE}/test/generate`,
      { nomCompetence },
      { withCredentials: true }
    );
  }

  evaluerTest(testId: number, reponses: ReponseDto[]): Observable<EvaluationResultDto> {
    return this.http.post<EvaluationResultDto>(
      `${BASE}/test/evaluate`,
      { testId, reponses },
      { withCredentials: true }
    );
  }

  genererRoadmap(testId: number): Observable<RoadmapDto> {
    return this.http.post<RoadmapDto>(
      `${BASE}/roadmap`,
      { testId },
      { withCredentials: true }
    );
  }

  marquerRoadmapSuivie(roadmapId: number): Observable<void> {
    return this.http.put<void>(
      `${BASE}/roadmaps/${roadmapId}/suivie`,
      {},
      { withCredentials: true }
    );
  }

  repasserTest(roadmapId: number, reponses: ReponseDto[]): Observable<RetestResultDto> {
    return this.http.post<RetestResultDto>(
      `${BASE}/roadmaps/${roadmapId}/retest`,
      reponses,
      { withCredentials: true }
    );
  }

  getHistorique(): Observable<RoadmapHistoriqueDto[]> {
    return this.http.get<RoadmapHistoriqueDto[]>(
      `${BASE}/roadmaps`,
      { withCredentials: true }
    );
  }

  getRoadmapDetail(id: number): Observable<RoadmapDetailDto> {
    return this.http.get<RoadmapDetailDto>(
      `${BASE}/roadmaps/${id}`,
      { withCredentials: true }
    );
  }
}