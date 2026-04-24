import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';    // ← remplace RouterTestingModule
import { CommonModule } from '@angular/common';
import { vi } from 'vitest';                        // ← import vi pour les spies
import { of } from 'rxjs';
import { Inscription } from './inscription';
import { AuthService } from '../../../../core/services/auth.service';

describe('Inscription Component', () => {
  let component: Inscription;
  let fixture: ComponentFixture<Inscription>;
  let authServiceMock: { isAuthenticated: () => any; login: () => void; register: () => void };

  beforeEach(async () => {
    authServiceMock = {
      isAuthenticated: vi.fn(() => of(false)),
      login: vi.fn(),
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [
        Inscription,
        ReactiveFormsModule,
        CommonModule,
      ],
      providers: [
        provideRouter([]),   
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inscription);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1. CRÉATION
  // ─────────────────────────────────────────────────────────────────────────
  describe('Création', () => {
    it('devrait créer le composant', () => {
      expect(component).toBeTruthy();
    });

    it('devrait initialiser le formulaire avec des champs vides', () => {
      expect(component.inscriptionForm).toBeTruthy();
      expect(component.inscriptionForm.get('nom')?.value).toBe('');
      expect(component.inscriptionForm.get('prenom')?.value).toBe('');
      expect(component.inscriptionForm.get('email')?.value).toBe('');
      expect(component.inscriptionForm.get('motDePasse')?.value).toBe('');
      expect(component.inscriptionForm.get('confirmMotDePasse')?.value).toBe('');
    });

    it('devrait avoir le formulaire invalide au départ', () => {
      expect(component.inscriptionForm.invalid).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 2. VALIDATION — NOM
  // ─────────────────────────────────────────────────────────────────────────
  describe('Validation — Nom', () => {
    it('devrait être invalide si nom est vide', () => {
      component.inscriptionForm.get('nom')?.setValue('');
      expect(component.inscriptionForm.get('nom')?.hasError('required')).toBe(true);
    });

    it('devrait être invalide si nom a moins de 2 caractères', () => {
      component.inscriptionForm.get('nom')?.setValue('A');
      expect(component.inscriptionForm.get('nom')?.hasError('minlength')).toBe(true);
    });

    it('devrait être valide si nom a 2 caractères ou plus', () => {
      component.inscriptionForm.get('nom')?.setValue('Ali');
      expect(component.inscriptionForm.get('nom')?.valid).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. VALIDATION — PRÉNOM
  // ─────────────────────────────────────────────────────────────────────────
  describe('Validation — Prénom', () => {
    it('devrait être invalide si prénom est vide', () => {
      component.inscriptionForm.get('prenom')?.setValue('');
      expect(component.inscriptionForm.get('prenom')?.hasError('required')).toBe(true);
    });

    it('devrait être invalide si prénom a moins de 2 caractères', () => {
      component.inscriptionForm.get('prenom')?.setValue('A');
      expect(component.inscriptionForm.get('prenom')?.hasError('minlength')).toBe(true);
    });

    it('devrait être valide si prénom a 2 caractères ou plus', () => {
      component.inscriptionForm.get('prenom')?.setValue('Jihane');
      expect(component.inscriptionForm.get('prenom')?.valid).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 4. VALIDATION — EMAIL
  // ─────────────────────────────────────────────────────────────────────────
  describe('Validation — Email', () => {
    it('devrait être invalide si email est vide', () => {
      component.inscriptionForm.get('email')?.setValue('');
      expect(component.inscriptionForm.get('email')?.hasError('required')).toBe(true);
    });

    it('devrait être invalide si email est mal formaté', () => {
      component.inscriptionForm.get('email')?.setValue('emailinvalide');
      expect(component.inscriptionForm.get('email')?.hasError('email')).toBe(true);
    });

    it('devrait être valide si email est correct', () => {
      component.inscriptionForm.get('email')?.setValue('jihane@email.com');
      expect(component.inscriptionForm.get('email')?.valid).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. VALIDATION — MOT DE PASSE
  // ─────────────────────────────────────────────────────────────────────────
  describe('Validation — Mot de passe', () => {
    it('devrait être invalide si mot de passe est vide', () => {
      component.inscriptionForm.get('motDePasse')?.setValue('');
      expect(component.inscriptionForm.get('motDePasse')?.hasError('required')).toBe(true);
    });

    it('devrait être invalide si mot de passe a moins de 8 caractères', () => {
      component.inscriptionForm.get('motDePasse')?.setValue('abc123');
      expect(component.inscriptionForm.get('motDePasse')?.hasError('minlength')).toBe(true);
    });

    it('devrait être valide si mot de passe a 8 caractères ou plus', () => {
      component.inscriptionForm.get('motDePasse')?.setValue('motdepasse123');
      expect(component.inscriptionForm.get('motDePasse')?.valid).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 6. VALIDATION — CONFIRMATION MOT DE PASSE
  // ─────────────────────────────────────────────────────────────────────────
  describe('Validation — Confirmation mot de passe', () => {
    it('devrait être invalide si confirmation est vide', () => {
      component.inscriptionForm.get('confirmMotDePasse')?.setValue('');
      expect(component.inscriptionForm.get('confirmMotDePasse')?.hasError('required')).toBe(true);
    });

    it('devrait afficher passwordsMismatch si les mots de passe sont différents', () => {
      component.inscriptionForm.get('motDePasse')?.setValue('motdepasse123');
      component.inscriptionForm.get('confirmMotDePasse')?.setValue('autremotdepasse');
      component.inscriptionForm.get('confirmMotDePasse')?.markAsTouched();
      expect(component.passwordsMismatch).toBe(true);
    });

    it('ne devrait pas afficher passwordsMismatch si les mots de passe sont identiques', () => {
      component.inscriptionForm.get('motDePasse')?.setValue('motdepasse123');
      component.inscriptionForm.get('confirmMotDePasse')?.setValue('motdepasse123');
      component.inscriptionForm.get('confirmMotDePasse')?.markAsTouched();
      expect(component.passwordsMismatch).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 7. FORMULAIRE COMPLET
  // ─────────────────────────────────────────────────────────────────────────
  describe('Formulaire complet', () => {
    function remplirFormulaireValide(comp: Inscription) {
      comp.inscriptionForm.setValue({
        nom: 'El Ghazrani',
        prenom: 'Jihane',
        email: 'jihane@email.com',
        motDePasse: 'motdepasse123',
        confirmMotDePasse: 'motdepasse123',
      });
    }

    it('devrait être valide quand tous les champs sont corrects', () => {
      remplirFormulaireValide(component);
      expect(component.inscriptionForm.valid).toBe(true);
    });

    it('devrait être invalide si un seul champ est vide', () => {
      remplirFormulaireValide(component);
      component.inscriptionForm.get('email')?.setValue('');
      expect(component.inscriptionForm.invalid).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 8. TOGGLE VISIBILITÉ
  // ─────────────────────────────────────────────────────────────────────────
  describe('Toggle visibilité', () => {
    it('showPassword devrait être false au départ', () => {
      expect(component.showPassword).toBe(false);
    });

    it('togglePassword devrait passer showPassword à true', () => {
      component.togglePassword();
      expect(component.showPassword).toBe(true);
    });

    it('togglePassword appelé deux fois devrait revenir à false', () => {
      component.togglePassword();
      component.togglePassword();
      expect(component.showPassword).toBe(false);
    });

    it('showConfirmPassword devrait être false au départ', () => {
      expect(component.showConfirmPassword).toBe(false);
    });

    it('toggleConfirmPassword devrait passer à true', () => {
      component.toggleConfirmPassword();
      expect(component.showConfirmPassword).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 9. HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  describe('Helpers isInvalid / hasError', () => {
    it('isInvalid devrait retourner false si le champ n\'est pas touché', () => {
      expect(component.isInvalid('nom')).toBe(false);
    });

    it('isInvalid devrait retourner true si champ invalide et touché', () => {
      component.inscriptionForm.get('nom')?.markAsTouched();
      expect(component.isInvalid('nom')).toBe(true);
    });

    it('hasError devrait retourner true pour l\'erreur correspondante', () => {
      component.inscriptionForm.get('nom')?.markAsTouched();
      expect(component.hasError('nom', 'required')).toBe(true);
    });

    it('hasError devrait retourner false si champ valide', () => {
      component.inscriptionForm.get('nom')?.setValue('Jihane');
      component.inscriptionForm.get('nom')?.markAsTouched();
      expect(component.hasError('nom', 'required')).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 10. SOUMISSION
  // ─────────────────────────────────────────────────────────────────────────
  describe('Soumission', () => {
    it('devrait appeler register() sur soumission', () => {
      component.onSubmit();
      expect(authServiceMock.register).toHaveBeenCalledTimes(1);
    });

    it('ne devrait pas marquer automatiquement les champs comme touchés', () => {
      expect(component.inscriptionForm.get('nom')?.touched).toBe(false);
      component.onSubmit();
      expect(component.inscriptionForm.get('nom')?.touched).toBe(false);
      expect(component.inscriptionForm.get('email')?.touched).toBe(false);
    });

    it('ne devrait pas modifier isSubmitting (géré ailleurs)', () => {
      component.inscriptionForm.setValue({
        nom: 'El Ghazrani',
        prenom: 'Jihane',
        email: 'jihane@email.com',
        motDePasse: 'motdepasse123',
        confirmMotDePasse: 'motdepasse123',
      });
      component.onSubmit();
      expect(authServiceMock.register).toHaveBeenCalledTimes(1);
      expect(component.isSubmitting).toBe(false);
    });
  });
});