// import { Component, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';
// import { NotificationFromAPI } from '../../../core/models/notification.model';
// import { GazetteItem } from '../../../core/models/gazette.model';
// import { Entity } from '../../../core/models/entity.model';
// import { NotificationTabComponent } from '../../../shared/components/whatsnew/notifications/notifications';
// import { ArchiveTabComponent } from '../../../shared/components/whatsnew/archive-tab/archive-tab';
// import { GazetteTabComponent } from '../../../shared/components/whatsnew/gazette-tab/gazette-tab';
// import { NotificationViewModalComponent } from '../../../shared/components/whatsnew/notifications/notification-modal/notification-modal';

// @Component({
//   selector: 'app-home-content',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterLink,
//     NotificationTabComponent,
//     ArchiveTabComponent,
//     GazetteTabComponent,
//     NotificationViewModalComponent,
//   ],
//   templateUrl: './home-content.html',
//   styleUrl: './home-content.css',
// })
// export class HomeContentComponent implements OnInit {
//   readonly activeTab = signal<'notification' | 'archive' | 'gazette'>('notification');
//   readonly notifications = signal<NotificationFromAPI[]>([]);
//   readonly gazetteItems = signal<GazetteItem[]>([]);
//   readonly entities = signal<Entity[]>([]);
//   readonly loading = signal<boolean>(false);
//   readonly selectedNotificationId = signal<string | null>(null);

//   readonly gallery = [
//     'mg1.jpeg',
//     'mg2.webp',
//     'mg3.png',
//     'mg4.jpg',
//     'mg5.webp',
//     'mg6.webp',
//   ];

//   ngOnInit(): void {
//     this.loading.set(false);
//   }
// }
