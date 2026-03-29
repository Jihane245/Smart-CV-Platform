import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
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
        path: '',
        redirectTo: 'inscription',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'user',
    loadComponent: () =>
      import('./shared/layout/sidebar/sidebar.component').then(
        (m) => m.SidebarComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/user/pages/home/home').then(
            (m) => m.Home
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/user/pages/profile/profile').then(
            (m) => m.Profile
          ),
      },
      {
        path: 'generate-cv',
        loadComponent: () =>
          import('./features/user/pages/generate-cv/generate-cv').then(
            (m) => m.GenerateCv
          ),
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./features/user/pages/applications/applications').then(
            (m) => m.Applications
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/user/pages/settings/settings').then(
            (m) => m.Settings
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];