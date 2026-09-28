// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// // import { AgniveerService } from '../../../services/agniveer.service';
// import { MenuService } from '../../../core/services/menu';
// import { AgniveerProfileApproval } from '../../../services/interfaces/agniveer.model';
// import { ApprovalDetailModalComponent } from '../../../shared/components/modals/approval-detail-modal';

// @Component({
//   selector: 'app-approvals',
//   standalone: true,
//   imports: [CommonModule, FormsModule, ApprovalDetailModalComponent],
//   templateUrl: './approvals.html',
//   styleUrl: './approvals.css',
// })
// export class ApprovalsComponent implements OnInit {
//   // private readonly agniveerService = inject(AgniveerService);
//   private readonly menuService = inject(MenuService);

//   readonly approvals = signal<AgniveerProfileApproval[]>([]);
//   readonly loading = signal<boolean>(true);
//   readonly statusFilter = signal<'Pending' | 'Approved' | 'Rejected'>('Pending');
//   readonly isModalOpen = signal<boolean>(false);
//   readonly selectedApproval = signal<AgniveerProfileApproval | null>(null);

//   searchQuery = '';

//   ngOnInit(): void {
//     this.loadApprovals();
//   }

//   // loadApprovals(): void {
//   //   this.loading.set(true);
//   //   this.agniveerService
//   //     .getAgniveerProfileApprovals('0', { status: this.statusFilter() })
//   //     .subscribe({
//   //       next: (res) => {
//   //         this.approvals.set(res?.approvals || (Array.isArray(res) ? res : []));
//   //         this.loading.set(false);
//   //       },
//   //       error: () => this.loading.set(false),
//   //     });
//   // }

//   // setStatusFilter(status: 'Pending' | 'Approved' | 'Rejected'): void {
//   //   this.statusFilter.set(status);
//   //   this.loadApprovals();
//   // }

//   filteredApprovals(): AgniveerProfileApproval[] {
//     const q = this.searchQuery.toLowerCase().trim();
//     if (!q) return this.approvals();
//     return this.approvals().filter((a) => {
//       const name = (a.candidate_name || '').toLowerCase();
//       const sNum = (a.service_number || a.agniveer_profile_id || '').toLowerCase();
//       return name.includes(q) || sNum.includes(q);
//     });
//   }

//   formatDate(dateStr?: string): string {
//     if (!dateStr) return '—';
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   }

//   openDetailModal(item: AgniveerProfileApproval): void {
//     this.selectedApproval.set(item);
//     this.isModalOpen.set(true);
//   }
// }
