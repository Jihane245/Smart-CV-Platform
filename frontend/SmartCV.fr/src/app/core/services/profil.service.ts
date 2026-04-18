import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Experience, Formation, NiveauCompetence } from '../models/models';

const API_BASE = 'http://localhost:5000/api/profil';

/** Corps attendu par POST /api/profil/me/competences (niveau = index enum backend) */
export interface CompetenceCreatePayload {
  nom: string;
  niveau: number;
  categorie: string;
}

export interface UpdateProfilPayload {
  titre: string;
  telephone: string;
  adresse: string;
  linkedIn: string;
  description: string;
}

/** Réponse GET /api/profil/me — champs alignés sur ProfilResponseDto (JSON camelCase) */
export interface ProfilMeResponse {
  id: number;
  titre: string | null;
  telephone: string | null;
  adresse: string | null;
  linkedIn: string | null;
  description: string | null;
  competences: Array<{
    idComp: number;
    nom: string;
    niveau: number | string;
    categorie: string | null;
  }>;
  experiences: Experience[];
  formations: Formation[];
  certificats: unknown[];
}

@Injectable({ providedIn: 'root' })
export class ProfilService {
  constructor(private http: HttpClient) {}

  getMe(): Observable<ProfilMeResponse> {
    return this.http.get<ProfilMeResponse>(`${API_BASE}/me`, {
      withCredentials: true,
    });
  }

  updateMe(payload: UpdateProfilPayload): Observable<ProfilMeResponse> {
    return this.http.put<ProfilMeResponse>(`${API_BASE}/me`, payload, {
      withCredentials: true,
    });
  }

  addCompetence(payload: CompetenceCreatePayload): Observable<unknown> {
    return this.http.post(`${API_BASE}/me/competences`, payload, {
      withCredentials: true,
    });
  }

  deleteCompetence(idComp: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/me/competences/${idComp}`, {
      withCredentials: true,
    });
  }

  addExperience(payload: ExperienceDtoPayload): Observable<Experience> {
    return this.http.post<Experience>(`${API_BASE}/me/experiences`, payload, {
      withCredentials: true,
    });
  }

  updateExperience(
    idExp: number,
    payload: ExperienceDtoPayload
  ): Observable<void> {
    return this.http.put<void>(
      `${API_BASE}/me/experiences/${idExp}`,
      payload,
      { withCredentials: true }
    );
  }

  addFormation(payload: FormationDtoPayload): Observable<Formation> {
    return this.http.post<Formation>(`${API_BASE}/me/formations`, payload, {
      withCredentials: true,
    });
  }

  updateFormation(
    idFrmt: number,
    payload: FormationDtoPayload
  ): Observable<void> {
    return this.http.put<void>(
      `${API_BASE}/me/formations/${idFrmt}`,
      payload,
      { withCredentials: true }
    );
  }
}

/** DTO expérience côté API (dates ISO) */
export interface ExperienceDtoPayload {
  poste: string;
  entreprise: string;
  dateDebut: string;
  dateFin?: string | null;
  description?: string | null;
}

export interface FormationDtoPayload {
  diplome: string;
  etablissement: string;
  annee: number;
  mention: string;
}

/** L’API renvoie parfois `niveau` comme nombre ; on normalise vers NiveauCompetence */
export function normalizeCompetenceNiveau(
  raw: unknown
): NiveauCompetence {
  if (typeof raw === 'string') {
    return raw as NiveauCompetence;
  }
  const order: NiveauCompetence[] = [
    NiveauCompetence.Debutant,
    NiveauCompetence.Intermediaire,
    NiveauCompetence.Avance,
    NiveauCompetence.Expert,
  ];
  if (typeof raw === 'number' && raw >= 0 && raw < order.length) {
    return order[raw];
  }
  return NiveauCompetence.Intermediaire;
}
