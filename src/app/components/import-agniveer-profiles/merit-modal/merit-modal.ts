import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import { AgniveerUploadService } from '../../../services/agniveer-upload/agniveer-upload';
import { CryptoHelper } from '../../../helpers/crypto-helper';

export interface MeritUploadCompletionData {
  file: File;
  pass?: number;
  fail?: number;
  rawResponse?: any;
}

@Component({
  selector: 'app-merit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './merit-modal.html',
  styleUrl: './merit-modal.css',
})
export class MeritModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() uploadSuccess = new EventEmitter<MeritUploadCompletionData>();

  private readonly agniveerUploadService = inject(AgniveerUploadService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal<boolean>(false);
  readonly isUploading = signal<boolean>(false);
  readonly uploadProgress = signal<number>(0);
  readonly uploadError = signal<string | null>(null);
  readonly uploadResult = signal<{
    totalExcelRecords: number;
    matchedRecords: number;
    updatedRecords: number;
    agniveerNotFound: number;
    message?: string;
  } | null>(null);

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  resetForm(): void {
    this.selectedFile.set(null);
    this.uploadError.set(null);
    this.uploadResult.set(null);
    this.isUploading.set(false);
    this.uploadProgress.set(0);
    this.isDragging.set(false);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.handleFileSelected(file);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelected(input.files[0]);
    }
  }

  handleFileSelected(file: File): void {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      this.uploadError.set('Please select an Excel file (.xlsx or .xls) only.');
      this.selectedFile.set(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      this.uploadError.set('File size exceeds the maximum permitted limit of 25MB.');
      this.selectedFile.set(null);
      return;
    }

    this.uploadError.set(null);
    this.selectedFile.set(file);
  }

  startUpload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.uploadError.set('Please select an Excel file to upload.');
      return;
    }

    this.isUploading.set(true);
    this.uploadError.set(null);
    this.uploadProgress.set(20);

    this.agniveerUploadService.uploadMeritExcelWithProgress(file).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const percent = Math.round((90 * event.loaded) / event.total);
            this.uploadProgress.set(Math.max(20, Math.min(90, percent)));
          }
        } else if (event.type === HttpEventType.Response || event instanceof HttpResponse) {
          let body = event.body || {};

          // Decrypt response if backend returns encrypted data
          if (body.data && typeof body.data === 'string') {
            try {
              const decrypted = CryptoHelper.decrypt(body.data);
              const parsed = JSON.parse(decrypted);
              body = { ...body, ...parsed };
            } catch {
              // Keep body as-is
            }
          }

          this.uploadProgress.set(100);
          this.isUploading.set(false);

          if (body.success === false || body.isSuccess === false) {
            const errText = body.message || 'Merit Excel processing failed.';
            this.uploadError.set(errText);
            Swal.fire({
              icon: 'error',
              title: 'Processing Failed',
              text: errText,
              confirmButtonColor: '#355f2d',
            });
            this.cdr.markForCheck();
            return;
          }

          const totalExcelRecords =
            body.totalExcelRecords ??
            body.totalRecords ??
            body.total ??
            0;
          const matchedRecords =
            body.matchedRecords ??
            body.passCount ??
            body.summary?.inserted ??
            0;
          const updatedRecords =
            body.updatedRecords ??
            body.summary?.updated ??
            0;
          const agniveerNotFound =
            body.agniveerNotFound ??
            body.failedCount ??
            body.summary?.failed?.length ??
            0;

          this.uploadResult.set({
            totalExcelRecords,
            matchedRecords,
            updatedRecords,
            agniveerNotFound,
            message: body.message || 'Merit Excel processed successfully.',
          });

          Swal.fire({
            icon: 'success',
            title: 'Merit List Uploaded Successfully',
            text: body.message || 'Merit Excel processed successfully.',
            confirmButtonColor: '#355f2d',
            timer: 3000,
          });

          this.uploadSuccess.emit({
            file,
            pass: matchedRecords + updatedRecords,
            fail: agniveerNotFound,
            rawResponse: body,
          });

          this.cdr.markForCheck();
        }
      },
      error: (err: any) => {
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        console.error('Error uploading Merit List Excel:', err);
        const msg =
          (typeof err?.error === 'string'
            ? err.error
            : err?.error?.message || err?.error?.title) ||
          err?.message ||
          'Failed to upload merit list Excel file. Please try again.';
        this.uploadError.set(msg);

        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: msg,
          confirmButtonColor: '#dc2626',
        });

        this.cdr.markForCheck();
      },
    });
  }

}
