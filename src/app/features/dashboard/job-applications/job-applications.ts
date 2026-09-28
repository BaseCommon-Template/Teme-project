import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobApplicationService } from '../../../core/services/job-application';
import { JobApplication, JobApplicationStatus } from '../../../core/models/job-application.model';

@Component({
  selector: 'app-job-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-applications.html',
  styleUrl: './job-applications.css',
})
export class JobApplicationsComponent implements OnInit {
  private readonly jobAppService = inject(JobApplicationService);

  readonly applications = signal<JobApplication[]>([]);
  readonly loading = signal<boolean>(true);

  searchQuery = '';
  statusFilter = '';

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.statusFilter) params.application_status = this.statusFilter;

    this.jobAppService.getAllJobApplications(params).subscribe({
      next: (res) => {
        this.applications.set(res.applications || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredApplications(): JobApplication[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.applications();
    return this.applications().filter((a) => {
      const name = this.getCandidateName(a).toLowerCase();
      const sNum = this.getCandidateServiceId(a).toLowerCase();
      return name.includes(q) || sNum.includes(q);
    });
  }

  getCandidateName(app: JobApplication): string {
    return app.agniveer_snapshot?.personal_details?.candidate_name || 'Agniveer Candidate';
  }

  getCandidateServiceId(app: JobApplication): string {
    return app.agniveer_snapshot?.service_details?.service_number || (typeof app.agniveer_id === 'string' ? app.agniveer_id : app.agniveer_id?._id || '—');
  }

  getNotificationTitle(app: JobApplication): string {
    return app.notification_snapshot?.notification_title || (typeof app.notification_id === 'string' ? app.notification_id : app.notification_id?.notification_title || 'Vacancy Opening');
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  onStatusChange(id: string, newStatus: JobApplicationStatus): void {
    this.jobAppService.updateJobApplicationStatus(id, '0', { application_status: newStatus }).subscribe({
      next: () => this.loadApplications(),
    });
  }
}
