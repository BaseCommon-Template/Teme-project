// import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { AgniveerProfileApproval } from '../../../services/interfaces/agniveer.model';
// // import { AgniveerService } from '../../../services/agniveer.service';

// @Component({
//   selector: 'app-approval-detail-modal',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './approval-detail-modal.html',
//   styleUrl: './approval-detail-modal.css',
// })
// export class ApprovalDetailModalComponent {
//   @Input() isOpen = false;
//   @Input() approval: AgniveerProfileApproval | null = null;
//   @Input() menuId = '0';
//   @Output() close = new EventEmitter<void>();
//   @Output() verified = new EventEmitter<void>();

//   // private readonly agniveerService = inject(AgniveerService);

//   action: 'Approved' | 'Rejected' | null = 'Approved';
//   remarks = '';
//   readonly saving = signal<boolean>(false);
//   readonly apiError = signal<string | null>(null);

//   formatDate(dateStr?: string): string {
//     if (!dateStr) return '—';
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   }

//   // onVerifySubmit(): void {
//   //   if (!this.approval || !this.action || !this.remarks.trim()) {
//   //     return;
//   //   }

//   //   this.saving.set(true);
//   //   this.apiError.set(null);

//   //   this.agniveerService
//   //     .verifyAgniveerProfileApproval(this.approval._id, this.menuId, {
//   //       status: this.action,
//   //       remarks: this.remarks.trim(),
//   //     })
//   //     .subscribe({
//   //       next: () => {
//   //         this.saving.set(false);
//   //         this.verified.emit();
//   //         this.onClose();
//   //       },
//   //       error: (err) => {
//   //         this.saving.set(false);
//   //         this.apiError.set(err?.error?.message || err?.message || 'Verification failed.');
//   //       },
//   //     });
//   // }

//   onBackdropClick(event: MouseEvent): void {
//     if (event.target === event.currentTarget) {
//       this.onClose();
//     }
//   }

//   onClose(): void {
//     this.remarks = '';
//     this.apiError.set(null);
//     this.close.emit();
//   }
// }
