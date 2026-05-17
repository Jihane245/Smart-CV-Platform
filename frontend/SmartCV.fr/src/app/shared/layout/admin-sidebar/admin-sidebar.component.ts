import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent implements OnInit {
  isCollapsed = false;
  displayName = 'Administrateur';
  userInitials = 'A';

  constructor(
    private authService: AuthService,
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.authService.getStatus().subscribe({
      next: (status) => {
        const given = status.givenName ?? '';
        const surname = status.surname ?? '';
        this.displayName = `${given} ${surname}`.trim() || status.preferredUsername || 'Administrateur';
        this.userInitials = (given.charAt(0) + surname.charAt(0)).toUpperCase() || 'A';
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  async logout(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Se déconnecter ?',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      confirmText: 'Se déconnecter',
      cancelText: 'Annuler',
      type: 'danger',
    });
    if (!ok) return;
    this.authService.logout();
  }
}