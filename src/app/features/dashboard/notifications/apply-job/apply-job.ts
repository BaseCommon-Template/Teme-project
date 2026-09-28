// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// import { NotificationService } from '../../../../core/services/notification';
// import { JobApplicationService } from '../../../../core/services/job-application';
// import { AgniveerService } from '../../../../core/services/agniveer';
// import { NotificationFromAPI } from '../../../../core/models/notification.model';
// import { AgniveerProfile } from '../../../../core/models/agniveer.model';

// @Component({
//   selector: 'app-apply-job',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterLink],
//   templateUrl: './apply-job.html',
//   styleUrl: './apply-job.css',
// })
// export class ApplyJobComponent implements OnInit {
//   private readonly route = inject(ActivatedRoute);
//   private readonly router = inject(Router);
//   private readonly notifService = inject(NotificationService);
//   private readonly jobAppService = inject(JobApplicationService);
//   private readonly agniveerService = inject(AgniveerService);

//   readonly notification = signal<NotificationFromAPI | null>(null);
//   readonly loading = signal<boolean>(true);
//   readonly submitting = signal<boolean>(false);
//   readonly appliedSuccess = signal<boolean>(false);
//   readonly errorMessage = signal<string | null>(null);

//   selectedPosts: string[] = [];

//   ngOnInit(): void {
//     const notifId = this.route.snapshot.params['id'];
//     if (notifId) {
//       this.notifService.getNotificationById(notifId).subscribe({
//         next: (n) => {
//           this.notification.set(n);
//           this.loading.set(false);
//         },
//         error: (err) => {
//           this.errorMessage.set(err.message || 'Failed to load notification');
//           this.loading.set(false);
//         },
//       });
//     } else {
//       this.loading.set(false);
//     }
//   }

//   isPostSelected(post: string): boolean {
//     return this.selectedPosts.includes(post);
//   }

//   togglePost(post: string): void {
//     const idx = this.selectedPosts.indexOf(post);
//     if (idx >= 0) {
//       this.selectedPosts.splice(idx, 1);
//     } else {
//       this.selectedPosts.push(post);
//     }
//   }

//   onSubmitApplication(): void {
//     const notif = this.notification();
//     if (!notif) return;

//     this.submitting.set(true);
//     this.errorMessage.set(null);

//     const postPrefs = this.selectedPosts.map((p, idx) => ({
//       preference_order: idx + 1,
//       post_name: p,
//     }));

//     const payload = {
//       notification_id: notif._id,
//       post_preferences: postPrefs,
//     };

//     this.jobAppService.createJobApplication('0', payload).subscribe({
//       next: () => {
//         this.submitting.set(false);
//         this.appliedSuccess.set(true);
//       },
//       error: (err) => {
//         this.submitting.set(false);
//         this.errorMessage.set(
//           err?.error?.message || err?.message || 'Failed to submit application.',
//         );
//       },
//     });
//   }
// }
