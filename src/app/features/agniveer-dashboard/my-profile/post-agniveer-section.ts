// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { AgniveerService } from '../../../core/services/agniveer';
// import { PostAgniveerProfile, Qualification, Employment, Training, Certification } from '../../../core/models/post-agniveer.model';

// @Component({
//   selector: 'app-post-agniveer-section',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './post-agniveer-section.html',
//   styleUrl: './post-agniveer-section.css',
// })
// export class PostAgniveerSectionComponent implements OnInit {
//   private readonly agniveerService = inject(AgniveerService);

//   readonly profile = signal<PostAgniveerProfile | null>(null);
//   readonly showAddQual = signal<boolean>(false);
//   readonly showAddEmp = signal<boolean>(false);

//   newQual: Qualification = { course: '', board: '', passing_year: 2026, percentage: '' };
//   newEmp: Employment = { company_name: '', designation: '', duration: '' };

//   ngOnInit(): void {
//     this.loadPostProfile();
//   }

//   loadPostProfile(): void {
//     const postProfileId = typeof window !== 'undefined' ? localStorage.getItem('post_agniveer_profile_id') : null;
//     if (postProfileId) {
//       this.agniveerService.getPostAgniveerProfileById(postProfileId).subscribe({
//         next: (p) => this.profile.set(p),
//         error: () => this.setupMockProfile(),
//       });
//     } else {
//       this.setupMockProfile();
//     }
//   }

//   private setupMockProfile(): void {
//     this.profile.set({
//       _id: 'post_01',
//       agniveer_id: 'mock_agniveer_01',
//       qualifications: [
//         { course: 'Diploma in Computer Applications', board: 'NIELIT', passing_year: 2026, percentage: '82%' },
//       ],
//       employments: [],
//       trainings: [],
//       certifications: [
//         { certificate_name: 'PSARA Security Supervisor', issuing_organization: 'National Security Council', issue_date: '2026-01-10' },
//       ],
//     });
//   }

//   saveQualification(): void {
//     if (!this.newQual.course || !this.newQual.board) return;
//     const p = this.profile();
//     if (p) {
//       const updated = { ...p, qualifications: [...(p.qualifications || []), { ...this.newQual }] };
//       this.profile.set(updated);
//       this.showAddQual.set(false);
//       this.newQual = { course: '', board: '', passing_year: 2026, percentage: '' };
//     }
//   }

//   saveEmployment(): void {
//     if (!this.newEmp.company_name || !this.newEmp.designation) return;
//     const p = this.profile();
//     if (p) {
//       const updated = { ...p, employments: [...(p.employments || []), { ...this.newEmp }] };
//       this.profile.set(updated);
//       this.showAddEmp.set(false);
//       this.newEmp = { company_name: '', designation: '', duration: '' };
//     }
//   }
// }
