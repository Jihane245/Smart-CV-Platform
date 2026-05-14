import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const COVER_LETTER_BASE = `${environment.backendUrl}/api/coverletter`;

export interface CoverLetterGeneratePayload {
  /** Optionnel : si absent, le backend prend le user JWT courant. */
  userId?: number;
  offreId?: number;
  offreTexte?: string;
  offreTitre?: string;
  offreEntreprise?: string;
  /** Optionnel : référence un CV déjà généré pour enrichir le prompt. */
  cvId?: number;
}

export interface CoverLetterResponse {
  id: number;
  userId: number;
  offreId: number;
  contenu: string;
  dateGeneration: string;
  filePath?: string | null;
}

export interface CoverLetterRawResponse {
  contenu: string;
  dateGeneration: string;
  source: 'pdf' | 'profil';
}

@Injectable({ providedIn: 'root' })
export class CoverLetterService {
  constructor(private http: HttpClient) {}

  /** Cas A et B : offre (id ou texte) + CV optionnel par id. Persiste la lettre en DB. */
  generate(payload: CoverLetterGeneratePayload): Observable<CoverLetterResponse> {
    return this.http.post<CoverLetterResponse>(
      `${COVER_LETTER_BASE}/generate`,
      payload,
      { withCredentials: true },
    );
  }

  /**
   * Cas C : upload PDF (optionnel — fallback sur profil DB si absent) + texte d'offre.
   * Aucune persistance.
   */
  generateFromUpload(
    offreText: string,
    cvPdf?: File | null,
    offreTitre?: string,
    offreEntreprise?: string,
  ): Observable<CoverLetterRawResponse> {
    const fd = new FormData();
    fd.append('offreText', offreText);
    if (cvPdf) fd.append('cvPdf', cvPdf, cvPdf.name);
    if (offreTitre) fd.append('offreTitre', offreTitre);
    if (offreEntreprise) fd.append('offreEntreprise', offreEntreprise);

    return this.http.post<CoverLetterRawResponse>(
      `${COVER_LETTER_BASE}/generate-from-upload`,
      fd,
      { withCredentials: true },
    );
  }

  getById(id: number): Observable<CoverLetterResponse> {
    return this.http.get<CoverLetterResponse>(`${COVER_LETTER_BASE}/${id}`, {
      withCredentials: true,
    });
  }

  getMine(userId: number): Observable<CoverLetterResponse[]> {
    return this.http.get<CoverLetterResponse[]>(
      `${COVER_LETTER_BASE}/user/${userId}`,
      { withCredentials: true },
    );
  }

  update(id: number, contenu: string): Observable<CoverLetterResponse> {
    return this.http.put<CoverLetterResponse>(
      `${COVER_LETTER_BASE}/${id}`,
      { contenu },
      { withCredentials: true },
    );
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${COVER_LETTER_BASE}/${id}/pdf`, {
      withCredentials: true,
      responseType: 'blob',
    });
  }

  generateAndSave(fd: FormData): Observable<CoverLetterResponse> {
    return this.http.post<CoverLetterResponse>(
      `${COVER_LETTER_BASE}/generate-and-save`,
      fd,
      { withCredentials: true },
    );
  }
}
