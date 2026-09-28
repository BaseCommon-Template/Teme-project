import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from 'ag-grid-community';
import Swal from 'sweetalert2';
import { NewnotificationService, NewNotificationItem } from '../../core/services/newnotification';
import { AuthService } from '../../services/auth';
import { CryptoHelper } from '../../helpers/crypto-helper';
import { environment } from '../../../environments/environment';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-newnotification',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './newnotification.html',
  styleUrl: './newnotification.css',
})
export class Newnotification implements OnInit, AfterViewInit {
  private gridApi!: GridApi<NewNotificationItem>;

  private readonly newnotificationService = inject(NewnotificationService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  readonly searchText = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<NewNotificationItem | null>(null);
  readonly showActiveOnly = signal<boolean>(true);
  readonly showInactive = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);

  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileName = signal<string>('');
  readonly isUploadingDocument = signal<boolean>(false);

  readonly Math = Math;

  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;
  totalPages = 0;
  submitted = false;

  formData: NewNotificationItem = {
    id: null,
    notification_title: '',
    description: '',
    attachment_path: '',
    created_by: 0,
    is_active: true,
  };

  rowData: NewNotificationItem[] = [];

  colDefs: ColDef<NewNotificationItem>[] = [
    {
      headerName: 'SR. NO.',
      valueGetter: (params) => {
        if (params.node?.rowIndex == null) return '';
        return (this.currentPage - 1) * this.pageSize + params.node.rowIndex + 1;
      },
      width: 100,
      minWidth: 90,
      maxWidth: 100,
      sortable: false,
      filter: false,
      resizable: false,
      cellStyle: {
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#333',
      },
    },
    {
      field: 'notification_title',
      headerName: 'TITLE',
      minWidth: 220,
      flex: 1.5,
      cellRenderer: (params: ICellRendererParams<NewNotificationItem>) => {
        if (!params.data) return '';
        return `
          <span style="font-size:12px; color:#333; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">
            ${params.data.notification_title || '-'}
          </span>
        `;
      },
    },
    {
      field: 'description',
      headerName: 'DESCRIPTION',
      minWidth: 200,
      flex: 2,
      cellRenderer: (params: ICellRendererParams<NewNotificationItem>) => {
        if (!params.data) return '';
        return `
          <span style="font-size:12px; color:#555; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">
            ${params.data.description || '-'}
          </span>
        `;
      },
    },
    {
      field: 'attachment_path',
      headerName: 'ATTACHMENT',
      width: 130,
      minWidth: 110,
      maxWidth: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<NewNotificationItem>) => {
        const path = params.data?.attachment_path;
        if (!path) return '<span style="color:#94a3b8; font-size:12px;">N/A</span>';
        return `
          <div style="display:flex; align-items:center; justify-content:center; height:100%;">
            <button
              type="button"
              data-action="view-attachment"
              data-path="${path}"
              style="background:#162f6a; color:#ffffff; font-size:12px; font-weight:600; padding:3px 16px; border-radius:9999px; border:none; cursor:pointer; transition:background-color 0.2s; display:inline-flex; align-items:center; justify-content:center; line-height:1.2;"
              onmouseover="this.style.backgroundColor='#122452'"
              onmouseout="this.style.backgroundColor='#162f6a'"
            >
              View
            </button>
          </div>
        `;
      },
    },
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 130,
      minWidth: 110,
      maxWidth: 140,
      cellRenderer: (params: ICellRendererParams<NewNotificationItem>) => {
        const isActive = params.value === true;
        return `
          <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:flex-start; padding-left:4px;">
            <span style="display:inline-flex; align-items:center; justify-content:center; gap:6px; min-width:72px; height:24px; padding:0 10px; border-radius:12px; ${isActive
            ? 'background:#ecfdf5; border:1px solid #86efac; color:#059669;'
            : 'background:#fff1f2; border:1px solid #fda4af; color:#e11d48;'
          } font-size:11px; font-weight:600; line-height:1; white-space:nowrap;">
              <span style="width:6px; height:6px; border-radius:50%; background:${isActive ? '#10b981' : '#f43f5e'};"></span>
              <span>${isActive ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
        `;
      },
    },
    // {
    //   headerName: 'ACTIONS',
    //   width: 130,
    //   minWidth: 130,
    //   maxWidth: 130,
    //   sortable: false,
    //   filter: false,
    //   resizable: false,
    //   cellRenderer: (params: ICellRendererParams<NewNotificationItem>) => {
    //     const id = params.data?.id;
    //     return `
    //       <div style="display:flex; align-items:center; justify-content:flex-start; gap:8px; height:100%; padding-left:4px;">
    //         <button class="action-btn edit-btn" title="Edit" data-action="edit" data-id="${id}" style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:1px solid #dbeafe; border-radius:6px; background:#eff6ff; color:#2563eb; cursor:pointer;">
    //           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //             <path d="M12 20h9"></path>
    //             <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    //           </svg>
    //         </button>

    //       </div>
    //     `;
    //   },
    // },
  ];

  rowHeight = 38;
  headerHeight = 30;

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
    flex: 0,
  };

  ngOnInit(): void {
    this.formData.created_by = this.getCreatedByUserId();
    this.getNotifications();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 100);
  }

  private getCreatedByUserId(): number {
    const user = this.authService.getCurrentUser();
    const userautoId = user?.userautoId ?? user?.userautoid ?? sessionStorage.getItem('userautoId');
    return Number(userautoId || 0);
  }

  getNotifications(): void {
    this.isLoading.set(true);
    this.newnotificationService.getAll().subscribe({
      next: (res: any) => {
        try {
          let data: any = res?.data;
          if (typeof data === 'string') {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          }

          const records = Array.isArray(data)
            ? data
            : Array.isArray(data?.records)
              ? data.records
              : Array.isArray(data?.notifications)
                ? data.notifications
                : Array.isArray(res)
                  ? res
                  : [];

          this.totalRecords = records.length;
          this.totalPages = this.totalRecords > 0 ? Math.ceil(this.totalRecords / this.pageSize) : 1;

          const defaultUserId = this.getCreatedByUserId();

          this.rowData = records.map((item: any, index: number) => {
            const rawCreatedBy = item.created_by ?? item.createdBy ?? defaultUserId;
            const createdByNum = Number(rawCreatedBy);
            return {
              id: item.id ?? item._id ?? item.notification_id ?? String(index + 1),
              notification_title: item.notification_title ?? item.title ?? item.NotificationTitle ?? '',
              description: item.description ?? item.Description ?? '',
              attachment_path: item.attachment_path ?? item.attachmentPath ?? item.AttachmentPath ?? '',
              created_by: isNaN(createdByNum) ? defaultUserId : createdByNum,
              is_active: item.is_active ?? item.isActive ?? item.IsActive ?? true,
              created_at: item.created_at ?? item.createdAt ?? '',
            };
          });

          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', [...this.rowData]);
            this.applyStatusFilter();
          }
          this.isLoading.set(false);
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Failed to parse notifications response:', error);
          this.rowData = [];
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => {
        console.error('Notifications GetAll API Error:', error);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  onGridReady(params: GridReadyEvent<NewNotificationItem>): void {
    this.gridApi = params.api;
    this.applyStatusFilter();
  }

  onSearchChange(text: string): void {
    this.searchText.set(text);
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', text);
    }
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((value) => !value);
    this.applyStatusFilter();
  }

  private applyStatusFilter(): void {
    if (!this.gridApi) return;
    const activeOnly = this.showActiveOnly();
    if (activeOnly) {
      this.gridApi.setGridOption('isExternalFilterPresent', () => true);
      this.gridApi.setGridOption('doesExternalFilterPass', (node: any) => {
        return node.data?.is_active === true;
      });
    } else {
      this.gridApi.setGridOption('isExternalFilterPresent', () => false);
    }
    this.gridApi.onFilterChanged();
  }

  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;
    const button = target?.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    const path = button.getAttribute('data-path');
    const item = this.rowData.find((r) => String(r.id) === String(id));

    if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.confirmDelete(item);
    } else if (action === 'view-attachment' && path) {
      this.viewAttachment(path);
    }
  }

  viewAttachment(attachmentPath: string): void {
    if (!attachmentPath) return;

    let fullUrl = attachmentPath;
    if (!attachmentPath.startsWith('http://') && !attachmentPath.startsWith('https://')) {
      const photoPath = environment.photoPath || '';
      const base = photoPath.endsWith('/') ? photoPath.slice(0, -1) : photoPath;
      const cleanPath = attachmentPath.startsWith('/') ? attachmentPath.slice(1) : attachmentPath;
      fullUrl = `${base}/${cleanPath}`;
    }

    window.open(fullUrl, '_blank');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Type',
        text: 'Only PDF documents are allowed for the notification document.',
      });
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: 'File size exceeds 10 MB limit.',
      });
      input.value = '';
      return;
    }

    const scheduleId =
      (typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('schedule_autoid') ||
        sessionStorage.getItem('ScheduleAutoId') ||
        sessionStorage.getItem('schedule_id') ||
        sessionStorage.getItem('scheduleId')
        : null) || '1';

    const timestamp = Date.now();
    const fileName = `${timestamp}.pdf`;
    const filePath = `job-notification/${scheduleId}/${fileName}`;

    const payload = { filepath: filePath, filename: fileName };
    const encReq = CryptoHelper.encrypt(JSON.stringify(payload));

    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('File', file, fileName);

    this.isUploadingDocument.set(true);
    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);

    Swal.fire({
      title: 'Uploading Notification Document...',
      text: 'Please wait while your PDF document is being uploaded.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.newnotificationService.uploadNotificationDoc(formData, encReq).subscribe({
      next: (res: any) => {
        this.isUploadingDocument.set(false);
        Swal.close();

        let finalPath = filePath;
        let resPath = res?.data;

        if (resPath) {
          try {
            if (typeof resPath === 'string') {
              const decrypted = CryptoHelper.decrypt(resPath);
              if (decrypted) {
                try {
                  const parsed = JSON.parse(decrypted);
                  resPath = parsed;
                } catch {
                  resPath = decrypted;
                }
              }
            }
          } catch (e) {
            console.error('Error decrypting upload response:', e);
          }

          if (typeof resPath === 'string' && resPath.trim()) {
            finalPath = resPath.trim().replace(/^"|"$/g, '');
          } else if (resPath && typeof resPath === 'object') {
            finalPath = resPath.filepath || resPath.filePath || resPath.path || filePath;
          }
        }

        this.formData.attachment_path = finalPath;
        this.cdr.detectChanges();

        Swal.fire({
          icon: 'success',
          title: 'Uploaded Successfully',
          text: 'Notification document uploaded successfully.',
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.isUploadingDocument.set(false);
        Swal.close();
        console.error('Upload Error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: err?.error?.message || err?.message || 'An error occurred during file upload.',
        });
        this.removeFile();
      },
    });
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.formData.attachment_path = '';
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.submitted = false;
    this.selectedFile.set(null);
    this.selectedFileName.set('');

    const userId = this.getCreatedByUserId();

    this.formData = {
      id: null,
      notification_title: '',
      description: '',
      attachment_path: '',
      created_by: userId,
      is_active: true,
    };

    this.isModalOpen.set(true);
    setTimeout(() => {
      this.titleInput?.nativeElement.focus();
    }, 100);
  }

  openEditModal(item: NewNotificationItem): void {
    if (!item.id) return;
    this.isLoading.set(true);
    this.selectedFile.set(null);
    this.selectedFileName.set('');

    const userId = this.getCreatedByUserId();

    this.newnotificationService.getById(String(item.id)).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        try {
          let data: any = res?.data;
          if (typeof data === 'string') {
            const decryptedData = CryptoHelper.decrypt(data);
            data = typeof decryptedData === 'string' ? JSON.parse(decryptedData) : decryptedData;
          }

          const itemData = data?.notification ?? data?.record ?? data ?? item;
          const attPath = itemData.attachment_path ?? itemData.attachmentPath ?? item.attachment_path ?? '';
          const rawCreatedBy = itemData.created_by ?? item.created_by ?? userId;
          const createdByNum = Number(rawCreatedBy);

          this.formData = {
            id: String(itemData.id ?? itemData._id ?? item.id),
            notification_title: itemData.notification_title ?? itemData.title ?? item.notification_title ?? '',
            description: itemData.description ?? item.description ?? '',
            attachment_path: attPath,
            created_by: isNaN(createdByNum) ? userId : createdByNum,
            is_active: itemData.is_active ?? itemData.isActive ?? item.is_active ?? true,
          };

          if (attPath) {
            const fileNameOnly = attPath.split('/').pop() || attPath;
            this.selectedFileName.set(fileNameOnly);
          }

          this.isEditMode.set(true);
          this.selectedItem.set(item);
          this.isModalOpen.set(true);
        } catch (error) {
          console.error('GetById decrypt/parse error:', error);
          const rawCreatedBy = item.created_by ?? userId;
          const createdByNum = Number(rawCreatedBy);
          this.formData = {
            id: String(item.id),
            notification_title: item.notification_title || '',
            description: item.description || '',
            attachment_path: item.attachment_path || '',
            created_by: isNaN(createdByNum) ? userId : createdByNum,
            is_active: item.is_active ?? true,
          };
          if (this.formData.attachment_path) {
            this.selectedFileName.set(this.formData.attachment_path.split('/').pop() || this.formData.attachment_path);
          }
          this.isEditMode.set(true);
          this.selectedItem.set(item);
          this.isModalOpen.set(true);
        }
      },
      error: (error: any) => {
        console.error('GetById API Error:', error);
        this.isLoading.set(false);
        const rawCreatedBy = item.created_by ?? userId;
        const createdByNum = Number(rawCreatedBy);
        this.formData = {
          id: String(item.id),
          notification_title: item.notification_title || '',
          description: item.description || '',
          attachment_path: item.attachment_path || '',
          created_by: isNaN(createdByNum) ? userId : createdByNum,
          is_active: item.is_active ?? true,
        };
        if (this.formData.attachment_path) {
          this.selectedFileName.set(this.formData.attachment_path.split('/').pop() || this.formData.attachment_path);
        }
        this.isEditMode.set(true);
        this.selectedItem.set(item);
        this.isModalOpen.set(true);
      },
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveNotification(): void {
    this.submitted = true;

    if (this.isUploadingDocument()) {
      Swal.fire({
        icon: 'warning',
        title: 'Upload in Progress',
        text: 'Please wait until the Notification Document finishes uploading.',
      });
      return;
    }

    const title = this.formData.notification_title.trim();

    if (!title) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Notification Title is required.',
      });
      return;
    }

    const userId = this.getCreatedByUserId();

    const payload: NewNotificationItem = {
      notification_title: title,
      description: this.formData.description ? this.formData.description.trim() : '',
      attachment_path: this.formData.attachment_path ? this.formData.attachment_path.trim() : '',
      created_by: userId,
      is_active: this.formData.is_active,
    };

    if (this.isEditMode() && this.formData.id != null) {
      payload.id = this.formData.id;
    }

    Swal.fire({
      title: 'Saving Notification...',
      text: 'Please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.newnotificationService.addOrUpdate(payload).subscribe({
      next: (res: any) => {
        Swal.close();
        if (res && (res.code === 0 || res.code === '0' || res.status === false)) {
          Swal.fire({
            icon: 'warning',
            title: res.message || 'Operation Failed',
            text: res.message || 'Unable to save Notification.',
            confirmButtonColor: '#1c52a3',
          });
          return;
        }

        this.closeModal();

        Swal.fire({
          icon: 'success',
          title: this.isEditMode() ? 'Updated Successfully' : 'Added Successfully',
          text: res?.message || `Notification "${title}" saved successfully.`,
          timer: 1800,
          showConfirmButton: false,
        });

        this.getNotifications();
      },
      error: (error: any) => {
        Swal.close();
        console.error('Notification Save API Error:', error);
        let errMsg = error?.error?.message || error?.message || 'Unable to save Notification.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errMsg,
          confirmButtonColor: '#1c52a3',
        });
      },
    });
  }

  confirmDelete(item: NewNotificationItem): void {
    Swal.fire({
      title: 'Delete Notification?',
      text: `Are you sure you want to delete "${item.notification_title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      const userId = this.getCreatedByUserId();
      const rawCreatedBy = item.created_by ?? userId;
      const createdByNum = Number(rawCreatedBy);
      const deletePayload: NewNotificationItem = {
        id: item.id,
        notification_title: item.notification_title,
        description: item.description,
        attachment_path: item.attachment_path,
        created_by: isNaN(createdByNum) ? userId : createdByNum,
        is_active: false,
      };

      this.newnotificationService.addOrUpdate(deletePayload).subscribe({
        next: (res: any) => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: `"${item.notification_title}" has been removed.`,
            timer: 1500,
            showConfirmButton: false,
          });
          this.getNotifications();
        },
        error: (error: any) => {
          console.error('Notification Delete API Error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Unable to delete Notification.',
          });
        },
      });
    });
  }

  onPageSizeChange(value: string): void {
    const newPageSize = Number(value);
    if (!newPageSize || newPageSize === this.pageSize) return;
    this.pageSize = newPageSize;
    this.currentPage = 1;
    this.getNotifications();
  }

  goToFirstPage(): void {
    this.currentPage = 1;
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  goToLastPage(): void {
    this.currentPage = this.totalPages;
  }
}

