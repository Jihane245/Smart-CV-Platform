import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const BASE = `${environment.backendUrl}/api/dashboard/user`;

export interface DashboardUserDto {
  nbCv: number;
  nbLettres: number;
  nbTests: number;
  nbRoadmaps: number;
  nbCompetences: number;
  scoreCvMoyen: number;
  scoreTestsMoyen: number;
  tauxReussiteTests: number;
  topCompetencesCv: string[];
  competencesFaibles: string[];
  recommendation: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardUserService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardUserDto> {
    return this.http.get<DashboardUserDto>(BASE, { withCredentials: true });
  }
}
