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
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  getStatus(): Observable<AuthStatus> {
    return this.http.get<AuthStatus>(
      `${environment.backendUrl}/api/auth/status`,
      { withCredentials: true },
    );
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${environment.backendUrl}/api/auth/me`, {
      withCredentials: true,
    });
  }

  login(): void {
    window.location.href = `${environment.backendUrl}/api/auth/login?returnUrl=${window.location.origin}`;
  }

  register(): void {
    window.location.href = `${environment.backendUrl}/api/auth/login?returnUrl=${window.location.origin}&action=register`;
  }

  logout(): void {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${environment.backendUrl}/api/auth/logout`;
    form.style.display = 'none';
    document.body.appendChild(form);
    form.submit();
  }

  isAuthenticated(): Observable<boolean> {
    return this.getStatus().pipe(
      map((status) => status.isAuthenticated),
      catchError(() => of(false)),
    );
  }

  isAdmin(): Observable<boolean> {
    return this.getMe().pipe(
      map((data) => {
        const claims = data.claims as { type: string; value: string }[];
        return (
          claims?.some(
            (c) =>
              (c.type === 'roles' || c.type === 'role') && c.value === 'Admin',
          ) ?? false
        );
      }),
      catchError(() => of(false)),
    );
  }
}
