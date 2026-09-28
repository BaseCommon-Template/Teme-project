import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  CellClickedEvent,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';
import Swal from 'sweetalert2';
import { PostMasterService } from '../../services/post-master.service';
import { CryptoHelper } from '../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface PostData {
  id: number;
  post_autoid?: number;
  post_name: string;
  post_code: string;
  is_active?: boolean;
  created_at: string;
}

@Component({
  selector: 'app-postmaster',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './postmaster.html',
  styleUrl: './postmaster.css',
})
export class Postmaster implements OnInit, AfterViewInit {
  private readonly postMasterService = inject(PostMasterService);
  private readonly cdr = inject(ChangeDetectorRef);

  private gridApi!: GridApi<PostData>;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLInputElement>;

  readonly searchText = signal<string>('');
  readonly pageSize = signal<number>(20);
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly showActiveOnly = signal<boolean>(true);

  currentPage = 1;
  totalRecords = 0;
  totalPages = 0;

  rowHeight = 38;
  headerHeight = 30;

  readonly Math = Math;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((v) => !v);
    this.loadPosts(1);
  }

  isPostCodeManuallyEdited = false;

  formData = {
    id: 0,
    post_name: '',
    post_code: '',
    is_active: true,
  };

  rowData: PostData[] = [];

  colDefs: ColDef<PostData>[] = [
    {
      headerName: 'SR. NO.',
      valueGetter: (params) => {
        if (params.node?.rowIndex == null) return '';
        return (this.currentPage - 1) * this.pageSize() + params.node.rowIndex + 1;
      },
      width: 90,
      minWidth: 90,
      sortable: false,
    },
    {
      headerName: 'POST NAME',
      field: 'post_name',
      flex: 1,
      minWidth: 190,
      filter: true,
    },
    {
      headerName: 'POST CODE',
      field: 'post_code',
      flex: 1,
      minWidth: 220,
      filter: true,
    },
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 140,
      minWidth: 115,
      maxWidth: 140,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<PostData>) => {
        const isActive = params.value !== false;
        return `
          <div style="
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:flex-start;
            box-sizing:border-box;
            padding-left:4px;
          ">
            <span style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              gap:7px;
              min-width:76px;
              height:26px;
              padding:0 11px;
              box-sizing:border-box;
              border-radius:14px;
              ${isActive
            ? `
                    background:#ecfdf5;
                    border:1px solid #86efac;
                    color:#059669;
                  `
            : `
                    background:#fff1f2;
                    border:1px solid #fda4af;
                    color:#e11d48;
                  `
          }
              font-size:11px;
              font-weight:600;
              line-height:1;
              white-space:nowrap;
            ">
              <span style="
                width:7px;
                height:7px;
                flex-shrink:0;
                border-radius:50%;
                background:${isActive ? '#10b981' : '#f43f5e'};
              "></span>
              <span>${isActive ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
        `;
      },
    },
    {
      headerName: 'ACTIONS',
      width: 150,
      minWidth: 145,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<PostData>) => {
        const id = params.data?.id || params.data?.post_autoid;
        return `
          <div style="
            display:flex;
            align-items:center;
            justify-content:flex-start;
            gap:8px;
            height:100%;
            padding-left:4px;
            box-sizing:border-box;
          ">
            <button
              class="action-btn edit-btn"
              title="Edit"
              data-action="edit"
              data-id="${id}"
              style="
                width:30px;
                height:30px;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:0;
                border:1px solid #dbeafe;
                border-radius:6px;
                background:#eff6ff;
                color:#2563eb;
                cursor:pointer;
              "
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </button>

            <button
              class="action-btn delete-btn"
              title="Delete"
              data-action="delete"
              data-id="${id}"
              style="
                width:30px;
                height:30px;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:0;
                border:1px solid #fee2e2;
                border-radius:6px;
                background:#fef2f2;
                color:#dc2626;
                cursor:pointer;
              "
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M8 6V4h8v2"></path>
                <path d="M19 6v14H5V6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </button>
          </div>
        `;
      },
    },
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(page: number = this.currentPage): void {
    this.isLoading.set(true);
    this.currentPage = page;

    this.postMasterService
      .getAllPosts(this.currentPage, this.pageSize(), this.showActiveOnly())
      .subscribe({
        next: (res: any) => {
          let data: any = res?.data ?? res;

          if (typeof data === 'string') {
            try {
              const decrypted = CryptoHelper.decrypt(data);
              data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
            } catch (err) {
              console.error('Post Decryption Error:', err);
            }
          }

          const postsObj = data?.Posts || data?.posts || data;
          let records: any[] = Array.isArray(postsObj?.records)
            ? postsObj.records
            : Array.isArray(postsObj)
              ? postsObj
              : Array.isArray(data?.records)
                ? data.records
                : Array.isArray(data)
                  ? data
                  : [];

          this.totalRecords = Number(
            postsObj?.total_records ?? data?.total_records ?? records.length,
          );
          this.currentPage = Number(postsObj?.page_number ?? data?.page_number ?? page);
          this.totalPages =
            Number(postsObj?.total_pages ?? data?.total_pages) ||
            Math.ceil(this.totalRecords / this.pageSize()) ||
            1;

          this.rowData = records.map((item: any, index: number): PostData => {
            const autoId = Number(item.post_autoid ?? item.id ?? index + 1);
            const createdAtRaw = item.createdAt ?? item.created_at;
            const formattedDate = createdAtRaw
              ? new Date(createdAtRaw).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
              : '-';

            const rawStatus = item.is_active ?? item.IsActive ?? item.active;
            const isActive =
              rawStatus !== undefined
                ? Boolean(rawStatus)
                : item.status !== undefined
                  ? item.status === 'Active'
                  : true;

            return {
              id: autoId,
              post_autoid: autoId,
              post_name: item.post_name ?? '',
              post_code: item.post_code ?? '',
              is_active: Boolean(isActive),
              created_at: formattedDate,
            };
          });

          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', this.filteredRowData());
          }

          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error loading posts:', err);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
      });
  }

  filteredRowData(): PostData[] {
    const search = this.searchText().trim().toLowerCase();
    const activeOnly = this.showActiveOnly();

    let list = this.rowData;
    if (activeOnly) {
      list = list.filter((item) => item.is_active !== false);
    }

    if (search) {
      list = list.filter(
        (post) =>
          (post.post_name || '').toLowerCase().includes(search) ||
          (post.post_code || '').toLowerCase().includes(search),
      );
    }

    return list;
  }

  onGridReady(event: GridReadyEvent<PostData>): void {
    this.gridApi = event.api;
    if (this.rowData.length) {
      this.gridApi.setGridOption('rowData', this.filteredRowData());
    }
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.filteredRowData());
    }
  }

  changePageSize(value: number | string): void {
    const size = Number(value);
    if (!size || size === this.pageSize()) return;
    this.pageSize.set(size);
    this.currentPage = 1;
    this.loadPosts(1);
  }

  exportCsv(): void {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `post-master-${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  }

  onCellClicked(event: CellClickedEvent<PostData>): void {
    const target = event.event?.target as HTMLElement | null;
    if (!target) return;

    const button = target.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const id = Number(button.getAttribute('data-id') || event.data?.id);
    const item = this.rowData.find((p) => p.id === id);

    if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.deletePost(id);
    }
  }

  private generatePostCode(name: string): string {
    if (!name) return '';
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+/, '');
  }

  onPostNameChange(value: string): void {
    this.formData.post_name = value;
    if (!this.isPostCodeManuallyEdited) {
      this.formData.post_code = this.generatePostCode(value);
    }
  }

  onPostCodeChange(value: string): void {
    this.formData.post_code = value;
    if (!value) {
      this.isPostCodeManuallyEdited = false;
      this.formData.post_code = this.generatePostCode(this.formData.post_name);
    } else {
      this.isPostCodeManuallyEdited = true;
    }
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.isPostCodeManuallyEdited = false;

    this.formData = {
      id: 0,
      post_name: '',
      post_code: '',
      is_active: true,
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  openEditModal(post: PostData): void {
    this.isEditMode.set(true);
    this.isPostCodeManuallyEdited = true;

    this.formData = {
      id: post.id || post.post_autoid || 0,
      post_name: post.post_name,
      post_code: post.post_code,
      is_active: post.is_active !== false,
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  preventPostNameInvalidCharacters(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // POST NAME:
    // Only letters, space and hyphen allowed
    if (!/^[A-Za-z _-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizePostName(): void {
    this.formData.post_name = this.formData.post_name
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ');
  }

  preventPostCodeSpace(event: KeyboardEvent): void {
    // Allow control/navigation keys
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // POST CODE: everything allowed except space
    if (event.key === ' ') {
      event.preventDefault();
    }
  }

  sanitizePostCode(): void {
    // Remove spaces only
    this.formData.post_code = this.formData.post_code.replace(/\s/g, '');
  }

  private checkResponseSuccess(res: any): { isSuccess: boolean; message: string } {
    let data: any = res?.data ?? res;

    if (typeof data === 'string') {
      try {
        const decrypted = CryptoHelper.decrypt(data);
        if (decrypted) {
          data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
        }
      } catch (e) {
        // ignore
      }
    }

    const rawMessage = (res?.message || data?.message || '').toString();
    const lowerMsg = rawMessage.toLowerCase();

    // Explicit error check for MongoDB WriteError / DuplicateKey / API failure
    const isWriteError =
      lowerMsg.includes('writeerror') ||
      lowerMsg.includes('duplicatekey') ||
      lowerMsg.includes('duplicate key') ||
      lowerMsg.includes('e11000') ||
      res?.status === false ||
      data?.status === false ||
      res?.success === false ||
      data?.success === false;

    if (isWriteError) {
      let userMsg = 'Operation failed.';
      if (
        lowerMsg.includes('duplicatekey') ||
        lowerMsg.includes('duplicate key') ||
        lowerMsg.includes('e11000') ||
        lowerMsg.includes('post_code_1')
      ) {
        userMsg = 'Post Code already exists. Please enter a unique Post Code.';
      } else if (rawMessage) {
        userMsg = rawMessage;
      }
      return { isSuccess: false, message: userMsg };
    }

    return { isSuccess: true, message: rawMessage };
  }

  savePost(): void {
    if (!this.formData.post_name.trim() || !this.formData.post_code.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please enter Post Name and Post Code.',
      });
      return;
    }

    this.isLoading.set(true);

    if (this.isEditMode()) {
      const payload = {
        post_autoid: Number(this.formData.id),
        post_name: this.formData.post_name.trim(),
        post_code: this.formData.post_code.trim(),
        is_active: !!this.formData.is_active,
      };

      this.postMasterService.updatePost(payload).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          this.closeModal();
          const check = this.checkResponseSuccess(res);
          if (!check.isSuccess) {
            Swal.fire({
              icon: 'error',
              title: 'Update Failed',
              text: check.message,
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: `Post "${this.formData.post_name}" updated successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadPosts();
        },
        error: (err: any) => {
          console.error('Update Post error:', err);
          this.isLoading.set(false);
          this.closeModal();
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Unable to update post. Please try again.',
          });
        },
      });
    } else {
      const payload = {
        post_name: this.formData.post_name.trim(),
        post_code: this.formData.post_code.trim(),
        is_active: !!this.formData.is_active,
      };

      this.postMasterService.addPost(payload).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          this.closeModal();
          const check = this.checkResponseSuccess(res);
          if (!check.isSuccess) {
            Swal.fire({
              icon: 'error',
              title: 'Add Failed',
              text: check.message,
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: 'Created',
            text: `Post "${this.formData.post_name}" added successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadPosts();
        },
        error: (err: any) => {
          console.error('Add Post error:', err);
          this.isLoading.set(false);
          this.closeModal();
          Swal.fire({
            icon: 'error',
            title: 'Add Failed',
            text: 'Unable to add post. Please try again.',
          });
        },
      });
    }
  }

  deletePost(id: number): void {
    const item = this.rowData.find((p) => p.id === id);
    const name = item?.post_name || 'this post';

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);
        this.postMasterService.deletePost(id).subscribe({
          next: (res: any) => {
            this.isLoading.set(false);
            const check = this.checkResponseSuccess(res);
            if (!check.isSuccess) {
              Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: check.message,
              });
              return;
            }

            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: `Post "${name}" has been deleted.`,
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadPosts();
          },
          error: (err: any) => {
            console.error('Delete Post error:', err);
            this.isLoading.set(false);
            Swal.fire({
              icon: 'error',
              title: 'Delete Failed',
              text: 'Unable to delete post. Please try again.',
            });
          },
        });
      }
    });
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  private formatToday(): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }

  goToFirstPage(): void {
    if (this.currentPage === 1) return;
    this.loadPosts(1);
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) return;
    this.loadPosts(this.currentPage - 1);
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.loadPosts(this.currentPage + 1);
  }

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.loadPosts(this.totalPages);
  }
}
