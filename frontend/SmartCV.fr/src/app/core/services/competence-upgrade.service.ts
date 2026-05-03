import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = 'http://localhost:5000/api/competences';

// ─── DTOs alignés sur le backend C# ──────────────────────────────────────────

export interface CompetenceGapDto {
  nom: string;
  priorite: 'haute' | 'renforcer' | 'evaluer';
}

// POST /api/competences/test/generate — body: { nomCompetence }
export interface QuestionDto {
  numero: number;
  enonce: string;
  options: string[];   // le backend renvoie "options", pas "choix"
}

export interface TestGeneratedDto {
  testId: number;      // int côté backend
  nomCompetence: string;
  questions: QuestionDto[];
}

// POST /api/competences/test/evaluate — body: { testId, reponses }
export interface ReponseDto {
  numero: number;
  reponseChoisie: string;
}

export interface EvaluationResultDto {
  testId: number;
  score: number;
  niveau: string;
  message: string;
  roadmapNecessaire: boolean;
}

// POST /api/competences/roadmap — body: { testId }
export interface EtapeRoadmapDto {
  type: 'video' | 'documentation' | 'projet' | string;
  titre: string;
  description: string;
  lien?: string;
  dureeEstimee?: string;
}

export interface RoadmapDto {
  roadmapId: number;   // int côté backend
  nomCompetence: string;
  niveauDepart: string;
  objectifFinal: string;
  etapes: EtapeRoadmapDto[];
}

// POST /api/competences/roadmaps/{id}/retest — body: ReponseDto[] directement
export interface RetestResultDto {
  score: number;
  niveau: string;
  competenceAjoutee: boolean;
  message: string;
  peutReessayer: boolean;
}

export interface RoadmapHistoriqueDto {
  id: number;
  nomCompetence: string;
  niveauDepart: string;
  completee: boolean;
  createdAt: string;
  testScore?: number;
  testStatut?: string;
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

  // Backend lit compétence + niveau depuis la DB via testId
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

  // Body = tableau direct, pas enveloppé dans un objet
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
}