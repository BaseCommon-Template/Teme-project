import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth-guard';

export const routes: Routes = [
  // ── Landing Page ────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.LandingComponent),
    pathMatch: 'full',
  },

  // ── Auth & Login Routes ───────────────────────────────────────────
  {
    path: 'auth/userlogin',
    loadComponent: () =>
      import('./pages/auth/user-login/user-login').then((m) => m.UserLoginComponent),
  },
  { path: 'auth/user-login', redirectTo: 'auth/userlogin', pathMatch: 'full' },
  { path: 'login', redirectTo: 'auth/userlogin', pathMatch: 'full' },
  { path: 'auth/login', redirectTo: 'auth/userlogin', pathMatch: 'full' },

  // ── Dashboard Routes ──────────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard/dashboard-table',
    loadComponent: () =>
      import('./components/dashboard/dashboard-table/dashboard-table').then(
        (m) => m.DashboardTable,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard/agniveers',
    loadComponent: () =>
      import('./components/dashboard/agniveer-table/agniveer-table').then((m) => m.AgniveerTable),
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard/notifications',
    loadComponent: () =>
      import('./components/notifications/notifications').then((m) => m.Notifications),
    canActivate: [AuthGuard],
  },

  // ── Fallback Route ────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
