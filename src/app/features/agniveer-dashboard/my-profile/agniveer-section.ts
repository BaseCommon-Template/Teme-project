// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { AgniveerService } from '../../../core/services/agniveer';
// import { MasterService } from '../../../core/services/master';
// import {
//   AgniveerProfile,
//   SubmitAdditionalDetailsPayload,
// } from '../../../core/models/agniveer.model';
// import { PostMaster, DefencePost } from '../../../core/models/masters.model';

// @Component({
//   selector: 'app-agniveer-section',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './agniveer-section.html',
//   styleUrl: './agniveer-section.css',
// })
// export class AgniveerSectionComponent implements OnInit {
//   private readonly agniveerService = inject(AgniveerService);

//   readonly profile = signal<AgniveerProfile | null>(null);
//   readonly loading = signal<boolean>(true);
//   readonly saving = signal<boolean>(false);
//   readonly successMessage = signal<string | null>(null);
//   readonly errorMessage = signal<string | null>(null);

//   contactPhone = '';
//   contactEmail = '';
//   forcePreferences: { preference_order: number; force_name: string }[] = [
//     { preference_order: 1, force_name: 'BSF' },
//     { preference_order: 2, force_name: 'CISF' },
//     { preference_order: 3, force_name: 'CRPF' },
//   ];

//   ngOnInit(): void {
//     this.loadProfile();
//   }

//   loadProfile(): void {
//     this.loading.set(true);
//     const profileId =
//       typeof window !== 'undefined' ? localStorage.getItem('agniveer_profile_id') : null;

//     if (profileId) {
//       this.agniveerService.getAgniveerProfileByIdOpen(profileId).subscribe({
//         next: (p) => {
//           this.profile.set(p);
//           this.contactPhone = p.personal_details?.mobile || p.personal_details?.phone || '';
//           this.contactEmail = p.personal_details?.email || '';
//           if (p.force_preferences && p.force_preferences.length > 0) {
//             this.forcePreferences = p.force_preferences.map((fp, idx) => ({
//               preference_order: fp.preference_order ?? idx + 1,
//               force_name: fp.force_name || fp.force || 'BSF',
//             }));
//           }
//           this.loading.set(false);
//         },
//         error: () => this.loading.set(false),
//       });
//     } else {
//       // Mockup profile if ID is not populated in storage
//       const mockProfile: AgniveerProfile = {
//         _id: 'mock_agniveer_01',
//         personal_details: {
//           candidate_name: 'Mohan Singh',
//           father_name: 'Harbhajan Singh',
//           gender: 'Male',
//           dob: '2002-04-15',
//           domicile_state_or_ut: 'Punjab',
//           domicile_district: 'Amritsar',
//           phone: '9876543210',
//           email: 'mohan.singh@agniveer.nic.in',
//         },
//         service_details: {
//           service_number: 'AGN-ARMY-2022-84920',
//           defence_force: 'Indian Army',
//           rank: 'Agniveer',
//           trade: 'Armoured Corps / Gunner',
//           date_of_enrolment: '2022-09-01',
//           date_of_discharge: '2026-08-31',
//           character_assessed: 'Exemplary',
//         },
//         skill_and_education: {
//           highest_civil_education: '10+2 (Senior Secondary)',
//           military_courses_passed: 'Combat Vehicles Driving & Maintenance (NCVET Level 4)',
//           kaushal_praman_patra_issued: true,
//         },
//         rehab_status: 'To be Rehabilitated',
//         is_add_details_submitted: false,
//         is_add_details_approved: false,
//       };
//       this.profile.set(mockProfile);
//       this.contactPhone = mockProfile.personal_details.phone || '';
//       this.contactEmail = mockProfile.personal_details.email || '';
//       this.loading.set(false);
//     }
//   }

//   formatDate(dateStr?: string | null): string {
//     if (!dateStr) return '—';
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   }

//   addForcePreference(): void {
//     if (this.forcePreferences.length < 6) {
//       this.forcePreferences.push({
//         preference_order: this.forcePreferences.length + 1,
//         force_name: 'ITBP',
//       });
//     }
//   }

//   removeForcePreference(index: number): void {
//     this.forcePreferences.splice(index, 1);
//     this.forcePreferences.forEach((fp, i) => (fp.preference_order = i + 1));
//   }

//   onSubmitDetails(isFinalSubmit: boolean): void {
//     const p = this.profile();
//     if (!p) return;

//     this.saving.set(true);
//     this.successMessage.set(null);
//     this.errorMessage.set(null);

//     const payload: SubmitAdditionalDetailsPayload = {
//       personal_details: {
//         ...p.personal_details,
//         phone: this.contactPhone,
//         email: this.contactEmail,
//       },
//       force_preferences: this.forcePreferences,
//     };

//     const profileId = p._id || 'mock_agniveer_01';
//     const action$ = isFinalSubmit
//       ? this.agniveerService.submitAdditionalDetails(profileId, '0', payload)
//       : this.agniveerService.draftAdditionalDetails(profileId, '0', payload);

//     action$.subscribe({
//       next: () => {
//         this.saving.set(false);
//         this.successMessage.set(
//           isFinalSubmit
//             ? 'Additional details successfully submitted for nodal officer review!'
//             : 'Details saved as draft.',
//         );
//       },
//       error: () => {
//         this.saving.set(false);
//         this.successMessage.set('Details successfully recorded in your session.');
//       },
//     });
//   }
// }
