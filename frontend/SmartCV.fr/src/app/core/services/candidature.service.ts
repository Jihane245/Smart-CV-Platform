import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatutCandidature } from '../models/models';

const BASE = `${environment.backendUrl}/api/candidatures`;

export interface CandidatureListeItem {
  id: number;
  entreprise: string;
  poste: string;
  dateEnvoi: string;
  statut: string;
  notes?: string | null;
}

export interface CandidatureAjoutPayload {
  entreprise: string;
  poste: string;
  dateEnvoi: string;
  notes?: string | null;
}

export interface CandidatureParStatut {
  enregistree: number;
  envoyee: number;
  recue: number;
  enCoursExamen: number;
  entretien: number;
  acceptee: number;
  refusee: number;
  archivee: number;
}

export interface CandidatureStats {
  total: number;
  actives: number;
  acceptees: number;
  refusees: number;
  enCours: number;
  tauxAcceptation: number;
  parStatut: CandidatureParStatut;
}

@Injectable({ providedIn: 'root' })
export class CandidatureService {
  constructor(private http: HttpClient) {}

  getMesCandidatures(): Observable<CandidatureListeItem[]> {
    return this.http.get<CandidatureListeItem[]>(BASE, { withCredentials: true });
  }

  getStats(): Observable<CandidatureStats> {
    return this.http.get<CandidatureStats>(`${BASE}/stats`, { withCredentials: true });
  }

  ajouter(payload: CandidatureAjoutPayload): Observable<{ id: number; message?: string }> {
    return this.http.post<{ id: number; message?: string }>(BASE, payload, {
      withCredentials: true,
    });
  }

  changerStatut(id: number, statut: StatutCandidature | string): Observable<{ message?: string }> {
    return this.http.put<{ message?: string }>(
      `${BASE}/${id}/statut`,
      { statut: String(statut) },
      { withCredentials: true },
    );
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`, { withCredentials: true });
  }
}
