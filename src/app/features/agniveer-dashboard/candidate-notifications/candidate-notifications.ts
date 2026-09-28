// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';
// import { NotificationService } from '../../../core/services/notification';
// import { JobApplicationService } from '../../../core/services/job-application';
// import { EntityService } from '../../../core/services/entity';
// import { NotificationFromAPI } from '../../../core/models/notification.model';
// import { Entity } from '../../../core/models/entity.model';
// import { NotificationViewModalComponent } from '../../../shared/components/whatsnew/notifications/notification-modal/notification-modal';

// @Component({
//   selector: 'app-candidate-notifications',
//   standalone: true,
//   imports: [CommonModule, RouterLink, NotificationViewModalComponent],
//   templateUrl: './candidate-notifications.html',
//   styleUrl: './candidate-notifications.css',
// })
// export class CandidateNotificationsComponent implements OnInit {
//   private readonly notifService = inject(NotificationService);
//   private readonly jobAppService = inject(JobApplicationService);
//   private readonly entityService = inject(EntityService);

//   readonly notifications = signal<NotificationFromAPI[]>([]);
//   readonly entities = signal<Entity[]>([]);
//   readonly appliedNotificationIds = signal<Set<string>>(new Set());
//   readonly loading = signal<boolean>(true);
//   readonly selectedViewId = signal<string | null>(null);

//   ngOnInit(): void {
//     this.loadData();
//   }

//   loadData(): void {
//     this.loading.set(true);

//     this.entityService.getAllEntities().subscribe({
//       next: (ents) => this.entities.set(ents),
//     });

//     this.jobAppService.getMyJobApplications().subscribe({
//       next: (res) => {
//         const ids = new Set<string>();
//         res.applications?.forEach((app) => {
//           const nId = typeof app.notification_id === 'string' ? app.notification_id : app.notification_id?._id;
//           if (nId) ids.add(nId);
//         });
//         this.appliedNotificationIds.set(ids);
//       },
//     });

//     this.notifService.getAllNotifications().subscribe({
//       next: (res) => {
//         this.notifications.set(res);
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false),
//     });
//   }

//   getEntityName(entityId: any): string {
//     if (!entityId) return 'Ministry of Home Affairs';
//     const id = typeof entityId === 'string' ? entityId : entityId?._id;
//     return this.entities().find((e) => e._id === id)?.entity_name || 'Ministry of Home Affairs';
//   }

//   formatDate(dateStr?: string): string {
//     if (!dateStr) return '—';
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   }
// }
