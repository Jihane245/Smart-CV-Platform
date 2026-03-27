import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { KeycloakService, UserProfile } from '../core/services/keycloak.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  userProfile: UserProfile | null = null;
  isSidebarCollapsed = false;
  isLoggingOut = false;

  private sub!: Subscription;

  constructor(private keycloak: KeycloakService) {}

  ngOnInit(): void {
    this.sub = this.keycloak.userProfile$.subscribe((p) => {
      this.userProfile = p;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  logout(): void {
    this.isLoggingOut = true;
    this.keycloak.logout();
  }

  // "Prenom Nom" — matches French convention and the backend User model
  get displayName(): string {
    if (this.userProfile?.prenom) {
      return `${this.userProfile.prenom} ${this.userProfile.nom ?? ''}`.trim();
    }
    return this.userProfile?.username ?? 'Utilisateur';
  }

  get userInitials(): string {
    const prenom = this.userProfile?.prenom ?? '';
    const nom = this.userProfile?.nom ?? '';
    if (prenom && nom) return (prenom[0] + nom[0]).toUpperCase();
    if (prenom) return prenom.slice(0, 2).toUpperCase();
    return (this.userProfile?.username ?? 'U').slice(0, 2).toUpperCase();
  }

  get isAdmin(): boolean {
    return this.keycloak.isAdmin();
  }
}