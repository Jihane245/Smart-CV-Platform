import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'inscription',
        loadComponent: () =>
          import('./features/auth/pages/inscription/inscription').then(
            (m) => m.Inscription
          ),
      },
      {
        path: 'connexion',
         loadComponent: () =>
           import('./features/auth/pages/connexion/connexion').then(
             (m) => m.Connexion
           ),
       },
      { path: '', redirectTo: 'inscription', pathMatch: 'full' },
    ],
  },
];