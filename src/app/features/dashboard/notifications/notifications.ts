// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterLink } from '@angular/router';
// // import { NotificationService } from '../../../core/services/notification';
// import { EntityService } from '../../../core/services/entity';
// import { SubEntityService } from '../../../core/services/sub-entity';
// import { MenuService } from '../../../core/services/menu';
// import { NotificationFromAPI } from '../../../core/models/notification.model';
// import { Entity } from '../../../core/models/entity.model';
// import { SubEntityFromAPI } from '../../../core/models/sub-entity.model';
// import { NotificationModalComponent } from '../../../shared/components/modals/notification-modal';
// import { NotificationViewModalComponent } from '../../../shared/components/whatsnew/notifications/notification-modal/notification-modal';

// @Component({
//   selector: 'app-notifications',
//   standalone: true,
//   imports: [CommonModule, FormsModule, NotificationModalComponent, NotificationViewModalComponent],
//   templateUrl: './notifications.html',
//   styleUrl: './notifications.css',
// })
// export class NotificationsComponent implements OnInit {
//   // private readonly notifService = inject(NotificationService);
//   private readonly entityService = inject(EntityService);
//   private readonly subEntityService = inject(SubEntityService);
//   private readonly menuService = inject(MenuService);

//   readonly notifications = signal<NotificationFromAPI[]>([]);
//   readonly entities = signal<Entity[]>([]);
//   readonly subEntities = signal<SubEntityFromAPI[]>([]);
//   readonly loading = signal<boolean>(true);
//   readonly isModalOpen = signal<boolean>(false);
//   readonly selectedNotification = signal<NotificationFromAPI | null>(null);
//   readonly selectedViewId = signal<string | null>(null);

//   searchQuery = '';
//   selectedEntityFilter = '';

//   ngOnInit(): void {
//     // this.loadData();
//   }

//   // loadData(): void {
//   //   this.loading.set(true);

//   //   this.entityService.getAllEntities().subscribe({
//   //     next: (ents) => this.entities.set(ents),
//   //   });

//   //   this.subEntityService.getAllSubEntities().subscribe({
//   //     next: (subs) => this.subEntities.set(subs),
//   //   });

//   //   this.notifService.getAllNotifications().subscribe({
//   //     next: (n) => {
//   //       this.notifications.set(n);
//   //       this.loading.set(false);
//   //     },
//   //     error: () => this.loading.set(false),
//   //   });
//   // }

//   filteredNotifications(): NotificationFromAPI[] {
//     const q = this.searchQuery.toLowerCase().trim();
//     return this.notifications().filter((n) => {
//       const matchSearch =
//         !q ||
//         n.notification_title.toLowerCase().includes(q) ||
//         (n.advertisement_number && n.advertisement_number.toLowerCase().includes(q));
//       const entityId = typeof n.entity_id === 'string' ? n.entity_id : (n.entity_id as any)?._id;
//       const matchEntity = !this.selectedEntityFilter || entityId === this.selectedEntityFilter;
//       return matchSearch && matchEntity;
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

//   isOpenDate(closingDate?: string): boolean {
//     if (!closingDate) return true;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const closing = new Date(closingDate);
//     closing.setHours(23, 59, 59, 999);
//     return closing >= today;
//   }

//   canAdd(): boolean {
//     return this.menuService.canAdd('/dashboard/notifications');
//   }

//   canEdit(): boolean {
//     return this.menuService.canEdit('/dashboard/notifications');
//   }

//   canDelete(): boolean {
//     return this.menuService.canDelete('/dashboard/notifications');
//   }

//   openCreateModal(): void {
//     this.selectedNotification.set(null);
//     this.isModalOpen.set(true);
//   }

//   openEditModal(notif: NotificationFromAPI): void {
//     this.selectedNotification.set(notif);
//     this.isModalOpen.set(true);
//   }

//   // onSaveNotification(event: { payload: CreateNotificationPayload; id?: string }): void {
//   //   if (event.id) {
//   //     this.notifService.updateNotification(event.id, event.payload).subscribe({
//   //       next: () => {
//   //         this.isModalOpen.set(false);
//   //         this.loadData();
//   //       },
//   //     });
//   //   } else {
//   //     this.notifService.createNotification('0', event.payload).subscribe({
//   //       next: () => {
//   //         this.isModalOpen.set(false);
//   //         this.loadData();
//   //       },
//   //     });
//   //   }
//   // }

//   // onDelete(id: string): void {
//   //   if (confirm('Are you sure you want to delete this recruitment opening?')) {
//   //     this.notifService.deleteNotification(id).subscribe({
//   //       next: () => this.loadData(),
//   //     });
//   //   }
//   // }
// }
