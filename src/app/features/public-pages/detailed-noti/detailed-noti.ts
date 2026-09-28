// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterLink } from '@angular/router';
// import { NotificationService } from '../../../core/services/notification';
// import { EntityService } from '../../../core/services/entity';
// import { SubEntityService } from '../../../core/services/sub-entity';
// import { NotificationFromAPI } from '../../../core/models/notification.model';
// import { Entity } from '../../../core/models/entity.model';
// import { SubEntityFromAPI } from '../../../core/models/sub-entity.model';

// @Component({
//   selector: 'app-detailed-noti',
//   standalone: true,
//   imports: [CommonModule, RouterLink],
//   templateUrl: './detailed-noti.html',
//   styleUrl: './detailed-noti.css',
// })
// export class DetailedNotiPageComponent implements OnInit {
//   private readonly route = inject(ActivatedRoute);
//   private readonly notifService = inject(NotificationService);
//   private readonly entityService = inject(EntityService);
//   private readonly subEntityService = inject(SubEntityService);

//   readonly notification = signal<NotificationFromAPI | null>(null);
//   readonly entities = signal<Entity[]>([]);
//   readonly subEntities = signal<SubEntityFromAPI[]>([]);
//   readonly loading = signal<boolean>(true);
//   readonly error = signal<string | null>(null);

//   ngOnInit(): void {
//     this.route.queryParams.subscribe((params) => {
//       const notifId = params['id'] || this.route.snapshot.params['id'];
//       if (notifId) {
//         this.loadDetails(notifId);
//       } else {
//         this.loading.set(false);
//       }
//     });

//     this.entityService.getAllEntities().subscribe({
//       next: (data) => this.entities.set(data),
//     });

//     this.subEntityService.getAllSubEntities().subscribe({
//       next: (data) => this.subEntities.set(data),
//     });
//   }

//   loadDetails(id: string): void {
//     this.loading.set(true);
//     this.notifService.getNotificationById(id).subscribe({
//       next: (data) => {
//         this.notification.set(data);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         this.error.set(err.message || 'Failed to load details');
//         this.loading.set(false);
//       },
//     });
//   }

//   getEntityName(): string {
//     const eId = this.notification()?.entity_id;
//     if (!eId) return 'Ministry of Home Affairs';
//     const id = typeof eId === 'string' ? eId : eId?._id;
//     return this.entities().find((e) => e._id === id)?.entity_name || 'Ministry of Home Affairs';
//   }

//   getSubEntityName(): string {
//     const sId = this.notification()?.sub_entity_id;
//     if (!sId) return '—';
//     const id = typeof sId === 'string' ? sId : sId?._id;
//     return this.subEntities().find((s) => s._id === id)?.sub_entity_name || '—';
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
