import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = `${environment.backendUrl}/api/competences`;

// ─── DTOs alignés exactement sur CompetenceGapDto.cs (camelCase JSON) ────────

export interface CompetenceGapDto {
  nom: string;
  priorite: 'haute' | 'renforcer' | 'evaluer';
}

// POST /api/competences/test/generate — body: { nomCompetence }
export interface QuestionDto {
  Numero: number;
  enonce: string;
  options: string[];        // C# QuestionDto.Options → "options"
}

export interface TestGeneratedDto {
  testId: number;           // C# TestGeneratedDto.TestId → "testId"
  nomCompetence: string;
  questions: QuestionDto[];
}

// POST /api/competences/test/evaluate — body: { testId, reponses }
// C# ReponseDto.ReponseChoisie → "ReponseChoisie"
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

// POST /api/competences/roadmap — body: { testId }
// C# EtapeRoadmapDto fields: Ordre, Type, Titre, Description, Url, Duree
export interface EtapeRoadmapDto {
  ordre: number;
  type: string;             // "video" | "doc" | "projet"
  titre: string;
  description: string;
  url: string | null;       // C# Url → "url"
  duree: string | null;     // C# Duree → "duree"
}

export interface RoadmapDto {
  roadmapId: number;
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
}