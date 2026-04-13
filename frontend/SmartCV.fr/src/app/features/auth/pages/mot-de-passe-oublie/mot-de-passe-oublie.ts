import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mot-de-passe-oublie.html',
  styleUrl: './mot-de-passe-oublie.scss',
})
export class MotDePasseOublie {
  form: FormGroup;
  emailEnvoye = false;
  emailSoumis = '';
  isSubmitting = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.emailSoumis = this.form.value.email;
    // TODO: appel API
    setTimeout(() => {
      this.isSubmitting = false;
      this.emailEnvoye = true;
    }, 1500);
  }

  retourConnexion(): void {
    this.router.navigate(['/auth/connexion']);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }
}