import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { MyProfileService } from '../../services/myprofile/myprofile';
import { PublicMenuService } from '../../services/public-menu';
import { CryptoHelper } from '../../helpers/crypto-helper';

@Component({
  selector: 'app-update-website-status',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './update-website-status.html',
  styleUrl: './update-website-status.css',
})
export class UpdateWebsiteStatusComponent implements OnInit {
  private readonly myProfileService = inject(MyProfileService);
  private readonly publicMenuService = inject(PublicMenuService);

  readonly isWebsiteOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  toggleWebsiteStatus(): void {
    this.isWebsiteOpen.update((val) => !val);
  }

  ngOnInit(): void {
    this.getWebsiteStatus();
  }

  private getWebsiteStatus(): void {
    this.publicMenuService.checkWebsiteAccess().subscribe({
      next: (response: any) => {
        const status = response?.data?.iswebsiteopen;

        const isOpen =
          status === true ||
          status === 1 ||
          status === '1' ||
          String(status).toLowerCase() === 'true';

        this.isWebsiteOpen.set(isOpen);
      },

      error: (error: any) => {
        console.error('❌ Failed to get website status:', error);
      },
    });
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
            // console.log('[UpdateWebsiteStatusComponent] Decrypted response data:', decryptedData);
            const savedStatus =
              decryptedData?.iswebsiteopen === true ||
              decryptedData?.iswebsiteopen === 1 ||
              decryptedData?.iswebsiteopen === '1' ||
              String(decryptedData?.iswebsiteopen).toLowerCase() === 'true';

            this.isWebsiteOpen.set(savedStatus);
          } catch (e) {
            decryptedData = response.data;
          }
        } else {
          decryptedData = response;
          const savedStatus =
            decryptedData?.iswebsiteopen === true ||
            decryptedData?.iswebsiteopen === 1 ||
            decryptedData?.iswebsiteopen === '1' ||
            String(decryptedData?.iswebsiteopen).toLowerCase() === 'true';

          this.isWebsiteOpen.set(savedStatus);
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
          confirmButtonColor: '#1C4587',
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
          confirmButtonColor: '#1C4587',
        });
      },
    });
  }
}
