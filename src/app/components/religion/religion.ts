import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

import { ReligionService } from '../../services/religion.service';

ModuleRegistry.registerModules([AllCommunityModule]);

// =====================================================
// INTERFACE
// =====================================================

export interface ReligionItem {
  id: number;

  religion_name: string;

  created_at: string;

  is_draft?: boolean;

  is_active?: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-religion',

  standalone: true,

  imports: [CommonModule, FormsModule, AgGridAngular],

  templateUrl: './religion.html',

  styleUrl: './religion.css',
})
export class Religion implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLInputElement>;

  readonly Math = Math;

  // =====================================================
  // SERVICE
  // =====================================================

  private religionService = inject(ReligionService);

  // =====================================================
  // GRID API
  // =====================================================

  private gridApi!: GridApi<ReligionItem>;

  // =====================================================
  // SEARCH & STATUS FILTERS
  // =====================================================

  readonly searchText = signal<string>('');

  readonly showActiveOnly = signal<boolean>(true);

  // =====================================================
  // MODAL
  // =====================================================

  readonly isModalOpen = signal<boolean>(false);

  readonly isEditMode = signal<boolean>(false);

  readonly selectedItem = signal<ReligionItem | null>(null);

  // =====================================================
  // LOADING
  // =====================================================

  readonly isLoading = signal<boolean>(false);

  // =====================================================
  // FORM
  // =====================================================
  private readonly religionNameRegex = /^[A-Za-z]+(?:[ _-][A-Za-z]+)*$/;

  formData = {
    id: 0,
    is_active: true,
    religion_name: '',
  };

  // =====================================================
  // GRID DATA
  // =====================================================

  allReligions: ReligionItem[] = [];

  rowData: ReligionItem[] = [];

  // =====================================================
  // PAGINATION
  // =====================================================

  currentPage = 1;

  totalRecords = 0;

  totalPages = 1;

  rowsPerPage = 20;

  // =====================================================
  // COLUMN DEFINITIONS
  // =====================================================

  colDefs: ColDef<ReligionItem>[] = [
    // ===================================================
    // SR NO
    // ===================================================

    {
      headerName: 'SR. NO.',

      valueGetter: (params) => {
        const rowIndex = params.node?.rowIndex ?? 0;

        return (this.currentPage - 1) * this.rowsPerPage + rowIndex + 1;
      },

      width: 100,

      minWidth: 100,

      maxWidth: 100,

      sortable: false,

      filter: false,

      resizable: false,

      cellStyle: {
        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        fontSize: '12px',

        color: '#333',
      },
    },

    // ===================================================
    // RELIGION
    // ===================================================

    {
      field: 'religion_name',

      headerName: 'RELIGION',

      minWidth: 300,

      flex: 1.5,

      cellRenderer: (params: ICellRendererParams<ReligionItem>) => {
        return `

            <span

              style="

                font-size:12px;

                color:#333;

                font-weight:600;

                white-space:nowrap;

                overflow:hidden;

                text-overflow:ellipsis;

                display:block;

                width:100%;

              "

            >

              ${params.value || '-'}

            </span>

          `;
      },
    },

    // ===================================================
    // STATUS
    // ===================================================
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 140,
      minWidth: 115,
      maxWidth: 140,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<ReligionItem>) => {
        const isActive = params.value !== false && !params.data?.is_draft;
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
              ${
                isActive
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

    // ===================================================
    // ACTIONS
    // ===================================================

    {
      headerName: 'ACTIONS',

      width: 145,

      minWidth: 145,

      maxWidth: 145,

      sortable: false,

      filter: false,

      resizable: false,

      cellRenderer: (params: ICellRendererParams<ReligionItem>) => {
        const id = params.data?.id;

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

        <!-- EDIT -->
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
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
          </svg>
        </button>

        <!-- DELETE -->
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
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
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

  // =====================================================
  // GRID SETTINGS
  // =====================================================

  rowHeight = 40;

  headerHeight = 36;

  defaultColDef: ColDef = {
    sortable: true,

    filter: true,

    resizable: true,

    minWidth: 80,
  };

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadReligions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((value) => !value);
    this.currentPage = 1;
    this.applyReligionView();
  }

  applyReligionView(): void {
    let filtered = [...this.allReligions];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.is_active === true);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((item) =>
        (item.religion_name || '').toLowerCase().includes(search),
      );
    }

    this.totalRecords = filtered.length;
    this.totalPages = this.totalRecords > 0 ? Math.ceil(this.totalRecords / this.rowsPerPage) : 0;

    if (this.totalPages > 0 && this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.totalPages === 0) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.rowData = filtered.slice(start, start + this.rowsPerPage);

    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', [...this.rowData]);
    }
  }

  // =====================================================
  // LOAD RELIGIONS
  // =====================================================

  loadReligions(page: number = this.currentPage): void {
    this.isLoading.set(true);

    this.religionService.getAllReligion(false, 1, 1000).subscribe({
      next: (response) => {
        if (!response?.data) {
          this.isLoading.set(false);
          this.allReligions = [];
          this.rowData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
          return;
        }

        try {
          const decryptedResponse = this.religionService.decryptResponse(response.data);
          const records = decryptedResponse?.records || [];

          this.allReligions = records.map((item: any) => ({
            id: Number(item.autoreligion_id),
            religion_name: item.religion || '',
            created_at: item.createdAt ? this.formatDate(item.createdAt) : '-',
            is_draft: item.is_draft,
            is_active: item.is_active,
          }));

          this.applyReligionView();
        } catch (error) {
          console.error('DECRYPTION ERROR:', error);
          this.allReligions = [];
          this.rowData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
        }

        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('GET ALL RELIGION ERROR:', error);
        this.isLoading.set(false);
        this.allReligions = [];
        this.rowData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
      },
    });
  }

  // =====================================================
  // GRID READY
  // =====================================================

  onGridReady(params: GridReadyEvent<ReligionItem>): void {
    this.gridApi = params.api;
    this.applyReligionView();
  }

  // =====================================================
  // SEARCH
  // =====================================================

  onSearchChange(text: string): void {
    this.searchText.set(text);
    this.currentPage = 1;
    this.applyReligionView();
  }

  // =====================================================
  // CELL CLICK
  // =====================================================

  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;

    const button = target?.closest('button');

    if (!button) {
      return;
    }

    const action = button.getAttribute('data-action');

    const id = Number(button.getAttribute('data-id'));

    if (!id) {
      return;
    }

    const item = this.rowData.find((row) => row.id === id);

    if (!item) {
      return;
    }

    // ================================================
    // EDIT
    // ================================================

    if (action === 'edit') {
      this.openEditModal(item);

      return;
    }

    // ================================================
    // DELETE
    // ================================================

    if (action === 'delete') {
      this.deleteReligion(item);

      return;
    }
  }

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  submitted = false;

  openAddModal(): void {
    this.submitted = false;

    this.isEditMode.set(false);

    this.selectedItem.set(null);

    this.formData = {
      id: 0,
      is_active: true,
      religion_name: '',
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
  }

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  openEditModal(item: ReligionItem): void {
    this.submitted = false;

    this.isLoading.set(true);

    this.religionService

      .getReligionById(item.id)

      .subscribe({
        next: (response) => {
          // console.log('ENCRYPTED GET BY ID:', response);

          if (!response?.data) {
            this.isLoading.set(false);

            Swal.fire({
              icon: 'error',

              title: 'Error',

              text: 'Unable to get religion details.',
            });

            return;
          }

          try {
            const decrypted = this.religionService.decryptResponse(response.data);

            // console.log('DECRYPTED GET BY ID:', decrypted);

            // =========================================
            // HANDLE DIFFERENT POSSIBLE RESPONSE SHAPES
            // =========================================

            let data = decrypted;

            if (Array.isArray(decrypted?.records)) {
              data = decrypted.records[0];
            } else if (decrypted?.record) {
              data = decrypted.record;
            } else if (decrypted?.data) {
              data = decrypted.data;
            }

            if (!data) {
              throw new Error('Religion record not found');
            }

            // =========================================
            // SET FORM
            // =========================================

            this.isEditMode.set(true);

            this.selectedItem.set(item);

            this.formData = {
              id: Number(data.autoreligion_id || item.id),
              is_active: data.is_active ?? item.is_active ?? true,
              religion_name: data.religion || item.religion_name,
            };

            this.isModalOpen.set(true);
            setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
          } catch (error) {
            console.error('GET BY ID DECRYPT ERROR:', error);

            Swal.fire({
              icon: 'error',

              title: 'Decryption Failed',

              text: 'Unable to decrypt religion details.',
            });
          }

          this.isLoading.set(false);
        },

        error: (error) => {
          console.error('GET BY ID ERROR:', error);

          this.isLoading.set(false);

          Swal.fire({
            icon: 'error',

            title: 'API Error',

            text: 'Unable to load religion details.',
          });
        },
      });
  }

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  closeModal(): void {
    this.submitted = false;

    this.isModalOpen.set(false);

    this.isEditMode.set(false);

    this.selectedItem.set(null);

    this.formData = {
      id: 0,
      is_active: true,
      religion_name: '',
    };
  }

  preventReligionNameInvalidCharacters(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Letters, space, underscore and hyphen allowed
    if (!/^[A-Za-z _-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeReligionName(): void {
    this.formData.religion_name = this.formData.religion_name
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  // =====================================================
  // SAVE RELIGION
  // =====================================================

  saveReligion(): void {
    this.submitted = true;

    const religion = this.formData.religion_name.trim();

    // =====================================================
    // REQUIRED VALIDATION
    // =====================================================

    if (!religion) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter Religion Name.',
      });

      return;
    }

    // =====================================================
    // REGEX VALIDATION
    // =====================================================

    if (!this.religionNameRegex.test(religion)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Religion Name',
        text: 'Religion Name should contain only letters and single spaces.',
      });

      return;
    }

    // =====================================================
    // LENGTH VALIDATION
    // =====================================================

    if (religion.length > 100) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Religion',
        text: 'Religion name cannot exceed 100 characters.',
      });

      return;
    }

    // =====================================================
    // API CALL
    // =====================================================

    this.isLoading.set(true);

    // =====================================================
    // UPDATE
    // =====================================================

    if (this.isEditMode()) {
      this.religionService
        .updateReligion(this.formData.id, religion, false, this.formData.is_active)
        .subscribe({
          next: (response) => {
            // console.log('ENCRYPTED UPDATE RESPONSE:', response);

            this.handleMutationSuccess(response, 'updated', religion);
          },

          error: (error) => {
            console.error('UPDATE RELIGION ERROR:', error);

            this.isLoading.set(false);
            this.closeModal();

            let errMsg = this.getErrorMessage(error);
            if (error?.error) {
              let errObj = error.error;
              if (typeof errObj === 'string') {
                try {
                  const decrypted = this.religionService.decryptResponse(errObj);
                  errObj = decrypted || errObj;
                } catch (e) {}
              }
              if (errObj && errObj.message) {
                errMsg = errObj.message;
              }
            }

            Swal.fire({
              icon: 'warning',
              title: errMsg,
              text: errMsg,
              confirmButtonColor: '#1c52a3',
            });
          },
        });

      return;
    }

    // =====================================================
    // ADD
    // =====================================================

    this.religionService.addReligion(religion, false).subscribe({
      next: (response) => {
        // console.log('ENCRYPTED ADD RESPONSE:', response);

        this.handleMutationSuccess(response, 'added', religion);
      },

      error: (error) => {
        console.error('ADD RELIGION ERROR:', error);

        this.isLoading.set(false);
        this.closeModal();

        let errMsg = this.getErrorMessage(error);
        if (error?.error) {
          let errObj = error.error;
          if (typeof errObj === 'string') {
            try {
              const decrypted = this.religionService.decryptResponse(errObj);
              errObj = decrypted || errObj;
            } catch (e) {}
          }
          if (errObj && errObj.message) {
            errMsg = errObj.message;
          }
        }

        Swal.fire({
          icon: 'warning',
          title: errMsg,
          text: errMsg,
          confirmButtonColor: '#1c52a3',
        });
      },
    });
  }

  //pagination code

  // goToFirstPage(): void {
  //   if (this.currentPage <= 1) {
  //     return;
  //   }

  //   this.loadReligions(1);
  // }

  // goToLastPage(): void {
  //   if (this.currentPage >= this.totalPages) {
  //     return;
  //   }

  //   this.loadReligions(this.totalPages);
  // }

  // =====================================================
  // ADD / UPDATE SUCCESS
  // =====================================================

  private handleMutationSuccess(
    response: any,

    action: 'added' | 'updated',

    religion: string,
  ): void {
    if (
      response &&
      (response.code === 0 ||
        response.code === '0' ||
        response.status === false ||
        response.status === 0)
    ) {
      this.isLoading.set(false);
      this.closeModal();

      Swal.fire({
        icon: 'warning',
        title:
          response.message || (action === 'added' ? 'Religion already exists' : 'Update Failed'),
        text:
          response.message || (action === 'added' ? 'Religion already exists' : 'Update Failed'),
        confirmButtonColor: '#1c52a3',
      });
      return;
    }

    // ================================================
    // DECRYPT RESPONSE IF AVAILABLE
    // ================================================

    if (response?.data) {
      try {
        const decrypted = this.religionService.decryptResponse(response.data);

        // console.log(`DECRYPTED ${action.toUpperCase()} RESPONSE:`, decrypted);
      } catch (error) {
        console.warn('Mutation response decryption failed:', error);
      }
    }

    this.isLoading.set(false);

    this.closeModal();

    Swal.fire({
      icon: 'success',

      title: action === 'added' ? 'Added Successfully' : 'Updated Successfully',

      text: response?.message || `Religion "${religion}" has been ${action} successfully.`,

      timer: 1500,

      showConfirmButton: false,
    });

    // ================================================
    // RELOAD FIRST PAGE
    // ================================================

    this.currentPage = 1;

    this.loadReligions(1);
  }

  // =====================================================
  // DELETE
  // =====================================================

  deleteReligion(item: ReligionItem): void {
    Swal.fire({
      icon: 'warning',

      title: 'Delete Religion?',

      html: `Are you sure you want to delete
        <strong>${this.escapeHtml(item.religion_name)}</strong>?`,

      showCancelButton: true,

      confirmButtonText: 'Yes, Delete',

      cancelButtonText: 'Cancel',

      reverseButtons: true,
    })

      .then((result) => {
        if (!result.isConfirmed) {
          return;
        }

        this.performDelete(item);
      });
  }

  // =====================================================
  // PERFORM DELETE
  // =====================================================

  private performDelete(item: ReligionItem): void {
    this.isLoading.set(true);

    this.religionService

      .deleteReligion(item.id)

      .subscribe({
        next: (response) => {
          // console.log('ENCRYPTED DELETE RESPONSE:', response);

          // =========================================
          // DECRYPT RESPONSE
          // =========================================

          if (response?.data) {
            try {
              const decrypted = this.religionService.decryptResponse(response.data);

              // console.log('DECRYPTED DELETE RESPONSE:', decrypted);
            } catch (error) {
              console.warn('Delete response decryption failed:', error);
            }
          }

          this.isLoading.set(false);

          Swal.fire({
            icon: 'success',

            title: 'Deleted Successfully',

            text: `Religion "${item.religion_name}" has been deleted.`,

            timer: 1500,

            showConfirmButton: false,
          });

          // =========================================
          // RELOAD
          // =========================================

          if (this.rowData.length === 1 && this.currentPage > 1) {
            this.currentPage--;
          }

          this.loadReligions(this.currentPage);
        },

        error: (error) => {
          console.error('DELETE RELIGION ERROR:', error);

          this.isLoading.set(false);

          Swal.fire({
            icon: 'error',

            title: 'Delete Failed',

            text: this.getErrorMessage(error),
          });
        },
      });
  }

  // =====================================================
  // =====================================================
  // PAGINATION CONTROLS
  // =====================================================

  onRowsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = Number(select.value);
    if (!value) return;

    this.rowsPerPage = value;
    this.currentPage = 1;
    this.applyReligionView();
  }

  goToFirstPage(): void {
    if (this.currentPage > 1) {
      this.currentPage = 1;
      this.applyReligionView();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyReligionView();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyReligionView();
    }
  }

  goToLastPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage = this.totalPages;
      this.applyReligionView();
    }
  }

  // =====================================================
  // FORMAT DATE
  // =====================================================

  formatDate(date: string): string {
    if (!date) {
      return '-';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      'en-GB',

      {
        day: '2-digit',

        month: 'short',

        year: 'numeric',
      },
    );
  }

  // =====================================================
  // EXPORT CSV
  // =====================================================

  exportCsv(): void {
    if (!this.gridApi) {
      return;
    }

    this.gridApi.exportDataAsCsv({
      fileName: `religions_${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }

  // =====================================================
  // ERROR MESSAGE
  // =====================================================

  private getErrorMessage(error: any): string {
    return error?.error?.message || error?.message || 'Something went wrong. Please try again.';
  }

  // =====================================================
  // ESCAPE HTML
  // =====================================================

  private escapeHtml(value: string): string {
    return value

      .replace(/&/g, '&amp;')

      .replace(/</g, '&lt;')

      .replace(/>/g, '&gt;')

      .replace(/"/g, '&quot;')

      .replace(/'/g, '&#039;');
  }
}
