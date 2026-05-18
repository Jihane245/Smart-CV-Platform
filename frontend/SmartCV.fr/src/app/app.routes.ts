import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { roleRedirectGuard } from './core/guards/role-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [roleRedirectGuard],
    loadComponent: () =>
      import('./features/user/pages/home/home').then(m => m.Home),
  },
  {
    path: 'user',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/sidebar/sidebar.component').then(m => m.SidebarComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/user/pages/home/home').then(m => m.Home),
      },
      {
        path: 'profil',
        loadComponent: () => import('./features/user/pages/profil/profil').then(m => m.MonProfil),
      },
      {
        path: 'generate-cv',
        loadComponent: () =>
          import('./features/user/pages/generate-cv/generate-cv').then(m => m.GenerateCv),
      },
      {
        path: 'historique',
        loadComponent: () =>
          import('./features/user/pages/historique/historique').then(m => m.Historique),
      },
      {
        path: 'lettre-motivation',
        loadComponent: () =>
          import('./features/user/pages/lettre-motivation/lettre-motivation').then(m => m.LettreMotivation),
      },
      {
        path: 'competence-upgrade',
        loadComponent: () =>
          import('./features/user/pages/competence-upgrade/competence-upgrade').then(m => m.CompetenceUpgrade),
      },
      {
        path: 'roadmap-historique',
        loadComponent: () =>
          import('./features/user/pages/roadmap-historique/roadmap-historique').then(m => m.RoadmapHistorique),
      },
      {
        path: 'applications',
        loadComponent: () =>
          import('./features/user/pages/applications/applications').then(m => m.Applications),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/user/pages/settings/settings').then(m => m.Settings),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard),
  },
  {
    path: 'admin/utilisateurs',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/admin/users-list/users-list').then(m => m.UsersList),
  },
  {
    path: 'admin/templates/nouveau',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/template-editor/template-editor').then(m => m.TemplateEditor),
  },
  {
    path: 'admin/templates/:id/edit',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/template-editor/template-editor').then(m => m.TemplateEditor),
  },
  { path: '**', redirectTo: 'user' },
];