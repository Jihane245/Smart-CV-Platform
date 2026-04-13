import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  displayName = '';
  userInitials = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (data) => {
        const given = data.givenName ?? '';
        const surname = data.surname ?? '';
        this.displayName = `${given} ${surname}`.trim() || data.preferredUsername || '';
        this.userInitials = (given.charAt(0) + surname.charAt(0)).toUpperCase() || '?';
      },
      error: () => {
        this.displayName = 'Utilisateur';
        this.userInitials = 'U';
      }
    });
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}