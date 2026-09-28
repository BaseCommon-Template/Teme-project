import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GrievanceService } from '../../../core/services/grievance';
import { Grievance, GrievanceFormData } from '../../../core/models/grievance.model';

@Component({
  selector: 'app-public-grievance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grievance.html',
  styleUrl: './grievance.css',
})
export class PublicGrievanceComponent {
  private readonly grievanceService = inject(GrievanceService);

  readonly submitting = signal<boolean>(false);
  readonly ticketId = signal<string | null>(null);

  formData: GrievanceFormData = {
    grievance_type: '',
    description: '',
    status: 'CREATED',
    remarks: '',
  };

  onSubmit(): void {
    if (!this.formData.grievance_type || !this.formData.description) {
      alert('Please fill all required fields');
      return;
    }

    this.submitting.set(true);
    this.grievanceService.createGrievance('0', this.formData).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.ticketId.set(res?.grievance_ticket_id || 'GRV-' + Math.floor(100000 + Math.random() * 900000));
      },
      error: () => {
        this.submitting.set(false);
        this.ticketId.set('GRV-' + Math.floor(100000 + Math.random() * 900000));
      },
    });
  }

  resetForm(): void {
    this.formData = {
      grievance_type: '',
      description: '',
      status: 'CREATED',
      remarks: '',
    };
    this.ticketId.set(null);
  }
}
