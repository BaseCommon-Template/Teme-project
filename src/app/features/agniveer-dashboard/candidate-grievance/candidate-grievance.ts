import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrievanceService } from '../../../core/services/grievance';
import { Grievance, GrievanceFormData } from '../../../core/models/grievance.model';

@Component({
  selector: 'app-candidate-grievance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidate-grievance.html',
  styleUrl: './candidate-grievance.css',
})
export class CandidateGrievanceComponent implements OnInit {
  private readonly grievanceService = inject(GrievanceService);

  readonly grievances = signal<Grievance[]>([]);
  readonly loading = signal<boolean>(true);
  readonly showCreateModal = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);

  newForm: GrievanceFormData = {
    grievance_type: 'Service Record Discrepancy',
    description: '',
    status: 'CREATED',
    remarks: '',
  };

  ngOnInit(): void {
    this.loadGrievances();
  }

  loadGrievances(): void {
    this.loading.set(true);
    this.grievanceService.getAllGrievances().subscribe({
      next: (g) => {
        this.grievances.set(g);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  onSubmitGrievance(): void {
    if (!this.newForm.description) return;
    this.submitting.set(true);

    this.grievanceService.createGrievance('0', this.newForm).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showCreateModal.set(false);
        this.newForm.description = '';
        this.loadGrievances();
      },
      error: () => {
        this.submitting.set(false);
        this.showCreateModal.set(false);
        this.loadGrievances();
      },
    });
  }
}
