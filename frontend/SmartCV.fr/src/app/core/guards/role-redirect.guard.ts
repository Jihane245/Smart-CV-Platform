import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const roleRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated().pipe(
    switchMap(isAuth => {
      if (!isAuth) {
        authService.login();
        return of(false);
      }
      return authService.isAdmin().pipe(
        switchMap(isAdmin =>
          of(router.createUrlTree(isAdmin ? ['/admin'] : ['/user']))
        )
      );
    }),
    catchError(() => {
      authService.login();
      return of(false);
    })
  );
};