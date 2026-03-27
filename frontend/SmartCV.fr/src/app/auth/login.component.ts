import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeycloakService } from '../core/services/keycloak.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  showPassword = false;

  constructor(
    private keycloak: KeycloakService,
    private router: Router
  ) {
    // If already authenticated, redirect to sidebar
    if (this.keycloak.isAuthenticated()) {
      this.router.navigate(['/sidebar']);
    }
  }

  onLogin(): void {
    // Delegates entirely to Keycloak — redirects to Keycloak login UI
    // which then redirects back to /sidebar on success.
    this.keycloak.login();
  }

  onGoogleLogin(): void {
    this.keycloak.loginWithGoogle();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegister(): void {
    // Keycloak registration page
    this.keycloak.login(); // or use keycloak.register() if exposed
  }
}