import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const API_BASE = `${environment.backendUrl}/api/admin`

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

export interface UpdateActifPayload {
  actif: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// TEMPLATES — types pour la STRUCTURE (Phase 1)
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
  // Ancien format (rétro-compat)
  sections: TemplateSectionDto[];

  // Nouveau format builder visuel
  layout?: TemplateLayoutId;
  couleurPrimaire?: string;
  boxes?: TemplateBoxDto[];
}

// ─────────────────────────────────────────────────────────────────────────
// TEMPLATES — types pour le BUILDER VISUEL (Phase 2)
// ─────────────────────────────────────────────────────────────────────────
export type TemplateLayoutId =
  | 'single-column'
  | 'header-two-columns'
  | 'sidebar-left'
  | 'sidebar-right';

export type TemplateComponentType =
  | 'infos-personnelles'
  | 'photo'
  | 'titre-poste'
  | 'resume'
  | 'experiences'
  | 'formations'
  | 'competences'
  | 'langues'
  | 'projets'
  | 'certifications'
  | 'centres-interet'
  | 'references'
  | 'texte-libre';

export interface TemplateBoxStyleDto {
  background?: string;
  textColor?: string;
  accentColor?: string;
  padding?: string;
}

export interface TemplateComponentDto {
  id: string;
  type: TemplateComponentType;
  titre?: string;
  config?: Record<string, unknown>;
}

export interface TemplateBoxDto {
  id: string;
  label: string;
  style: TemplateBoxStyleDto;
  components: TemplateComponentDto[];
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
    return this.http.get<AdminUtilisateurDto[]>(url, { withCredentials: true });
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

  // ───── TEMPLATES ─────
  getTemplates(): Observable<AdminTemplateDto[]> {
    return this.http.get<AdminTemplateDto[]>(`${API_BASE}/templates`, { withCredentials: true });
  }

  getTemplateById(id: number): Observable<AdminTemplateDto> {
    return this.http.get<AdminTemplateDto>(`${API_BASE}/templates/${id}`, { withCredentials: true });
  }

  createTemplate(payload: CreateTemplatePayload): Observable<AdminTemplateDto> {
    return this.http.post<AdminTemplateDto>(`${API_BASE}/templates`, payload, { withCredentials: true });
  }

  updateTemplate(id: number, payload: UpdateTemplatePayload): Observable<AdminTemplateDto> {
    return this.http.put<AdminTemplateDto>(`${API_BASE}/templates/${id}`, payload, { withCredentials: true });
  }

  deleteTemplate(id: number): Observable<unknown> {
    return this.http.delete(`${API_BASE}/templates/${id}`, { withCredentials: true });
  }
}
