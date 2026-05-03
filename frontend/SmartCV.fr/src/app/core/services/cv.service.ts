import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const CV_BASE = 'http://localhost:5000/api/cv';
const AI_BASE = 'http://localhost:8000/analyze';
export const BACKEND_ORIGIN = 'http://localhost:5000';

// ─── AI Response types ────────────────────────────────────────────────────────

export interface RecommandationsDto {
  priorite: 'haute' | 'moyenne' | 'faible';
  message_global: string;
  competences_a_apprendre: string[];
  technologies_prioritaires: string[];
  ameliorations_cv: string[];
  suggestions_projets: string[];
}

export interface AnalyseOffreResponse {
  score_compatibilite: number;
  niveau: string;
  resume: string;
  outils: string[];
  annees_experience: number;
  competences_match: string[];
  competences_manquantes: string[];
  recommandations: RecommandationsDto;
}

// ─── CV types ────────────────────────────────────────────────────────────────

export interface CreateCvPayload {
  templateId: number;
  couleurPrimaire?: string;
  couleurSecondaire?: string;
  couleurTexte?: string;
  police?: string;
  taillePolice?: string;
  langue: string;
}

export interface UpdateStylesPayload {
  couleurPrimaire?: string;
  couleurSecondaire?: string;
  couleurTexte?: string;
  police?: string;
  taillePolice?: string;
  langue?: string;
}

export interface CvResponse {
  id: number;
  templateId: number;
  nomTemplate: string;
  langue: string;
  updatedAt: string;
  styles: {
    couleurPrimaire: string;
    couleurSecondaire: string;
    couleurTexte: string;
    police: string;
    taillePolice: string;
    cssVariables: string;
  };
  contenu: any;
}

// ─── PDFs historisés ──────────────────────────────────────────────────────────
export interface PdfHistorique {
  id: number;
  cvId: number;
  fileName: string;
  cloudUrl: string;        // ex: "/pdfs/cv_9_xxx.pdf"
  dateCreation: string;
  nomTemplate: string;
  prenom?: string | null;  // nom et prénom capturés au moment de l'export
  nom?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CvService {

  constructor(private http: HttpClient) {}

  // ─── AI Analysis ─────────────────────────────────────────────────────────────

  analyserTexte(
    texte: string,
    profilCompetences: string[]
  ): Observable<AnalyseOffreResponse> {
    return this.http.post<AnalyseOffreResponse>(`${AI_BASE}/text`, {
      texte,
      profil_competences: profilCompetences,
    });
  }

  analyserImage(
    imageFile: File,
    profilCompetences: string[]
  ): Observable<AnalyseOffreResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append(
      'profil_competences',
      JSON.stringify(profilCompetences)
    );
    return this.http.post<AnalyseOffreResponse>(
      `${AI_BASE}/image`,
      formData
    );
  }

  // ─── CV CRUD ──────────────────────────────────────────────────────────────────

  creerCv(payload: CreateCvPayload): Observable<CvResponse> {
    return this.http.post<CvResponse>(CV_BASE, payload, {
      withCredentials: true,
    });
  }

  getMesCvs(): Observable<CvResponse[]> {
    return this.http.get<CvResponse[]>(CV_BASE, { withCredentials: true });
  }

  getCv(id: number): Observable<CvResponse> {
    return this.http.get<CvResponse>(`${CV_BASE}/${id}`, {
      withCredentials: true,
    });
  }

  updateStyles(id: number, payload: UpdateStylesPayload): Observable<CvResponse> {
    return this.http.put<CvResponse>(`${CV_BASE}/${id}/styles`, payload, {
      withCredentials: true,
    });
  }

  updateContenu(id: number, contenu: any): Observable<CvResponse> {
    return this.http.put<CvResponse>(`${CV_BASE}/${id}/contenu`, contenu, {
      withCredentials: true,
    });
  }

  resetFromProfil(id: number): Observable<CvResponse> {
    return this.http.post<CvResponse>(`${CV_BASE}/${id}/reset`, {}, {
      withCredentials: true,
    });
  }

  supprimerCv(id: number): Observable<void> {
    return this.http.delete<void>(`${CV_BASE}/${id}`, {
      withCredentials: true,
    });
  }

  // Liste des PDFs générés par l'utilisateur (du plus récent au plus ancien)
  getMesPdfs(): Observable<PdfHistorique[]> {
    return this.http.get<PdfHistorique[]>(`${CV_BASE}/pdfs/me`, {
      withCredentials: true,
    });
  }

  exporterPdf(
    id: number,
    htmlContent: string,
    prenom?: string,
    nom?: string,
  ): Observable<Blob> {
    return this.http.post(
      `http://localhost:5000/api/cv/${id}/export-pdf`,
      { htmlContent, prenom, nom },
      {
        withCredentials: true,
        responseType: 'blob',
      }
    );
  }
}