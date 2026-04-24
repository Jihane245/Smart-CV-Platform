import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

function passwordsMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('motDePasse')?.value;
  const confirm = control.get('confirmMotDePasse')?.value;
  return password && confirm && password !== confirm
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inscription.html',
  styleUrl: './inscription.scss',
})
export class Inscription implements OnInit {
  inscriptionForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated().subscribe(isAuth => {
    if (isAuth) {
      this.authService.isAdmin().subscribe(isAdmin => {
        this.router.navigate([isAdmin ? '/admin' : '/user']);
      });
    }
  });

    this.inscriptionForm = this.fb.group(
      {
        nom: ['', [Validators.required, Validators.minLength(2)]],
        prenom: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        motDePasse: ['', [Validators.required, Validators.minLength(8)]],
        confirmMotDePasse: ['', Validators.required],
      },
      { validators: passwordsMatchValidator }
    );
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToConnexion(): void {
    this.authService.login();
  }

  onSubmit(): void {
    this.authService.register();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.inscriptionForm.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.inscriptionForm.get(field);
    return !!(ctrl && ctrl.hasError(error) && ctrl.touched);
  }

  get passwordsMismatch(): boolean {
    return !!(
      this.inscriptionForm.hasError('passwordsMismatch') &&
      this.inscriptionForm.get('confirmMotDePasse')?.touched
    );
  }
}