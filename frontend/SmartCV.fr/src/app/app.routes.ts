import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

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
        path: 'mot-de-passe-oublie',
        loadComponent: () =>
          import('./features/auth/pages/mot-de-passe-oublie/mot-de-passe-oublie').then(
            (m) => m.MotDePasseOublie
          ),
      },
      {
        path: '',
        redirectTo: 'connexion',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'user',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/sidebar/sidebar.component').then(
        (m) => m.SidebarComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/user/pages/home/home').then((m) => m.Home),
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./features/user/pages/profil/profil').then(
            (m) => m.MonProfil
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
    path: 'historique',
    loadComponent: () =>
      import('./features/user/pages/historique/historique').then(m => m.Historique)
      },
      {
        path: 'competence-upgrade',
        loadComponent: () =>
          import('./features/user/pages/competence-upgrade/competence-upgrade').then(
            (m) => m.CompetenceUpgrade
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
        path: 'cover-letter',
        loadComponent: () =>
          import('./features/user/pages/cover-letter/cover-letter').then(
            (m) => m.CoverLetter
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
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard').then(
        (m) => m.Dashboard
      ),
  },
  {
    path: 'admin/templates/nouveau',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/template-editor/template-editor').then(
        (m) => m.TemplateEditor
      ),
  },
  {
    path: 'admin/templates/:id/edit',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/template-editor/template-editor').then(
        (m) => m.TemplateEditor
      ),
  },
  {
    path: '**',
    redirectTo: 'auth',
  },
];