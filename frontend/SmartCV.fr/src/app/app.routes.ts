import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'sidebar',
    loadComponent: () =>
      import('./sidebar/sidebar.component').then((m) => m.SidebarComponent),
    canActivate: [authGuard],
    children: [
      // {
      //   path: '',
      //   loadComponent: () =>
      //     import('./sidebar/pages/home/home.component').then((m) => m.HomeComponent),
      // },
      // {
      //   path: 'profile',
      //   loadComponent: () =>
      //     import('./sidebar/pages/profile/profile.component').then((m) => m.ProfileComponent),
      // },
      // {
      //   path: 'generate-cv',
      //   loadComponent: () =>
      //     import('./sidebar/pages/generate-cv/generate-cv.component').then((m) => m.GenerateCvComponent),
      // },
      // {
      //   path: 'applications',
      //   loadComponent: () =>
      //     import('./sidebar/pages/applications/applications.component').then((m) => m.ApplicationsComponent),
      // },
      // {
      //   path: 'settings',
      //   loadComponent: () =>
      //     import('./sidebar/pages/settings/settings.component').then((m) => m.SettingsComponent),
      // },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];