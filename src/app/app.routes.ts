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
    path: 'agnipath',
    loadComponent: () =>
      import('./features/public-pages/agnipath/agnipath').then((m) => m.AgnipathComponent),
  },

  // {
  //   path: 'detailed-noti',
  //   loadComponent: () =>
  //     import('./features/public-pages/detailed-noti/detailed-noti').then(
  //       (m) => m.DetailedNotiPageComponent,
  //     ),
  // },
  // {
  //   path: 'agniveer-details/:id',
  //   loadComponent: () =>
  //     import('./features/public-pages/agniveer-details/agniveer-details').then(
  //       (m) => m.AgniveerDetailsComponent,
  //     ),
  // },
  {
    path: 'feedback',
    loadComponent: () =>
      import('./features/public-pages/feedback/feedback').then((m) => m.FeedbackComponent),
  },
  {
    path: 'grievance',
    loadComponent: () =>
      import('./features/public-pages/grievance/grievance').then((m) => m.PublicGrievanceComponent),
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
    path: 'dashboard/dashboard-table',
    loadComponent: () =>
      import('./components/dashboard/dashboard-table/dashboard-table').then(
        (m) => m.DashboardTable,
      ),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },
  // {
  //   path: 'dashboard-agniveer',
  //   loadComponent: () =>
  //     import('./components/dashboard-agniveer/dashboard').then((m) => m.Dashboard),
  //   canActivate: [AuthGuard],
  //   data: { roles: [11] },
  // },
  {
    path: 'dashboard/agniveers',
    loadComponent: () =>
      import('./components/dashboard/agniveer-table/agniveer-table').then((m) => m.AgniveerTable),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },
  // {
  //   path: 'dashboard/organization-types',
  //   loadComponent: () =>
  //     import('./components/dashboard/organization-type-table/organization-type-table').then(
  //       (m) => m.OrganizationTypeTable,
  //     ),
  //   canActivate: [AuthGuard],
  //   // data: { roles: [1, 13] },
  // },

  {
    path: 'import',
    loadComponent: () =>
      import('./components/import-agniveer-profiles/import-agniveer-profiles').then(
        (m) => m.ImportAgniveerProfiles,
      ),
    canActivate: [AuthGuard],
    // data: { roles: [1, 13] },
  },

  {
    path: 'profileUpdate',
    loadComponent: () =>
      import('./components/update-name/update-name').then((m) => m.UpdateNameComponent),
    canActivate: [AuthGuard],
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
    path: 'masters/nationality',
    loadComponent: () => import('./components/nationality/nationality').then((m) => m.Nationality),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },

  {
    path: 'masters/newnotification',
    loadComponent: () =>
      import('./components/newnotification/newnotification').then((m) => m.Newnotification),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'newnotification',
    redirectTo: 'masters/newnotification',
    pathMatch: 'full',
  },
  {
    path: 'masters/new-notification',
    redirectTo: 'masters/newnotification',
    pathMatch: 'full',
  },

  // {
  //   path: 'masters/nationality',
  //   loadComponent: () => import('./components/nationality/nationality').then((m) => m.Nationality),
  //   data: { type: 'nationality' },
  //   canActivate: [AuthGuard],
  // },
  {
    path: 'career-progression/apply',
    loadComponent: () =>
      import('./components/career-progression/career-progression').then((m) => m.CareerProgression),
    canActivate: [AuthGuard],
    data: { roles: [11] },
  },
  {
    path: 'viewprofile',
    loadComponent: () =>
      import('./components/career-progression/my-profile/my-profile').then(
        (m) => m.MyProfileComponent,
      ),
    canActivate: [AuthGuard],
    data: { roles: [11, 13] },
  },
  {
    path: 'viewprofile/:id',
    loadComponent: () =>
      import('./components/career-progression/my-profile/my-profile').then(
        (m) => m.MyProfileComponent,
      ),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },

  {
    path: 'dashboard/notifications',
    loadComponent: () =>
      import('./components/notifications/notifications').then((m) => m.Notifications),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },
  {
    path: 'dashboard/notifications/create',
    loadComponent: () =>
      import('./components/notifications/create-job-notification/create-job-notification').then(
        (m) => m.CreateJobNotificationComponent,
      ),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },
  {
    path: 'notifications/vacancy',
    loadComponent: () =>
      import('./components/notifications/vacancyes/vacancyes').then((m) => m.Vacancyes),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },
  {
    path: 'notifications/view',
    loadComponent: () =>
      import('./components/notifications/view-notification-details/view-notification-details').then(
        (m) => m.ViewNotificationDetails,
      ),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },
  {
    path: 'notifications/details',
    loadComponent: () =>
      import('./components/notifications/view-notification-details/view-notification-details').then(
        (m) => m.ViewNotificationDetails,
      ),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },

  {
    path: 'notifications/:id/vacancy',
    loadComponent: () =>
      import('./components/notifications/vacancyes/vacancyes').then((m) => m.Vacancyes),
    canActivate: [AuthGuard],
    data: { roles: [13] },
  },

  {
    path: 'masters/religion',
    loadComponent: () => import('./components/religion/religion').then((m) => m.Religion),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },

  {
    path: 'masters/organization',
    loadComponent: () =>
      import('./components/organization/organization').then((m) => m.Organization),
    // data: { type: 'nationality', roles: [1, 12, 13] },
    canActivate: [AuthGuard],
  },

  {
    path: 'masters/organizationtype',
    loadComponent: () =>
      import('./components/organization-type/organization-type').then((m) => m.OrganizationType),
    // data: { type: 'organizationtype', roles: [1] },
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
    path: 'masters/categories',
    loadComponent: () => import('./components/categories/categories').then((m) => m.Categories),
    // data: { type: 'categories', roles: [1] },
    canActivate: [AuthGuard],
  },

  {
    path: 'masters/postmapping',
    loadComponent: () => import('./components/postmapping/postmapping').then((m) => m.Postmapping),
    // data: { type: 'postmapping', roles: [1, 12, 13] },
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/postmaster',
    loadComponent: () => import('./components/postmaster/postmaster').then((m) => m.Postmaster),
    // data: { type: 'postmaster', roles: [1] },
    canActivate: [AuthGuard],
  },

  {
    path: 'postmaster',
    loadComponent: () => import('./components/postmaster/postmaster').then((m) => m.Postmaster),
    data: { type: 'postmaster' },
    canActivate: [AuthGuard],
  },

  {
    path: 'masters/agniveerpostmaster',
    loadComponent: () =>
      import('./components/agniveerpostmaster/agniveerpostmaster').then(
        (m) => m.AgniveerPostMaster,
      ),
    // data: { type: 'agniveerpostmaster', roles: [1] },
    canActivate: [AuthGuard],
  },
  {
    path: 'agniveerpostmaster',
    redirectTo: 'masters/agniveerpostmaster',
    pathMatch: 'full',
  },
  {
    path: 'agniveer-post-master',
    redirectTo: 'masters/agniveerpostmaster',
    pathMatch: 'full',
  },
  {
    path: 'masters/agniveer-post-master',
    redirectTo: 'masters/agniveerpostmaster',
    pathMatch: 'full',
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
  {
    path: 'masters/domicilepolicestations',
    loadComponent: () =>
      import('./components/domicile-police-stations/domicile-police-stations').then(
        (m) => m.DomicilePoliceStations,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/domicilepolicestation',
    loadComponent: () =>
      import('./components/domicile-police-stations/domicile-police-stations').then(
        (m) => m.DomicilePoliceStations,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/policestations',
    loadComponent: () =>
      import('./components/domicile-police-stations/domicile-police-stations').then(
        (m) => m.DomicilePoliceStations,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/policestation',
    loadComponent: () =>
      import('./components/domicile-police-stations/domicile-police-stations').then(
        (m) => m.DomicilePoliceStations,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'masters/police-station',
    loadComponent: () =>
      import('./components/domicile-police-stations/domicile-police-stations').then(
        (m) => m.DomicilePoliceStations,
      ),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'masters/schedulemanagement',
    loadComponent: () =>
      import('./components/schedule-management/schedule-management').then(
        (m) => m.ScheduleManagement,
      ),
    canActivate: [AuthGuard],
    // data: { roles: [1] },
  },
  {
    path: 'policestations',
    loadComponent: () =>
      import('./components/domicile-police-stations/domicile-police-stations').then(
        (m) => m.DomicilePoliceStations,
      ),
    canActivate: [AuthGuard],
  },

  // {
  //   path: 'dashboard',
  //   loadComponent: () =>
  //     import('./features/dashboard/dashboard-layout/dashboard-layout').then(
  //       (m) => m.DashboardLayoutComponent,
  //     ),
  //   // canActivate: [authGuard],
  //   children: [
  //     {
  //       path: '',
  //       loadComponent: () =>
  //         import('./features/dashboard/dashboard-home/dashboard-home').then(
  //           (m) => m.DashboardHomeComponent,
  //         ),
  //       pathMatch: 'full',
  //     },
  //     {
  //       path: 'mis',
  //       loadComponent: () => import('./features/dashboard/mis/mis').then((m) => m.MisComponent),
  //     },
  //     {
  //       path: 'entities',
  //       loadComponent: () =>
  //         import('./features/dashboard/entities/entities').then((m) => m.EntitiesComponent),
  //     },
  //     {
  //       path: 'sub-entities',
  //       loadComponent: () =>
  //         import('./features/dashboard/sub-entities/sub-entities').then(
  //           (m) => m.SubEntitiesComponent,
  //         ),
  //     },
  //     {
  //       path: 'officers',
  //       loadComponent: () =>
  //         import('./features/dashboard/users/users').then((m) => m.UsersComponent),
  //     },
  //     { path: 'users', redirectTo: 'officers', pathMatch: 'full' },
  //     {
  //       path: 'roles',
  //       loadComponent: () =>
  //         import('./features/dashboard/roles/roles').then((m) => m.RolesComponent),
  //     },
  //     {
  //       path: 'menus',
  //       loadComponent: () =>
  //         import('./features/dashboard/menus/menus').then((m) => m.MenusComponent),
  //     },
  //     {
  //       path: 'notifications',
  //       loadComponent: () =>
  //         import('./features/dashboard/notifications/notifications').then(
  //           (m) => m.NotificationsComponent,
  //         ),
  //     },
  //     {
  //       path: 'notifications/apply-job/:id',
  //       loadComponent: () =>
  //         import('./features/dashboard/notifications/apply-job/apply-job').then(
  //           (m) => m.ApplyJobComponent,
  //         ),
  //     },
  //     {
  //       path: 'approvals',
  //       loadComponent: () =>
  //         import('./features/dashboard/approvals/approvals').then((m) => m.ApprovalsComponent),
  //     },
  //     {
  //       path: 'query',
  //       loadComponent: () =>
  //         import('./features/dashboard/query/query').then((m) => m.QueryComponent),
  //     },

  //     {
  //       path: 'import-history',
  //       loadComponent: () =>
  //         import('./features/dashboard/import-history/import-history').then(
  //           (m) => m.ImportHistoryComponent,
  //         ),
  //     },
  //     {
  //       path: 'job-applications',
  //       loadComponent: () =>
  //         import('./features/dashboard/job-applications/job-applications').then(
  //           (m) => m.JobApplicationsComponent,
  //         ),
  //     },

  //     // Masters
  //     {
  //       path: 'nationality',
  //       loadComponent: () =>
  //         import('./components/nationality/nationality').then((m) => m.Nationality),
  //     },
  //     {
  //       path: 'masters/nationality',
  //       loadComponent: () =>
  //         import('./components/nationality/nationality').then((m) => m.Nationality),
  //       data: { type: 'nationality' },
  //     },
  //     {
  //       path: 'masters/religion',
  //       loadComponent: () =>
  //         import('./features/dashboard/masters/master-table').then((m) => m.MasterTableComponent),
  //       data: { type: 'religion' },
  //     },
  //     {
  //       path: 'masters/category',
  //       loadComponent: () =>
  //         import('./features/dashboard/masters/master-table').then((m) => m.MasterTableComponent),
  //       data: { type: 'category' },
  //     },
  //     {
  //       path: 'masters/post',
  //       loadComponent: () =>
  //         import('./features/dashboard/masters/master-table').then((m) => m.MasterTableComponent),
  //       data: { type: 'post' },
  //     },
  //     {
  //       path: 'masters/state',
  //       loadComponent: () =>
  //         import('./features/dashboard/masters/master-table').then((m) => m.MasterTableComponent),
  //       data: { type: 'state' },
  //     },
  //     {
  //       path: 'masters/district',
  //       loadComponent: () =>
  //         import('./features/dashboard/masters/master-table').then((m) => m.MasterTableComponent),
  //       data: { type: 'district' },
  //     },
  //     {
  //       path: 'masters/police-station',
  //       loadComponent: () =>
  //         import('./features/dashboard/masters/master-table').then((m) => m.MasterTableComponent),
  //       data: { type: 'police-station' },
  //     },
  //     {
  //       path: 'masters/defence-post',
  //       loadComponent: () =>
  //         import('./features/dashboard/masters/master-table').then((m) => m.MasterTableComponent),
  //       data: { type: 'defence-post' },
  //     },
  //   ],
  // },

  // {
  //   path: 'agniveerdashboard',
  //   loadComponent: () =>
  //     import('./features/agniveer-dashboard/candidate-layout/candidate-layout').then(
  //       (m) => m.CandidateLayoutComponent,
  //     ),
  //   // canActivate: [authGuard],
  //   children: [
  //     {
  //       path: '',
  //       loadComponent: () =>
  //         import('./features/agniveer-dashboard/my-profile/my-profile').then(
  //           (m) => m.MyProfileComponent,
  //         ),
  //       pathMatch: 'full',
  //     },
  //     {
  //       path: 'profile',
  //       loadComponent: () =>
  //         import('./features/agniveer-dashboard/my-profile/my-profile').then(
  //           (m) => m.MyProfileComponent,
  //         ),
  //     },
  //     {
  //       path: 'notifications',
  //       loadComponent: () =>
  //         import('./features/agniveer-dashboard/candidate-notifications/candidate-notifications').then(
  //           (m) => m.CandidateNotificationsComponent,
  //         ),
  //     },
  //     {
  //       path: 'consent',
  //       loadComponent: () =>
  //         import('./features/agniveer-dashboard/consent/consent').then((m) => m.ConsentComponent),
  //     },
  //     {
  //       path: 'grievance',
  //       loadComponent: () =>
  //         import('./features/agniveer-dashboard/candidate-grievance/candidate-grievance').then(
  //           (m) => m.CandidateGrievanceComponent,
  //         ),
  //     },
  //     {
  //       path: 'feedback',
  //       loadComponent: () =>
  //         import('./features/agniveer-dashboard/candidate-feedback/candidate-feedback').then(
  //           (m) => m.CandidateFeedbackComponent,
  //         ),
  //     },
  //   ],
  // },

  // Fallback route
  { path: '**', redirectTo: '' },
];
