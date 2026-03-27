import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Mirrors what Keycloak returns in the token/profile.
// Nom and Prenom match the backend User model fields exactly.
export interface UserProfile {
  id?: string;          // Keycloak subject (UUID) — not the DB integer Id
  username?: string;
  email?: string;
  nom?: string;         // family_name / lastName in Keycloak token
  prenom?: string;      // given_name / firstName in Keycloak token
  avatarUrl?: string;   // mapped from Google's "picture" claim
  role?: string;        // mapped from Keycloak realm role
}

@Injectable({
  providedIn: 'root',
})
export class KeycloakService {
  private keycloak!: Keycloak;
  private _isAuthenticated$ = new BehaviorSubject<boolean>(false);
  private _userProfile$ = new BehaviorSubject<UserProfile | null>(null);

  isAuthenticated$: Observable<boolean> = this._isAuthenticated$.asObservable();
  userProfile$: Observable<UserProfile | null> = this._userProfile$.asObservable();

  async init(): Promise<boolean> {
    this.keycloak = new Keycloak({
      url: environment.keycloak.url,
      realm: environment.keycloak.realm,
      clientId: environment.keycloak.clientId,
    });

    const authenticated = await this.keycloak.init({
      onLoad: 'check-sso',
      // silent-check-sso.html is in src/ and served at root by nginx
      // (configured in angular.json assets and nginx.conf)
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
    });

    this._isAuthenticated$.next(authenticated);

    if (authenticated) {
      await this.loadUserProfile();
    }

    // Auto-refresh the token 60s before it expires
    this.keycloak.onTokenExpired = () => {
      this.keycloak.updateToken(60).catch(() => this.logout());
    };

    return authenticated;
  }

  // ── Standard login ────────────────────────────────────────────────────────
  login(redirectUri?: string): void {
    this.keycloak.login({
      redirectUri: redirectUri ?? window.location.origin + '/sidebar',
    });
  }

  // ── Google SSO login ──────────────────────────────────────────────────────
  // Requires a Google IdP configured in Keycloak with alias "google"
  loginWithGoogle(redirectUri?: string): void {
    this.keycloak.login({
      idpHint: 'google',
      redirectUri: redirectUri ?? window.location.origin + '/sidebar',
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(redirectUri?: string): void {
    this._isAuthenticated$.next(false);
    this._userProfile$.next(null);
    this.keycloak.logout({
      redirectUri: redirectUri ?? window.location.origin + '/login',
    });
  }

  // ── Token helpers ─────────────────────────────────────────────────────────
  getToken(): string | undefined {
    return this.keycloak.token;
  }

  async getValidToken(): Promise<string> {
    await this.keycloak.updateToken(30);
    return this.keycloak.token!;
  }

  isAuthenticated(): boolean {
    return this.keycloak.authenticated ?? false;
  }

  hasRole(role: string): boolean {
    return this.keycloak.hasRealmRole(role);
  }

  isAdmin(): boolean {
    return this.hasRole('Admin');
  }

  // ── Profile ───────────────────────────────────────────────────────────────
  private async loadUserProfile(): Promise<void> {
    const profile = await this.keycloak.loadUserProfile();

    // Keycloak stores firstName/lastName internally but our backend uses
    // Nom (family name) and Prenom (given name). Map accordingly.
    this._userProfile$.next({
      id: this.keycloak.subject,
      username: profile.username,
      email: profile.email,
      prenom: profile.firstName,                                    // given name
      nom: profile.lastName,                                        // family name
      // avatarUrl: (profile.attributes?.['picture']?.[0] as string) ?? undefined,
      role: this.isAdmin() ? 'Admin' : 'Candidat',
    });
  }

  get userProfile(): UserProfile | null {
    return this._userProfile$.getValue();
  }
}