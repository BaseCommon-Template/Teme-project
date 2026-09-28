// import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { NotificationFromAPI, CreateNotificationPayload } from '../../../core/models/notification.model';
// import { Entity } from '../../../core/models/entity.model';
// import { SubEntityFromAPI } from '../../../core/models/sub-entity.model';
// import { MasterService } from '../../../core/services/master';
// import { PostMaster } from '../../../core/models/masters.model';

// @Component({
//   selector: 'app-notification-modal',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './notification-modal.html',
//   styleUrl: './notification-modal.css',
// })
// export class NotificationModalComponent implements OnInit, OnChanges {
//   @Input() isOpen = false;
//   @Input() editingNotification: NotificationFromAPI | null = null;
//   @Input() entities: Entity[] = [];
//   @Input() subEntities: SubEntityFromAPI[] = [];
//   @Output() close = new EventEmitter<void>();
//   @Output() save = new EventEmitter<{ payload: CreateNotificationPayload; id?: string }>();

//   private readonly masterService = inject(MasterService);

//   readonly allPosts = signal<PostMaster[]>([]);
//   readonly submitting = signal<boolean>(false);
//   readonly error = signal<string | null>(null);

//   formData: CreateNotificationPayload = {
//     advertisement_number: '',
//     date_of_advertisement: '',
//     application_opening_date: '',
//     application_closing_date: '',
//     notification_title: '',
//     description: '',
//     job_link_url: '',
//     entity_id: '',
//     sub_entity_id: '',
//     post_preference: [],
//   };

//   ngOnInit(): void {
//     this.masterService.getPostMasters().subscribe({
//       next: (posts) => this.allPosts.set(posts),
//     });
//   }

//   filteredSubEntities(): SubEntityFromAPI[] {
//     if (!this.formData.entity_id) return this.subEntities;
//     return this.subEntities.filter((s) => s.parent_entity_id === this.formData.entity_id);
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['editingNotification'] || changes['isOpen']) {
//       if (this.editingNotification) {
//         this.formData = {
//           advertisement_number: this.editingNotification.advertisement_number || '',
//           date_of_advertisement: this.editingNotification.date_of_advertisement?.split('T')[0] || '',
//           application_opening_date: this.editingNotification.application_opening_date?.split('T')[0] || '',
//           application_closing_date: this.editingNotification.application_closing_date?.split('T')[0] || '',
//           notification_title: this.editingNotification.notification_title,
//           description: this.editingNotification.description || '',
//           job_link_url: this.editingNotification.job_link_url || '',
//           entity_id: typeof this.editingNotification.entity_id === 'string' ? this.editingNotification.entity_id : (this.editingNotification.entity_id as any)?._id || '',
//           sub_entity_id: typeof this.editingNotification.sub_entity_id === 'string' ? this.editingNotification.sub_entity_id : (this.editingNotification.sub_entity_id as any)?._id || '',
//           post_preference: this.editingNotification.post_preference ? [...this.editingNotification.post_preference] : [],
//         };
//       } else {
//         this.formData = {
//           advertisement_number: '',
//           date_of_advertisement: new Date().toISOString().split('T')[0],
//           application_opening_date: new Date().toISOString().split('T')[0],
//           application_closing_date: '',
//           notification_title: '',
//           description: '',
//           job_link_url: '',
//           entity_id: this.entities[0]?._id || '',
//           sub_entity_id: '',
//           post_preference: [],
//         };
//       }
//       this.error.set(null);
//       this.submitting.set(false);
//     }
//   }

//   isPostSelected(postName: string): boolean {
//     return this.formData.post_preference?.includes(postName) ?? false;
//   }

//   togglePost(postName: string): void {
//     if (!this.formData.post_preference) {
//       this.formData.post_preference = [];
//     }
//     const idx = this.formData.post_preference.indexOf(postName);
//     if (idx >= 0) {
//       this.formData.post_preference.splice(idx, 1);
//     } else {
//       this.formData.post_preference.push(postName);
//     }
//   }

//   onSubmit(): void {
//     if (
//       !this.formData.notification_title ||
//       !this.formData.advertisement_number ||
//       !this.formData.entity_id ||
//       !this.formData.application_opening_date ||
//       !this.formData.application_closing_date
//     ) {
//       this.error.set('Please fill all required opening fields.');
//       return;
//     }

//     this.submitting.set(true);
//     this.save.emit({
//       payload: this.formData,
//       id: this.editingNotification?._id,
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
