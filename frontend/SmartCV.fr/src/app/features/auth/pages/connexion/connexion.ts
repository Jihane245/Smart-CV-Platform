import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class Connexion implements OnInit {
  connexionForm: FormGroup;
  showPassword = false;

  // true tant qu'on n'a pas fini de déterminer la redirection → masque le formulaire
  isRedirecting = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.connexionForm = this.fb.group({
      identifiant: ['', [Validators.required]],
      motDePasse: ['', [Validators.required]],
    });
  }

   ngOnInit(): void {
      this.authService.isAuthenticated().subscribe({
        next: (isAuth) => {
          if (isAuth) {
            // Déjà authentifié → redirection vers admin ou user
            this.authService.isAdmin().subscribe((isAdmin) => {
              this.router.navigate([isAdmin ? '/admin' : '/user']);
            });
          } else {
            // Pas authentifié → redirection directe vers Keycloak
            this.authService.login();
          }
        },
        error: () => {
          // En cas d'erreur on tente la redirection Keycloak quand même
          this.authService.login();
        }
      });
    }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToInscription(): void {
    this.authService.register();
  }

  goToMotDePasseOublie(): void {
    this.authService.login();
  }

  onSubmit(): void {
    this.authService.login();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.connexionForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}