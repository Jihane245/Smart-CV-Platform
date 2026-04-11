import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class Connexion {
  connexionForm: FormGroup;
  showPassword = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.connexionForm = this.fb.group({
      identifiant: ['', [Validators.required]],
      motDePasse: ['', [Validators.required]],
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToInscription(): void {
    this.router.navigate(['/auth/inscription']);
  }

  goToMotDePasseOublie(): void {
    this.router.navigate(['/auth/mot-de-passe-oublie']);
  }

  onSubmit(): void {
    if (this.connexionForm.invalid) {
      this.connexionForm.markAllAsTouched();
      return;
    }
    console.log('Connexion:', this.connexionForm.value);
    // TODO: appel API
  }

  isInvalid(field: string): boolean {
    const ctrl = this.connexionForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}