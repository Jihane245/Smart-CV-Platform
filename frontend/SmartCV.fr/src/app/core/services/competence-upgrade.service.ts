import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = `${environment.backendUrl}/api/competences`;
const GAP_BASE = `${environment.backendUrl}/api/gap-sessions`;

// ─── Gap Session DTOs ─────────────────────────────────────────────────────────

export interface GapSkillRequest {
  nomCompetence: string;
  priorite: 'haute' | 'renforcer' | 'evaluer';
}

export interface CreateGapSessionRequest {
  texteOffre: string;
  titreOffre?: string;
  entreprise?: string;
  scoreCompatibilite: number;
  competencesManquantes: GapSkillRequest[];
}

export interface GapSessionSummaryDto {
  id: number;
  texteOffre: string;
  titreOffre?: string;
  entreprise?: string;
  scoreCompatibilite: number;
  createdAt: string;
  totalSkills: number;
  skillsTermines: number;
  skillsEnCours: number;
}

export interface GapSessionSkillDto {
  id: number;
  nomCompetence: string;
  priorite: 'haute' | 'renforcer' | 'evaluer';
  roadmapId: number | null;
  // populated when roadmap exists
  phase?: 'AParcourir' | 'PreteAuTestFinal' | 'TestFinalEchoue' | 'Validee';
  phaseLibelle?: string;
  progression?: number;
  completee?: boolean;
  testScore?: number | null;
  niveauDepart?: string;
}

export interface GapSessionDetailDto {
  id: number;
  texteOffre: string;
  titreOffre?: string;
  entreprise?: string;
  scoreCompatibilite: number;
  createdAt: string;
  skills: GapSessionSkillDto[];
}

// ─── Competence upgrade DTOs ──────────────────────────────────────────────────

export interface QuestionDto {
  numero: number;
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
  type: 'video' | 'doc' | 'projet';
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

// Full roadmap detail — GET /api/competences/roadmaps/{id}
export interface RoadmapTestDetail {
  id: number;
  nomCompetence: string;
  score: number | null;
  niveauDetecte: string | null;
  statut: string;
  createdAt: string;
  completedAt: string | null;
  questions: QuestionDto[];
}

export interface RoadmapDetailDto {
  roadmapId: number;
  userId: number;
  nomCompetence: string;
  niveauDepart: string;
  createdAt: string;
  etapes: EtapeRoadmapDto[];
  nombreEtapes: number;
  roadmapSuivie: boolean;
  completee: boolean;
  test: RoadmapTestDetail | null;
  phase: 'AParcourir' | 'PreteAuTestFinal' | 'TestFinalEchoue' | 'Validee';
  phaseLibelle: string;
  prochaineAction: string;
  progression: number;
  peutPasserTestFinal: boolean;
  peutReessayer: boolean;
}

@Injectable({ providedIn: 'root' })
export class CompetenceUpgradeService {
  constructor(private http: HttpClient) {}

  // ─── Gap Sessions ──────────────────────────────────────────────────────────

  createGapSession(req: CreateGapSessionRequest): Observable<{ sessionId: number }> {
    return this.http.post<{ sessionId: number }>(GAP_BASE, req, { withCredentials: true });
  }

  getGapSessions(): Observable<GapSessionSummaryDto[]> {
    return this.http.get<GapSessionSummaryDto[]>(GAP_BASE, { withCredentials: true });
  }

  getGapSessionDetail(id: number): Observable<GapSessionDetailDto> {
    return this.http.get<GapSessionDetailDto>(`${GAP_BASE}/${id}`, { withCredentials: true });
  }

  linkRoadmapToSkill(sessionId: number, skillId: number, roadmapId: number): Observable<void> {
    return this.http.patch<void>(
      `${GAP_BASE}/${sessionId}/skills/${skillId}/roadmap`,
      { roadmapId },
      { withCredentials: true }
    );
  }

  // ─── Test & Roadmap ────────────────────────────────────────────────────────

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

  getRoadmapDetail(id: number): Observable<RoadmapDetailDto> {
    return this.http.get<RoadmapDetailDto>(
      `${BASE}/roadmaps/${id}`,
      { withCredentials: true }
    );
  }
}