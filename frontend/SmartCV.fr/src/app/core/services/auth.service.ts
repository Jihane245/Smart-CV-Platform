import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthStatus {
  isAuthenticated: boolean;
  identityName: string | null;
  preferredUsername: string | null;
  email: string | null;
  name: string | null;
  givenName: string | null;
  surname: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly backendUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(
      `${this.backendUrl}/api/auth/status`,
      { withCredentials: true }
    );
  }

  getMe(): Observable<any> {
    return this.http.get<any>(
      `${this.backendUrl}/api/auth/me`,
      { withCredentials: true }
    );
  }

  login(): void {
    const returnUrl = encodeURIComponent(window.location.origin);
    window.location.href = `${this.backendUrl}/api/auth/login?returnUrl=${returnUrl}`;
  }

  register(): void {
    const returnUrl = encodeURIComponent(window.location.origin);
    window.location.href = `${this.backendUrl}/api/auth/login?returnUrl=${returnUrl}&action=register`;
  }

  logout(): void {
    window.location.href = `${this.backendUrl}/api/auth/logout`;
  }

  isAuthenticated(): Observable<boolean> {
    return this.getStatus().pipe(
      map(status => status.isAuthenticated),
      catchError(() => of(false))
    );
  }

  isAdmin(): Observable<boolean> {
    return this.getMe().pipe(
      map(data => {
        const claims = data.claims as { type: string; value: string }[];
        return claims?.some(c =>
          (c.type === 'roles' || c.type === 'role') &&
          c.value === 'Admin'
        ) ?? false;
      }),
      catchError(() => of(false))
    );
  }
}