import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth-guard';

export const routes: Routes = [
  // ── Public Routes ───────────────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.LandingComponent),
    pathMatch: 'full',
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/public-pages/about/about').then((m) => m.AboutComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/public-pages/contact/contact').then((m) => m.ContactComponent),
  },
  { path: 'contact-us', redirectTo: 'contact', pathMatch: 'full' },
  {
    path: 'faq',
    loadComponent: () => import('./features/public-pages/faq/faq').then((m) => m.FaqComponent),
  },
  { path: 'faqs', redirectTo: 'faq', pathMatch: 'full' },
  {
    path: 'terms-conditions',
    loadComponent: () =>
      import('./features/public-pages/terms/terms').then((m) => m.TermsComponent),
  },
  { path: 'terms', redirectTo: 'terms-conditions', pathMatch: 'full' },
  {
    path: 'website-policies',
    loadComponent: () =>
      import('./features/public-pages/policies/policies').then((m) => m.PoliciesComponent),
  },
  { path: 'privacy-policy', redirectTo: 'website-policies', pathMatch: 'full' },
  { path: 'policies', redirectTo: 'website-policies', pathMatch: 'full' },
  {
    path: 'no-access',
    loadComponent: () =>
      import('./features/public-pages/no-access/no-access').then((m) => m.NoAccessComponent),
  },
  {
    path: 'unauthrize',
    loadComponent: () => import('./pages/unauthrize/unauthrize').then((m) => m.UnauthrizeComponent),
  },

  // ── Auth Routes ─────────────────────────────────────────────────

  {
    path: 'auth/userlogin',
    loadComponent: () =>
      import('./pages/auth/user-login/user-login').then((m) => m.UserLoginComponent),
  },
  { path: 'auth/user-login', redirectTo: 'auth/userlogin', pathMatch: 'full' },
  { path: 'login', redirectTo: 'auth/userlogin', pathMatch: 'full' },
  { path: 'auth/login', redirectTo: 'auth/userlogin', pathMatch: 'full' },
  {
    path: 'auth/auth-callback',
    loadComponent: () =>
      import('./pages/auth/auth-callback/auth-callback').then((m) => m.AuthCallbackComponent),
  },

  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [AuthGuard],
    // data: { roles: [1, 13] },
  },

  {
    path: 'masters/update-website-status',
    loadComponent: () =>
      import('./components/update-website-status/update-website-status').then(
        (m) => m.UpdateWebsiteStatusComponent,
      ),
    canActivate: [AuthGuard],
  },


  {
    path: 'masters/menumanagement',
    loadComponent: () =>
      import('./components/menu-management/menu-management').then((m) => m.MenuManagement),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'masters/rolemanagement',
    loadComponent: () =>
      import('./components/role-management/role-management').then((m) => m.RoleManagement),
    // data: { type: 'rolemanagement', roles: [1] },
    canActivate: [AuthGuard],
  },

  {
    path: 'masters/usersmanagement',
    loadComponent: () =>
      import('./components/usersmanagement/usersmanagement').then((m) => m.Usersmanagement),
    // data: { type: 'usersmanagement', roles: [1] },
    canActivate: [AuthGuard],
  },

  {
    path: 'masters/domicilestates',
    loadComponent: () =>
      import('./components/domicile-states/domicile-states').then((m) => m.DomicileStates),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'masters/domicilestate',
    loadComponent: () =>
      import('./components/domicile-states/domicile-states').then((m) => m.DomicileStates),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'masters/state',
    loadComponent: () =>
      import('./components/domicile-states/domicile-states').then((m) => m.DomicileStates),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'domicilestates',
    loadComponent: () =>
      import('./components/domicile-states/domicile-states').then((m) => m.DomicileStates),
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/domiciledistricts',
    loadComponent: () =>
      import('./components/domicile-districts/domicile-districts').then((m) => m.DomicileDistricts),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'masters/domiciledistrict',
    loadComponent: () =>
      import('./components/domicile-districts/domicile-districts').then((m) => m.DomicileDistricts),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'masters/district',
    loadComponent: () =>
      import('./components/domicile-districts/domicile-districts').then((m) => m.DomicileDistricts),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'domiciledistricts',
    loadComponent: () =>
      import('./components/domicile-districts/domicile-districts').then((m) => m.DomicileDistricts),
    canActivate: [AuthGuard],
  },

  

  { path: '**', redirectTo: '' },
];
