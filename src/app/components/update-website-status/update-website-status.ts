import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { MyProfileService } from '../../services/myprofile/myprofile';
import { CryptoHelper } from '../../helpers/crypto-helper';

@Component({
  selector: 'app-update-website-status',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './update-website-status.html',
  styleUrl: './update-website-status.css',
})
export class UpdateWebsiteStatusComponent {
  private readonly myProfileService = inject(MyProfileService);

  readonly isWebsiteOpen = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  toggleWebsiteStatus(): void {
    this.isWebsiteOpen.update((val) => !val);
  }

  onSubmitStatus(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    this.isSubmitting.set(true);

    const payload = {
      iswebsiteopen: this.isWebsiteOpen(),
    };

    // console.log('[UpdateWebsiteStatusComponent] Submitting payload:', payload);

    this.myProfileService.updateWebsiteStatus(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting.set(false);

        let decryptedData: any = null;
        if (response?.data) {
          try {
            const rawDecrypted = CryptoHelper.decrypt(response.data);
            decryptedData =
              typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
          } catch (e) {
            decryptedData = response.data;
          }
        } else {
          decryptedData = response;
        }

        const statusLabel = this.isWebsiteOpen() ? 'OPEN (Active)' : 'CLOSED (Inactive)';

        Swal.fire({
          icon: 'success',
          title: 'Website Status Updated',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.6;">
              <p><strong>Website Status:</strong> <span style="color: ${this.isWebsiteOpen() ? '#16a34a' : '#dc2626'}; font-weight: bold;">${statusLabel}</span></p>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#355f2d',
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.reload();
          }
        });
      },
      error: (error: any) => {
        this.isSubmitting.set(false);
        console.error('Error updating website status:', error);

        let errMsg = 'Failed to update website status.';
        if (typeof error === 'string') {
          errMsg = error;
        } else if (error?.error?.message) {
          errMsg = error.error.message;
        } else if (error?.message) {
          errMsg = error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: errMsg,
          confirmButtonColor: '#355f2d',
        });
      },
    });
  }
}
