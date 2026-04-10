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
       {
          path: 'mot-de-passe-oublie',
          loadComponent: () =>
            import('./features/auth/pages/mot-de-passe-oublie/mot-de-passe-oublie').then(
              (m) => m.MotDePasseOublie
            ),
        },
      { path: '', redirectTo: 'inscription', pathMatch: 'full' },
    ],
  },
  {
    path: 'profil',
      loadComponent: () =>
        import('./features/user/pages/profil/profil').then(
          (m) => m.MonProfil
        ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard').then(m => m.Dashboard),
  },
    
];