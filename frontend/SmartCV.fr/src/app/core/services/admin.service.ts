import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const API_BASE = 'http://localhost:5000/api/admin';

export interface AdminStatDto {
  label: string;
  valeur: number;
  delta: number;
  couleur: 'green' | 'beige' | 'red';
  historique: number[];
}

export interface AdminUtilisateurDto {
  id: number;
  initiales: string;
  couleurAvatar: string;
  nom: string;
  role: string;
  email: string;
  cvGeneres: number;
  inscritLe: string;
  actif: boolean;
}

type AdminUtilisateurApiDto = Omit<AdminUtilisateurDto, 'id'> & { id: string | number };

export interface AdminUtilisateurDetailDto {
  id: number;
  initiales: string;
  couleurAvatar: string;
  nom: string;
  prenom: string;
  nomFamille: string;
  role: string;
  email: string;
  cvGeneres: number;
  inscritLe: string;
  dateCreation: string;
  actif: boolean;
}

export interface AdminTemplateDto {
  id: number;
  nom: string;
  couleur: string;
  lignes: string[];
}

export interface UpdateActifPayload {
  actif: boolean;
}

export interface CreateTemplatePayload {
  nom: string;
  couleur: string;
  lignes?: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStatDto[]> {
    return this.http.get<AdminStatDto[]>(`${API_BASE}/stats`, { withCredentials: true });
  }

  getUtilisateurs(search?: string): Observable<AdminUtilisateurDto[]> {
    const q = (search ?? '').trim();
    const url = q ? `${API_BASE}/utilisateurs?search=${encodeURIComponent(q)}` : `${API_BASE}/utilisateurs`;
    return this.http
      .get<AdminUtilisateurApiDto[]>(url, { withCredentials: true })
      .pipe(
        map((users) =>
          users.map((u) => ({
            ...u,
            id: typeof u.id === 'number' ? u.id : Number.parseInt(u.id, 10),
          }))
        )
      );
  }

  getUtilisateur(id: number): Observable<AdminUtilisateurDetailDto> {
    return this.http.get<AdminUtilisateurDetailDto>(`${API_BASE}/utilisateurs/${id}`, {
      withCredentials: true,
    });
  }

  updateActif(userId: number, actif: boolean): Observable<unknown> {
    return this.http.put(`${API_BASE}/utilisateurs/${userId}/actif`, { actif } satisfies UpdateActifPayload, {
      withCredentials: true,
    });
  }

  deleteUtilisateur(userId: number): Observable<unknown> {
    return this.http.delete(`${API_BASE}/utilisateurs/${userId}`, { withCredentials: true });
  }

  getTemplates(): Observable<AdminTemplateDto[]> {
    return this.http.get<AdminTemplateDto[]>(`${API_BASE}/templates`, { withCredentials: true });
  }

  createTemplate(payload: CreateTemplatePayload): Observable<AdminTemplateDto> {
    return this.http.post<AdminTemplateDto>(`${API_BASE}/templates`, payload, { withCredentials: true });
  }

  deleteTemplate(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE}/templates/${id}`, { withCredentials: true });
  }
}

