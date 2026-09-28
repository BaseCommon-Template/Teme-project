// import { Component, OnInit, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, RouterLink } from '@angular/router';
// // import { AgniveerService } from '../../../services/agniveer.service';
// import { AgniveerProfile } from '../../../services/interfaces/agniveer.model';

// @Component({
//   selector: 'app-agniveer-details',
//   standalone: true,
//   imports: [CommonModule, RouterLink],
//   templateUrl: './agniveer-details.html',
//   styleUrl: './agniveer-details.css',
// })
// export class AgniveerDetailsComponent implements OnInit {
//   private readonly route = inject(ActivatedRoute);
//   // private readonly agniveerService = inject(AgniveerService);

//   readonly profile = signal<AgniveerProfile | null>(null);
//   readonly loading = signal<boolean>(true);
//   readonly error = signal<string | null>(null);

//   // ngOnInit(): void {
//   //   const id = this.route.snapshot.params['id'] || this.route.snapshot.queryParams['id'];
//   //   if (id) {
//   //     this.loadProfile(id);
//   //   } else {
//   //     this.loading.set(false);
//   //   }
//   // }

//   // loadProfile(id: string): void {
//   //   this.loading.set(true);
//   //   this.agniveerService.getAgniveerProfileByIdOpen(id).subscribe({
//   //     next: (res) => {
//   //       this.profile.set(res);
//   //       this.loading.set(false);
//   //     },
//   //     error: (err) => {
//   //       this.error.set(err.message || 'Failed to load profile');
//   //       this.loading.set(false);
//   //     },
//   //   });
//   // }

//   getInitials(name?: string): string {
//     if (!name) return 'A';
//     const parts = name.trim().split(' ');
//     if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//     return name.slice(0, 2).toUpperCase();
//   }

//   formatDate(dateStr?: string | null): string {
//     if (!dateStr) return '—';
//     return new Date(dateStr).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric',
//     });
//   }
// }
