import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  return authService.isAuthenticated().pipe(
    map(isAuth => {
      if (isAuth) return true;
      authService.login();
      return false;
    }),
    catchError(() => {
      authService.login();
      return of(false);
    })
  );
};