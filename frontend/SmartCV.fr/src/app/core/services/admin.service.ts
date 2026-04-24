 import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable } from 'rxjs';
  import { map } from 'rxjs/operators';

  const API_BASE = 'http://localhost:5000/api/admin';

  // ─────────────────────────────────────────────────────────────────────────
  // STATISTIQUES
  // ─────────────────────────────────────────────────────────────────────────
  export interface AdminStatDto {
    label: string;
    valeur: number;
    delta: number;
    couleur: 'green' | 'beige' | 'red';
    historique: number[];
  }
  // ─────────────────────────────────────────────────────────────────────────
  // UTILISATEURS
  // ─────────────────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────
  // TEMPLATES — types pour la STRUCTURE (nouveauté Phase 1)
  // ─────────────────────────────────────────────────────────────────────────
  export interface TemplateFieldDto {
    nom: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'date' | 'long_text' | 'list';
    placeholder?: string;
    maxLength?: number;
    requis: boolean;
    ordre: number;
  }

  export interface TemplateSectionDto {
    id?: string;
    titre: string;
    ordre: number;
    couleur?: string;
    champs: TemplateFieldDto[];
  }

  export interface TemplateStructureDto {
    sections: TemplateSectionDto[];
  }

  export interface AdminTemplateDto {
    id: number;
    nom: string;
    couleur: string;
    lignes: string[];
    structure?: TemplateStructureDto | null;
  }

  export interface CreateTemplatePayload {
    nom: string;
    couleur: string;
    lignes?: string[];
    structure?: TemplateStructureDto;
  }

  export interface UpdateTemplatePayload {
    nom: string;
    couleur: string;
    structure?: TemplateStructureDto;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SERVICE
  // ─────────────────────────────────────────────────────────────────────────
  @Injectable({ providedIn: 'root' })
  export class AdminService {
    constructor(private http: HttpClient) {}

    // ───── STATS ─────
    getStats(): Observable<AdminStatDto[]> {
      return this.http.get<AdminStatDto[]>(`${API_BASE}/stats`, { withCredentials: true });
    }

    // ───── UTILISATEURS ─────
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

    updateActif(userId: number, actif: boolean): Observable<unknown> {
      return this.http.put(`${API_BASE}/utilisateurs/${userId}/actif`, { actif }, {
        withCredentials: true,
      });
    }

    deleteUtilisateur(userId: number): Observable<unknown> {
      return this.http.delete(`${API_BASE}/utilisateurs/${userId}`, { withCredentials: true });
    }

    // ───── TEMPLATES ─────
    getTemplates(): Observable<AdminTemplateDto[]> {
      return this.http.get<AdminTemplateDto[]>(`${API_BASE}/templates`, { withCredentials: true });
    }

    // NOUVEAU : récupérer un seul template avec sa structure complète
   getTemplateById(id: number): Observable<AdminTemplateDto> {
      return this.http.get<AdminTemplateDto>(`${API_BASE}/templates/${id}`, { withCredentials: true });
    }

    createTemplate(payload: CreateTemplatePayload): Observable<AdminTemplateDto> {
      return this.http.post<AdminTemplateDto>(`${API_BASE}/templates`, payload, { withCredentials: true });
    }

    // NOUVEAU : mettre à jour un template existant
     updateTemplate(id: number, payload: UpdateTemplatePayload): Observable<AdminTemplateDto> {
      return this.http.put<AdminTemplateDto>(`${API_BASE}/templates/${id}`, payload, { withCredentials: true });
    }

    deleteTemplate(id: number): Observable<unknown> {
      return this.http.delete(`${API_BASE}/templates/${id}`, { withCredentials: true });
    }
    
  }