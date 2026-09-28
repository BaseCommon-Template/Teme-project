// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { RouterLink } from '@angular/router';
// import * as XLSX from 'xlsx';
// import { AgniveerService } from '../../../core/services/agniveer';
// import { FilterService, QueryFilters } from '../../../core/services/filter';
// import { AgniveerProfile } from '../../../core/models/agniveer.model';
// import { QuerySidebarComponent } from '../../../shared/components/sidebar/query-sidebar';

// @Component({
//   selector: 'app-query',
//   standalone: true,
//   imports: [CommonModule, FormsModule, RouterLink, QuerySidebarComponent],
//   templateUrl: './query.html',
//   styleUrl: './query.css',
// })
// export class QueryComponent implements OnInit {
//   private readonly agniveerService = inject(AgniveerService);
//   readonly filterService = inject(FilterService);

//   readonly candidates = signal<AgniveerProfile[]>([]);
//   readonly loading = signal<boolean>(true);
//   searchQuery = '';

//   ngOnInit(): void {
//     this.loadCandidates();
//   }

//   loadCandidates(): void {
//     this.loading.set(true);
//     this.agniveerService.getAllAgniveerProfiles('0', this.filterService.filters()).subscribe({
//       next: (res) => {
//         const data = Array.isArray(res) ? res : res?.profiles || res?.data || [];
//         this.candidates.set(data);
//         this.loading.set(false);
//       },
//       error: () => this.loading.set(false),
//     });
//   }

//   onFilterChange(filters: QueryFilters): void {
//     this.loadCandidates();
//   }

//   onSearchChange(val: string): void {
//     this.searchQuery = val;
//   }

//   filteredCandidates(): AgniveerProfile[] {
//     const q = this.searchQuery.toLowerCase().trim();
//     if (!q) return this.candidates();
//     return this.candidates().filter((c) => {
//       const name = (c.personal_details?.candidate_name || '').toLowerCase();
//       const sNum = (
//         c.service_details?.service_number ||
//         c.service_details?.service_id ||
//         ''
//       ).toLowerCase();
//       const trade = (c.service_details?.trade || '').toLowerCase();
//       return name.includes(q) || sNum.includes(q) || trade.includes(q);
//     });
//   }

//   calcAge(dobStr?: string): number {
//     if (!dobStr) return 0;
//     const dob = new Date(dobStr);
//     const diff = Date.now() - dob.getTime();
//     return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
//   }

//   formatDate(dateStr?: string): string {
//     if (!dateStr) return '—';
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   }

//   exportToExcel(): void {
//     const dataToExport = this.filteredCandidates().map((c, i) => ({
//       'Sr. No.': i + 1,
//       'Candidate Name': c.personal_details?.candidate_name || '',
//       'Service Number': c.service_details?.service_number || c.service_details?.service_id || '',
//       'Defence Force': c.service_details?.defence_force || c.service_details?.branch || '',
//       'Trade / Specialization': c.service_details?.trade || '',
//       Gender: c.personal_details?.gender || '',
//       DOB: c.personal_details?.dob || '',
//       'Domicile State': c.personal_details?.domicile_state_or_ut || c.personal_details?.state || '',
//       'Domicile District': c.personal_details?.domicile_district || '',
//       'Rehabilitation Status': c.rehab_status || 'Available',
//     }));

//     const ws = XLSX.utils.json_to_sheet(dataToExport);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
//     XLSX.writeFile(
//       wb,
//       'Agniveer_Candidate_Pool_' + new Date().toISOString().split('T')[0] + '.xlsx',
//     );
//   }
// }
