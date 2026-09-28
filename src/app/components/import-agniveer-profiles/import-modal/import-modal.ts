import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { AgniveerUploadService } from '../../../services/agniveer-upload/agniveer-upload';
import { ImportService } from '../../../services/import/import';
import { AgniveerForceType } from '../../../services/interfaces/import.model';
import { CryptoHelper } from '../../../helpers/crypto-helper';

export interface UploadCompletionData {
  file: File;
  branch: string;
  pass: number;
  fail: number;
  skip: number;
  rawResponse?: any;
}

@Component({
  selector: 'app-import-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import-modal.html',
  styleUrl: './import-modal.css',
})
export class ImportProfileModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() uploadSuccess = new EventEmitter<UploadCompletionData>();

  private readonly agniveerUploadService = inject(AgniveerUploadService);
  private readonly importService: ImportService = inject(ImportService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly forceTypes = signal<AgniveerForceType[]>([]);
  readonly loadingForceTypes = signal<boolean>(false);
  selectedForceTypeId: number = 0;
  selectedBranch: string = '';

  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal<boolean>(false);
  readonly isUploading = signal<boolean>(false);
  readonly uploadProgress = signal<number>(0);
  readonly uploadError = signal<string | null>(null);
  readonly uploadResult = signal<{ inserted: number; updated: number; failed: number } | null>(
    null,
  );

  ngOnInit(): void {
    this.loadForceTypes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue && this.forceTypes().length === 0) {
      this.loadForceTypes();
    }
  }

  loadForceTypes(): void {
    this.loadingForceTypes.set(true);

    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.importService.getAllForceTypesAPI(encryptedPayload).subscribe({
      next: (res: any) => {
        // console.log(res, 'res');
        if (res.code === 1) {
          let record = JSON.parse(CryptoHelper.decrypt(res.data));

          const records = record?.records || [];
          this.forceTypes.set(records);

          // if (records.length > 0) {
          //   this.selectedForceTypeId = records[0].agniveer_force_autoid;
          //   this.selectedBranch = records[0].agniveer_force_type;
          // }

          this.loadingForceTypes.set(false);
          this.cdr.markForCheck();
        } else if (!res.code) {
          Swal.fire({
            icon: 'error',
            title: res?.message,
            // text: res?.message || 'Something went wrong while saving the schedule.',
            confirmButtonColor: '#1c52a3',
          });
        }
      },
      error: (err: any) => {
        console.error('Error fetching force types from API:', err);
        this.forceTypes.set([]);
        this.loadingForceTypes.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  onForceTypeChange(newId: any): void {
    const id = Number(newId);
    this.selectedForceTypeId = id;
    const found = this.forceTypes().find((f) => f.agniveer_force_autoid === id);
    if (found) {
      this.selectedBranch = found.agniveer_force_type;
    }
  }

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
    if (!file.name.toLowerCase().endsWith('.xml')) {
      this.uploadError.set('Please select a valid .XML file conforming to Agniveer Schema.');
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
      this.uploadError.set('Please choose an XML file to upload.');
      return;
    }

    if (!this.selectedForceTypeId || !this.selectedBranch) {
      this.uploadError.set('Please select an Armed Force Branch.');
      return;
    }

    this.isUploading.set(true);
    this.uploadError.set(null);
    this.uploadProgress.set(20);

    // Encrypt payload containing forceTypeId: agniveer_force_autoid
    const forcePayload = {
      forceTypeId: this.selectedForceTypeId,
      forcTypeId: this.selectedForceTypeId,
      agniveer_force_autoid: this.selectedForceTypeId,
      branch: this.selectedBranch,
    };
    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(forcePayload));

    // Call dedicated AgniveerUploadService with live progress reporting
    this.agniveerUploadService
      .uploadXmlWithProgress(file, this.selectedBranch, this.selectedForceTypeId, encryptedPayload)
      .subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            if (event.total) {
              const percent = Math.round((90 * event.loaded) / event.total);
              this.uploadProgress.set(Math.max(20, Math.min(90, percent)));
            }
          } else if (event.type === HttpEventType.Response || event instanceof HttpResponse) {
            let body = event.body || {};

            // Decrypt response if backend sends encrypted data
            if (body.data && typeof body.data === 'string') {
              try {
                const decrypted = CryptoHelper.decrypt(body.data);
                const parsed = JSON.parse(decrypted);
                body = { ...body, ...parsed };
              } catch (e) {
                // Keep body as-is
              }
            }

            this.uploadProgress.set(100);
            this.isUploading.set(false);

            const inserted =
              body.summary?.inserted ??
              body.data?.inserted ??
              body.inserted ??
              body.passCount ??
              body.successCount ??
              0;
            const updated = body.summary?.updated ?? body.data?.updated ?? body.updated ?? 0;
            const failed =
              body.summary?.failed?.length ?? (typeof body.failed === 'number' ? body.failed : 0);
            const skip = body.summary?.skipped ?? body.skipped ?? 0;

            this.uploadResult.set({ inserted, updated, failed });

            Swal.fire({
              icon: 'success',
              title: 'XML Batch Ingested Successfully',
              text: body.message || `Processed ${inserted + updated} profiles successfully.`,
              confirmButtonColor: '#2563eb',
              timer: 2500,
            });

            this.uploadSuccess.emit({
              file,
              branch: this.selectedBranch,
              pass: inserted + updated,
              fail: failed,
              skip,
              rawResponse: body,
            });
          }
        },
        error: (err) => {
          this.isUploading.set(false);
          this.uploadProgress.set(0);
          const errMsg =
            err?.error?.message ||
            err?.error?.error ||
            err?.message ||
            'Failed to upload XML batch. Please verify file structure and try again.';

          this.uploadError.set(errMsg);

          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: errMsg,
            confirmButtonColor: '#d33',
          });
        },
      });
  }

}
