import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAdmin().pipe(
    map(isAdmin => {
      if (isAdmin) return true;
      return router.createUrlTree(['/user']);
    }),
    catchError(() => of(router.createUrlTree(['/user'])))
  );
};