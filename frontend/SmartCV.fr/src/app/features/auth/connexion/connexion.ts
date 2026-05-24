import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ACCOUNT_DISABLED_MESSAGE } from '../../../core/constants/auth-messages';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class Connexion implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  accountDisabled = Connexion.hasDisabledError(window.location.search);
  readonly disabledMessage = ACCOUNT_DISABLED_MESSAGE;

  ngOnInit(): void {
    this.applyAuthError(Connexion.readAuthError(window.location.search));
    this.route.queryParamMap.subscribe((params) => {
      this.applyAuthError(params.get('authError'));
    });

    // Compte désactivé → on reste sur la page d'erreur, surtout pas de redirection
    // (sinon login → erreur → /connexion → boucle).
    if (this.accountDisabled) return;

    // Cas normal après déconnexion : on dirige l'utilisateur vers le login.
    this.authService.isAuthenticated().subscribe((isAuth) => {
      if (isAuth) {
        // Déjà connecté (ex. retour après login) → laisser le guard router vers /user ou /admin.
        this.router.navigate(['/']);
      } else {
        // Déconnecté → page de login Keycloak.
        this.authService.login();
      }
    });
  }

  retryLogin(): void {
    this.authService.login();
  }

  private applyAuthError(authError: string | null): void {
    const disabled = authError === 'account_disabled';

    if (disabled && !this.accountDisabled) {
      this.notifications.error(this.disabledMessage);
    }

    this.accountDisabled = disabled;
    this.cdr.markForCheck();
  }

  private static readAuthError(search: string): string | null {
    return new URLSearchParams(search).get('authError');
  }

  private static hasDisabledError(search: string): boolean {
    return Connexion.readAuthError(search) === 'account_disabled';
  }
}
