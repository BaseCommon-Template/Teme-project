// import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { NotificationService } from '../../../../../core/services/notification';
// import { EntityService } from '../../../../../core/services/entity';
// import { SubEntityService } from '../../../../../core/services/sub-entity';
// import { NotificationFromAPI } from '../../../../../core/models/notification.model';
// import { Entity } from '../../../../../core/models/entity.model';
// import { SubEntityFromAPI } from '../../../../../core/models/sub-entity.model';

// @Component({
//   selector: 'app-notification-view-modal',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './notification-modal.html',
//   styleUrl: './notification-modal.css',
// })
// export class NotificationViewModalComponent implements OnChanges {
//   @Input() notificationId: string | null = null;
//   @Output() close = new EventEmitter<void>();

//   private readonly notifService = inject(NotificationService);
//   private readonly entityService = inject(EntityService);
//   private readonly subEntityService = inject(SubEntityService);

//   readonly notification = signal<NotificationFromAPI | null>(null);
//   readonly entities = signal<Entity[]>([]);
//   readonly subEntities = signal<SubEntityFromAPI[]>([]);
//   readonly loading = signal<boolean>(false);
//   readonly error = signal<string | null>(null);

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['notificationId'] && this.notificationId) {
//       this.loadDetails();
//     }
//   }

//   private loadDetails(): void {
//     if (!this.notificationId) return;
//     this.loading.set(true);
//     this.error.set(null);

//     this.notifService.getNotificationById(this.notificationId).subscribe({
//       next: (notif) => {
//         this.notification.set(notif);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         this.error.set(err.message || 'Failed to load details');
//         this.loading.set(false);
//       },
//     });

//     this.entityService.getAllEntities().subscribe({
//       next: (ents) => this.entities.set(ents),
//     });

//     this.subEntityService.getAllSubEntities().subscribe({
//       next: (subs) => this.subEntities.set(subs),
//     });
//   }

//   getEntityName(): string {
//     const eId = this.notification()?.entity_id;
//     if (!eId) return '—';
//     const found = this.entities().find((e) => e._id === eId || (typeof eId === 'object' && e._id === eId?._id));
//     return found?.entity_name || 'Ministry of Home Affairs';
//   }

//   getSubEntityName(): string {
//     const sId = this.notification()?.sub_entity_id;
//     if (!sId) return '—';
//     const found = this.subEntities().find((s) => s._id === sId || (typeof sId === 'object' && s._id === sId?._id));
//     return found?.sub_entity_name || '—';
//   }

//   formatDate(dateStr?: string): string {
//     if (!dateStr) return '—';
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   }

//   onBackdropClick(event: MouseEvent): void {
//     if (event.target === event.currentTarget) {
//       this.onClose();
//     }
//   }

//   onClose(): void {
//     this.close.emit();
//   }
// }

// export { NotificationViewModalComponent as NotificationModal };
