import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../../core/services/feedback';
import { Feedback, FeedbackFormData } from '../../../core/models/feedback.model';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.html',
  styleUrl: './feedback.css',
})
export class FeedbackComponent {
  private readonly feedbackService = inject(FeedbackService);

  readonly submitting = signal<boolean>(false);
  readonly submitted = signal<boolean>(false);

  formData: FeedbackFormData = {
    name: '',
    email: '',
    phone: '',
    service_id: '',
    message: '',
  };

  onSubmit(): void {
    if (!this.formData.name || !this.formData.email || !this.formData.phone || !this.formData.message) {
      alert('Please fill all required fields');
      return;
    }

    this.submitting.set(true);
    this.feedbackService.createFeedback(this.formData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
    });
  }

  resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      service_id: '',
      message: '',
    };
    this.submitted.set(false);
  }
}
