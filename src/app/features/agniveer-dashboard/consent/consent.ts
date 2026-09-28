// import { Component, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { AgniveerService } from '../../../core/services/agniveer';

// @Component({
//   selector: 'app-consent',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './consent.html',
//   styleUrl: './consent.css',
// })
// export class ConsentComponent {
//   private readonly agniveerService = inject(AgniveerService);

//   readonly checked = signal<boolean>(false);
//   readonly showDialog = signal<boolean>(false);
//   readonly submitted = signal<boolean>(false);
//   readonly submitting = signal<boolean>(false);

//   onConfirmSubmit(): void {
//     this.showDialog.set(false);
//     this.submitting.set(true);

//     const profileId = typeof window !== 'undefined' ? localStorage.getItem('agniveer_profile_id') : '0';
//     this.agniveerService.updateConsent(profileId || '0', '0', this.checked()).subscribe({
//       next: () => {
//         this.submitting.set(false);
//         this.submitted.set(true);
//       },
//       error: () => {
//         this.submitting.set(false);
//         this.submitted.set(true);
//       },
//     });
//   }
// }
