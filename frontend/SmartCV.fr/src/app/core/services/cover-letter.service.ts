import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = `${environment.backendUrl}/api/coverletter`;

export interface CoverLetterResponseDto {
  id: number;
  userId: number;
  offreId: number;
  contenu: string;
  dateGeneration: string;
  filePath?: string | null;
}

export interface CoverLetterGenerateDto {
  userId: number;
  offreId: number;
}

export interface CoverLetterUpdateDto {
  contenu: string;
}

@Injectable({ providedIn: 'root' })
export class CoverLetterService {
  constructor(private http: HttpClient) {}

  generate(dto: CoverLetterGenerateDto): Observable<CoverLetterResponseDto> {
    return this.http.post<CoverLetterResponseDto>(`${BASE}/generate`, dto, {
      withCredentials: true,
    });
  }

  getById(id: number): Observable<CoverLetterResponseDto> {
    return this.http.get<CoverLetterResponseDto>(`${BASE}/${id}`, {
      withCredentials: true,
    });
  }

  update(id: number, dto: CoverLetterUpdateDto): Observable<CoverLetterResponseDto> {
    return this.http.put<CoverLetterResponseDto>(`${BASE}/${id}`, dto, {
      withCredentials: true,
    });
  }

  getForUser(userId: number): Observable<CoverLetterResponseDto[]> {
    return this.http.get<CoverLetterResponseDto[]>(`${BASE}/user/${userId}`, {
      withCredentials: true,
    });
  }

  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${BASE}/${id}/pdf`, {
      withCredentials: true,
      responseType: 'blob',
    });
  }
}