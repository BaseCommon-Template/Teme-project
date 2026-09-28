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
import { NationalityService } from '../../core/services/nationality';
import { AgGridAngular } from 'ag-grid-angular';

import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from 'ag-grid-community';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CryptoHelper } from '../../helpers/crypto-helper';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface NationalityItem {
  id: number;
  nationality_name: string;
  code: string;
  country: string;
  flag: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-nationality',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './nationality.html',
  styleUrl: './nationality.css',
})
export class Nationality implements OnInit, AfterViewInit {
  private gridApi!: GridApi<NationalityItem>;

  private readonly nationalityService = inject(NationalityService);
  private readonly cdr = inject(ChangeDetectorRef);

  getNationalities(): void {
    this.isLoading.set(true);
    // console.log('========== LOADING NATIONALITIES ==========');

    // console.log('Request Page:', this.currentPage);
    // console.log('Request Page Size:', this.pageSize);

    this.nationalityService.getAll(this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        // console.log('========== NATIONALITY GET ALL RESPONSE ==========');
        // console.log('Full Response:', res);

        try {
          let data: any = res?.data;

          // Encrypted response
          if (typeof data === 'string') {
            const decrypted = CryptoHelper.decrypt(data);

            // console.log('Decrypted Data:', decrypted);

            data = JSON.parse(decrypted);
          }

          const records = Array.isArray(data)
            ? data
            : Array.isArray(data?.records)
              ? data.records
              : [];

          // ===============================
          // BACKEND PAGINATION DATA
          // ===============================

          this.currentPage = Number(data?.page_number ?? this.currentPage);

          this.totalRecords = Number(data?.total_records ?? 0);

          if (data?.record_per_page) {
            this.pageSize = Number(data.record_per_page);
          }

          this.totalPages =
            this.totalRecords > 0 ? Math.ceil(this.totalRecords / this.pageSize) : 0;

          // console.log('========== PAGINATION ==========');
          // console.log('Current Page:', this.currentPage);
          // console.log('Page Size:', this.pageSize);
          // console.log('Total Records:', this.totalRecords);
          // console.log('Total Pages:', this.totalPages);
          // console.log('================================');

          // IMPORTANT:
          // API response ke baad footer ko immediately refresh karo
          this.cdr.detectChanges();

          // ==========================================
          // ROW DATA
          // ==========================================

          this.rowData = records.map((item: any, index: number) => ({
            id: Number(
              item.autonationality_id ?? item.autonationality_id ?? item.id ?? item.Id ?? index + 1,
            ),

            nationality_name:
              item.nationality ??
              item.nationality_name ??
              item.Nationality ??
              item.NationalityName ??
              '',

            code: item.code ?? item.Code ?? '',

            country: item.country ?? item.Country ?? '',

            flag: item.flag ?? item.Flag ?? '🌐',

            description: item.description ?? item.Description ?? '',

            is_active: item.is_active ?? item.IsActive ?? item.isActive ?? false,

            created_at:
              item.createdAt ?? item.created_at ?? item.CreatedAt ?? item.createdDate ?? '',
          }));

          // console.log('Final Nationality Row Data:', this.rowData);

          if (this.gridApi) {
            this.gridApi.setGridOption('rowData', [...this.rowData]);
            this.applyStatusFilter();
          }
          this.isLoading.set(false);
        } catch (error) {
          console.error('Failed to parse nationality response:', error);

          this.rowData = [];
          this.isLoading.set(false);
        }
      },

      error: (error: any) => {
        console.error('Nationality GetAll API Error:', error);
        this.isLoading.set(false);
      },
    });
  }

  @ViewChild('nationalityNameInput')
  nationalityNameInput!: ElementRef<HTMLInputElement>;

  @ViewChild('searchInput')
  searchInput!: ElementRef<HTMLInputElement>;

  submitted = false;

  // =====================================================
  // SERVER SIDE PAGINATION
  // =====================================================

  onPageSizeChange(value: string): void {
    const newPageSize = Number(value);

    if (!newPageSize || newPageSize === this.pageSize) {
      return;
    }

    this.pageSize = newPageSize;
    this.currentPage = 1;

    this.getNationalities();
  }

  goToFirstPage(): void {
    if (this.currentPage === 1) {
      return;
    }

    this.currentPage = 1;
    this.getNationalities();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;
    this.getNationalities();
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;
    this.getNationalities();
  }

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage = this.totalPages;
    this.getNationalities();
  }

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  readonly searchText = signal<string>('');

  readonly isModalOpen = signal<boolean>(false);

  readonly isEditMode = signal<boolean>(false);

  readonly selectedItem = signal<NationalityItem | null>(null);

  // =====================================================
  // FILTER STATES
  // =====================================================

  readonly showActiveOnly = signal<boolean>(true);

  readonly showInactive = signal<boolean>(false);

  readonly isLoading = signal<boolean>(true);

  readonly Math = Math;

  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;
  totalPages = 0;

  // =====================================================
  // FORM MODEL
  // =====================================================

  formData: {
    id: number;
    nationality_name: string;
    code: string;
    country: string;
    flag: string;
    description: string;
    is_active: boolean;
    is_draft: boolean;
  } = {
      id: 0,
      nationality_name: '',
      code: '',
      country: '',
      flag: '🌐',
      description: '',
      is_active: true,
      is_draft: false,
    };

  // =====================================================
  // DUMMY DATA
  // =====================================================

  rowData: NationalityItem[] = [];

  // =====================================================
  // AG GRID COLUMN DEFINITIONS
  // =====================================================

  colDefs: ColDef<NationalityItem>[] = [
    // ---------------------------------------------------
    // SERIAL NUMBER
    // ---------------------------------------------------

    {
      headerName: 'SR. NO.',

      valueGetter: (params) => {
        if (params.node?.rowIndex == null) {
          return '';
        }

        return (this.currentPage - 1) * this.pageSize + params.node.rowIndex + 1;
      },

      width: 100,
      minWidth: 100,
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

    // ---------------------------------------------------
    // NATIONALITY
    // ---------------------------------------------------

    {
      field: 'nationality_name',

      headerName: 'NATIONALITY',

      minWidth: 300,

      flex: 1.35,

      cellRenderer: (params: ICellRendererParams<NationalityItem>) => {
        if (!params.data) {
          return '';
        }

        return `
          <span
            style="
              font-size:12px;
              color:#333;
              white-space:nowrap;
              overflow:hidden;
              text-overflow:ellipsis;
              width:100%;
              display:block;
            "
          >
            ${params.data.nationality_name}
          </span>
        `;
      },
    },

    // ---------------------------------------------------
    // STATUS
    // ---------------------------------------------------

    {
      field: 'is_active',

      headerName: 'STATUS',

      width: 175,

      minWidth: 115,

      maxWidth: 135,

      cellRenderer: (params: ICellRendererParams<NationalityItem>) => {
        const isActive = params.value === true;

        return `
      <div style="
        width:100%;
        height:100%;
        display:flex;
        align-items:center;
        justify-content:flex-start;
        box-sizing:border-box;
        padding-left:8px;
      ">

        <span
          style="
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
          "
        >

          <!-- Status Icon -->
          <span
            style="
              width:7px;
              height:7px;

              flex-shrink:0;

              border-radius:50%;

              background:${isActive ? '#10b981' : '#f43f5e'};
            "
          ></span>

          <span>
            ${isActive ? 'Active' : 'Inactive'}
          </span>

        </span>

      </div>
    `;
      },
    },

    // ---------------------------------------------------
    // CREATED DATE
    // ---------------------------------------------------

    // {
    //   field: 'created_at',

    //   headerName: 'Created Date',

    //   width: 185,

    //   minWidth: 130,

    //   maxWidth: 160,

    //   cellRenderer: (params: ICellRendererParams<NationalityItem>) => {
    //     return `
    //       <span style="
    //         font-size:12px;
    //         color:#555;
    //       ">
    //         ${params.value || '-'}
    //       </span>
    //     `;
    //   },
    // },

    // ---------------------------------------------------
    // ACTIONS
    // ---------------------------------------------------

    {
      headerName: 'ACTIONS',

      width: 150,
      minWidth: 150,
      maxWidth: 150,

      sortable: false,
      filter: false,
      resizable: false,

      cellRenderer: (params: ICellRendererParams<NationalityItem>) => {
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
    this.getNationalities();
  }

  // ngAfterViewInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 100);
  }

  private focusNationalityInput(): void {
    setTimeout(() => {
      this.nationalityNameInput?.nativeElement.focus();
    }, 100);
  }

  onGridReady(params: GridReadyEvent<NationalityItem>): void {
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

  toggleInactiveFilter(): void {
    this.showInactive.update((value) => !value);
    this.applyStatusFilter();
  }

  private applyStatusFilter(): void {
    if (!this.gridApi) {
      return;
    }
    const activeOnly = this.showActiveOnly();
    const inactive = this.showInactive();
    if (activeOnly && !inactive) {
      this.gridApi.setGridOption('isExternalFilterPresent', () => true);
      this.gridApi.setGridOption('doesExternalFilterPass', (node: any) => {
        return node.data?.is_active === true;
      });
    } else if (!activeOnly && inactive) {
      this.gridApi.setGridOption('isExternalFilterPresent', () => true);
      this.gridApi.setGridOption('doesExternalFilterPass', (node: any) => {
        return node.data?.is_active === false;
      });
    } else {
      this.gridApi.setGridOption('isExternalFilterPresent', () => false);
    }

    this.gridApi.onFilterChanged();
  }

  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;

    const button = target?.closest('button');

    if (!button) {
      return;
    }

    const action = button.getAttribute('data-action');

    const id = Number(button.getAttribute('data-id'));

    const item = this.rowData.find((r) => r.id === id);

    if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.confirmDelete(item);
    }
  }

  openAddModal(): void {
    this.isEditMode.set(false);

    this.selectedItem.set(null);

    this.formData = {
      id: 0,

      nationality_name: '',

      code: '',

      country: '',

      flag: '🌐',

      description: '',

      is_active: true,
      is_draft: false,
    };

    this.isModalOpen.set(true);
    this.focusNationalityInput();
  }

  openEditModal(item: NationalityItem): void {
    const payload = {
      autonationality_id: Number(item.id),
    };

    // console.log('========== NATIONALITY GET BY ID ==========');
    // console.log('Payload:', payload);

    this.nationalityService.getById(payload).subscribe({
      next: (res: any) => {
        // console.log('Nationality GetById Response:', res);

        try {
          let data: any = res?.data;

          // ==========================================
          // DECRYPT RESPONSE
          // ==========================================

          if (typeof data === 'string') {
            const decryptedData = CryptoHelper.decrypt(data);

            // console.log('Decrypted GetById Data:', decryptedData);

            data = typeof decryptedData === 'string' ? JSON.parse(decryptedData) : decryptedData;
          }

          // console.log('Final GetById Data:', data);

          // ==========================================
          // EDIT FORM
          // ==========================================

          this.formData = {
            id: Number(item.id),

            // IMPORTANT:
            // Nationality name GetAll ke item se lo
            nationality_name: item.nationality_name ?? '',

            code: item.code ?? '',
            country: item.country ?? '',
            flag: item.flag ?? '🌐',
            description: item.description ?? '',

            is_active: Boolean(item.is_active),

            is_draft: false,
          };

          // console.log('========== EDIT FORM DATA ==========');
          // console.log('Form Data:', this.formData);

          this.isEditMode.set(true);
          this.selectedItem.set(item);
          this.isModalOpen.set(true);
        } catch (error) {
          console.error('GetById decrypt/parse error:', error);

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Unable to read nationality details.',
          });
        }
      },

      error: (error: any) => {
        console.error('GetById API Error:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Unable to fetch nationality details.',
        });
      },
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  preventNationalityNameInvalidCharacters(event: KeyboardEvent): void {
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

    // Only letters, space, underscore and hyphen
    if (!/^[A-Za-z _-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeNationalityName(): void {
    this.formData.nationality_name = this.formData.nationality_name
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  saveNationality(): void {
    this.submitted = true;

    const nationalityName = this.formData.nationality_name.trim();

    // Required validation
    if (!nationalityName) {
      this.focusNationalityInput();
      return;
    }

    // =====================================================
    // EDIT
    // =====================================================

    if (this.isEditMode()) {
      const payload = {
        autonationality_id: Number(this.formData.id),
        nationality: nationalityName,
        is_active: this.formData.is_active,
        is_draft: false,
      };

      // console.log('========== NATIONALITY UPDATE ==========');
      // console.log('Update Payload:', payload);

      this.nationalityService.update(payload).subscribe({
        next: (res: any) => {
          // console.log('Nationality Update Response:', res);
          this.closeModal();

          if (
            res &&
            (res.code === 0 || res.code === '0' || res.status === false || res.status === 0)
          ) {
            Swal.fire({
              icon: 'warning',
              title: res.message || 'Update Failed',
              text: res.message || 'Unable to update Nationality.',
              confirmButtonColor: '#1c52a3',
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: 'Updated Successfully',
            text: res?.message || `Nationality "${nationalityName}" has been updated.`,
            timer: 1800,
            showConfirmButton: false,
          });

          this.getNationalities();
        },

        error: (error: any) => {
          console.error('Nationality Update API Error:', error);
          this.closeModal();
          let errMsg = error?.error?.message || error?.message || 'Unable to update Nationality.';
          if (error?.error) {
            let errObj = error.error;
            if (typeof errObj === 'string') {
              try {
                const decrypted = CryptoHelper.decrypt(errObj);
                errObj = JSON.parse(decrypted || errObj);
              } catch (e) { }
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

    const payload = {
      nationality: nationalityName,
      is_draft: false,
    };

    // console.log('========== NATIONALITY ADD ==========');
    // console.log('Add Payload:', payload);

    this.nationalityService.add(payload).subscribe({
      next: (res: any) => {
        // console.log('Nationality Add Response:', res);
        this.closeModal();

        if (
          res &&
          (res.code === 0 || res.code === '0' || res.status === false || res.status === 0)
        ) {
          Swal.fire({
            icon: 'warning',
            title: res.message || 'Nationality already exists',
            text: res.message || 'Nationality already exists',
            confirmButtonColor: '#1c52a3',
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Added Successfully',
          text: res?.message || `Nationality "${nationalityName}" has been created.`,
          timer: 1800,
          showConfirmButton: false,
        });

        this.getNationalities();
      },

      error: (error: any) => {
        console.error('Nationality Add API Error:', error);
        this.closeModal();
        let errMsg = error?.error?.message || error?.message || 'Unable to add Nationality.';
        if (error?.error) {
          let errObj = error.error;
          if (typeof errObj === 'string') {
            try {
              const decrypted = CryptoHelper.decrypt(errObj);
              errObj = JSON.parse(decrypted || errObj);
            } catch (e) { }
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

  confirmDelete(item: NationalityItem): void {
    Swal.fire({
      title: 'Delete Nationality?',
      text: `Are you sure you want to delete "${item.nationality_name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      // =====================================================
      // DELETE API PAYLOAD
      // =====================================================

      const payload = {
        autonationality_id: Number(item.id),
      };

      // console.log('========== NATIONALITY DELETE ==========');
      // console.log('Delete Payload:', payload);

      this.nationalityService.delete(payload).subscribe({
        next: (res: any) => {
          // console.log('Nationality Delete Response:', res);

          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: `"${item.nationality_name}" has been removed.`,
            timer: 1500,
            showConfirmButton: false,
          });

          // DB se fresh data reload
          this.getNationalities();
        },

        error: (error: any) => {
          console.error('Nationality Delete API Error:', error);

          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Unable to delete Nationality.',
          });
        },
      });
    });
  }

  exportCsv(): void {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `nationalities_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  }

  get totalCount(): number {
    return this.rowData.length;
  }

  get activeCount(): number {
    return this.rowData.filter((r) => r.is_active).length;
  }

  get inactiveCount(): number {
    return this.rowData.filter((r) => !r.is_active).length;
  }
}
