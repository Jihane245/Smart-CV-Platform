import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ProfilService, toAbsolutePhotoUrl } from '../../../core/services/profil.service';
import { NotificationContainer } from '../../components/notification-container/notification-container';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, NotificationContainer, ConfirmDialog],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  displayName = '';
  userInitials = '';
  photoUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private confirmService: ConfirmService,
    private profilService: ProfilService,
  ) {}

  ngOnInit(): void {
    // 1. Identité (prénom, nom, initiales) — depuis Keycloak
    this.authService.getMe().subscribe({
      next: (data) => {
        const given = data.givenName ?? '';
        const surname = data.surname ?? '';
        this.displayName =
          `${given} ${surname}`.trim() || data.preferredUsername || '';
        this.userInitials =
          (given.charAt(0) + surname.charAt(0)).toUpperCase() || '?';
      },
      error: () => {
        this.displayName = 'Utilisateur';
        this.userInitials = 'U';
      }
    });

    // 2. Photo de profil — depuis le profil utilisateur (BDD)
    // Si pas de photo → photoUrl reste null → on tombe sur les initiales (HTML)
    this.profilService.getMe().subscribe({
      next: (profil) => {
        this.photoUrl = toAbsolutePhotoUrl(profil.photoUrl);
      },
      error: () => {
        // Pas grave : on garde le fallback initiales
        this.photoUrl = null;
      }
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  async logout(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Se déconnecter ?',
      message: 'Voulez-vous vraiment vous déconnecter ? Toutes vos modifications non enregistrées seront perdues.',
      confirmText: 'Se déconnecter',
      cancelText: 'Annuler',
      type: 'danger',
    });
    if (!ok) return;
    this.authService.logout();
  }
}