import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../../core/services/feedback';
import { FeedbackFormData } from '../../../core/models/feedback.model';

@Component({
  selector: 'app-candidate-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidate-feedback.html',
  styleUrl: './candidate-feedback.css',
})
export class CandidateFeedbackComponent {
  private readonly feedbackService = inject(FeedbackService);

  readonly rating = signal<number>(5);
  readonly submitting = signal<boolean>(false);
  readonly submittedSuccess = signal<boolean>(false);

  subject = 'Portal Usability';
  comments = '';

  onSubmitFeedback(): void {
    if (!this.comments.trim()) return;

    this.submitting.set(true);

    const payload: FeedbackFormData = {
      rating: this.rating(),
      subject: this.subject,
      comments: this.comments,
      message: this.comments,
    };

    this.feedbackService.createFeedback(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submittedSuccess.set(true);
        this.comments = '';
      },
      error: () => {
        this.submitting.set(false);
        this.submittedSuccess.set(true);
      },
    });
  }
}
