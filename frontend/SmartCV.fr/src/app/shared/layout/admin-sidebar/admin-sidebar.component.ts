import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent implements OnInit {
  displayName = 'Administrateur';
  userInitials = 'A';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getMe().subscribe({
      next: (data) => {
        const given = data.givenName ?? '';
        const surname = data.surname ?? '';
        this.displayName =
          `${given} ${surname}`.trim() || data.preferredUsername || 'Administrateur';
        this.userInitials =
          (given.charAt(0) + surname.charAt(0)).toUpperCase() || 'A';
      },
      error: () => {
        this.displayName = 'Administrateur';
        this.userInitials = 'A';
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
