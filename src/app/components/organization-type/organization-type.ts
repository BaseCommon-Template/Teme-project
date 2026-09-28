import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  signal,
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
import { RouterLink } from '@angular/router';
import { OrganisationService, OrganisationTypeMaster } from '../../services/organisation.service';
import { CryptoHelper } from '../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

// =====================================================
// INTERFACE
// =====================================================

export interface OrganizationTypeItem {
  id: number;
  name: string;
  short_code: string;
  description: string;
  type: string;
  is_active: boolean;
  is_postmapping: boolean;
  created_at: string;
  organisations?: any[];
}

// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-organization-type',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './organization-type.html',
  styleUrl: './organization-type.css',
})
export class OrganizationType implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLInputElement>;
  private readonly organisationService = inject(OrganisationService);
  readonly Math = Math;

  rowsPerPage = 20;
  currentPage = 1;
  totalRecords = 0;
  totalPages = 1;

  private gridApi!: GridApi<OrganizationTypeItem>;

  // =====================================================
  // STATE & SIGNALS
  // =====================================================

  readonly searchText = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<OrganizationTypeItem | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly showActiveOnly = signal<boolean>(true);
  readonly showInactive = signal<boolean>(false);

  // =====================================================
  // FORM DATA
  // =====================================================

  formData = {
    id: 0,
    name: '',
    short_code: '',
    description: '',
    type: '',
    is_active: true,
    is_postmapping: false,
  };

  // =====================================================
  // ROW DATA
  // =====================================================

  allOrganisationTypes: OrganizationTypeItem[] = [];
  rowData: OrganizationTypeItem[] = [];

  ngOnInit(): void {
    this.loadOrganisationTypes(1);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
  }

  // =====================================================
  // VIEW COMPUTATION & STATUS FILTER
  // =====================================================

  applyOrganisationTypeView(): void {
    let filtered = [...this.allOrganisationTypes];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.is_active === true);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((item) =>
        [item.name, item.short_code, item.description, item.type].some((val) =>
          String(val ?? '')
            .toLowerCase()
            .includes(search),
        ),
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

  toggleActiveFilter(): void {
    this.showActiveOnly.update((value) => !value);
    this.currentPage = 1;
    this.applyOrganisationTypeView();
  }

  toggleInactiveFilter(): void {
    this.showInactive.update((value) => !value);
    this.currentPage = 1;
    this.applyOrganisationTypeView();
  }

  // =====================================================
  // LOAD FROM API
  // =====================================================

  loadOrganisationTypes(page: number = this.currentPage): void {
    this.isLoading.set(true);

    this.organisationService.getAll(undefined, 1, 1000).subscribe({
      next: (res: any) => {
        const master = res?.OrganisationMaster ?? res;
        const records: OrganisationTypeMaster[] =
          master?.records ??
          res?.records ??
          res?.data?.OrganisationMaster?.records ??
          res?.data?.records ??
          (Array.isArray(master) ? master : []);

        this.allOrganisationTypes = records.map((t: any) => ({
          id: t.organisation_type_id,
          name: t.organisation_type,
          short_code: t.short_name,
          description: t.description || '-',
          type: t.type || '-',
          is_active: t.is_active ?? true,
          is_postmapping:
            t.is_postmapping === true ||
            t.is_postmapping === 'true' ||
            t.is_postmapping === 1 ||
            t.is_post_mapping === true ||
            t.is_post_mapping === 'true' ||
            t.is_post_mapping === 1,
          created_at: this.formatDate(t.createdAt || t.created_at),
          organisations: t.organisations || [],
        }));

        this.applyOrganisationTypeView();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[OrganizationType] Failed to load data:', err);
        this.isLoading.set(false);
        this.allOrganisationTypes = [];
        this.rowData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
      },
    });
  }

  private formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // =====================================================
  // PAGINATION CONTROLS
  // =====================================================

  onRowsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = Number(select.value);

    if (!value) return;

    this.rowsPerPage = value;
    this.currentPage = 1;
    this.applyOrganisationTypeView();
  }

  goToFirstPage(): void {
    if (this.currentPage > 1) {
      this.currentPage = 1;
      this.applyOrganisationTypeView();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyOrganisationTypeView();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyOrganisationTypeView();
    }
  }

  goToLastPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage = this.totalPages;
      this.applyOrganisationTypeView();
    }
  }

  preventNameInvalidCharacters(event: KeyboardEvent): void {
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

    if (!/^[A-Za-z _-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeName(): void {
    this.formData.name = this.formData.name.replace(/[^A-Za-z _-]/g, '').replace(/\s+/g, ' ');
  }

  preventShortNameInvalidCharacters(event: KeyboardEvent): void {
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

    // SHORT NAME: only letters and hyphen
    if (!/^[A-Za-z_-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeShortName(): void {
    this.formData.short_code = this.formData.short_code.replace(/[^A-Za-z_-]/g, '');
  }

  // =====================================================
  // AG GRID COLUMNS
  // =====================================================

  colDefs: ColDef<OrganizationTypeItem>[] = [
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
    {
      field: 'name',
      headerName: 'ORGANIZATION TYPE',
      minWidth: 260,
      flex: 1.25,
      cellRenderer: (params: ICellRendererParams<OrganizationTypeItem>) => {
        return `
          <span style="font-size:12px;color:#333;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;width:100%;">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      field: 'short_code',
      headerName: 'SHORT CODE',
      width: 130,
      minWidth: 110,
      maxWidth: 150,
      cellRenderer: (params: ICellRendererParams<OrganizationTypeItem>) => {
        return `
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:24px;padding:0 9px;border-radius:9px;background:#eff6ff;border:1px solid #dbeafe;color:#2563eb;font-size:11px;font-weight:700;">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      field: 'description',
      headerName: 'DESCRIPTION',
      minWidth: 280,
      flex: 1.5,
      cellRenderer: (params: ICellRendererParams<OrganizationTypeItem>) => {
        return `
          <span style="font-size:12px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;width:100%;" title="${params.value || ''}">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      field: 'type',
      headerName: 'TYPE',
      minWidth: 130,
      flex: 0.7,
      cellRenderer: (params: ICellRendererParams<OrganizationTypeItem>) => {
        return `
          <span style="font-size:12px;color:#333;">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      field: 'is_postmapping',
      headerName: 'POST MAPPING',
      width: 135,
      minWidth: 120,
      maxWidth: 150,
      cellRenderer: (params: ICellRendererParams<OrganizationTypeItem>) => {
        const isPostMapping =
          params.value === true || params.value === 'true' || params.value === 1;
        return `
          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:flex-start;box-sizing:border-box;padding-left:8px;">
            <span style="display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:24px;padding:0 10px;border-radius:12px;background:${isPostMapping ? '#eff6ff' : '#f8fafc'};border:1px solid ${isPostMapping ? '#bfdbfe' : '#e2e8f0'};color:${isPostMapping ? '#1d4ed8' : '#64748b'};font-size:11px;font-weight:700;">
              ${isPostMapping ? 'Yes' : 'No'}
            </span>
          </div>
        `;
      },
    },
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 145,
      minWidth: 130,
      maxWidth: 145,
      cellRenderer: (params: ICellRendererParams<OrganizationTypeItem>) => {
        const isActive = params.value === true;

        return `
          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:flex-start;box-sizing:border-box;padding-left:8px;">
            <span style="display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:76px;height:26px;padding:0 11px;box-sizing:border-box;border-radius:14px;background:${isActive ? '#ecfdf5' : '#fff1f2'};border:1px solid ${isActive ? '#86efac' : '#fda4af'};color:${isActive ? '#059669' : '#e11d48'};font-size:11px;font-weight:600;line-height:1;white-space:nowrap;">
              <span style="width:7px;height:7px;flex-shrink:0;border-radius:50%;background:${isActive ? '#10b981' : '#f43f5e'};"></span>
              <span>${isActive ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
        `;
      },
    },
    {
      headerName: 'ACTIONS',
      width: 150,
      minWidth: 150,
      maxWidth: 150,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params: ICellRendererParams<OrganizationTypeItem>) => {
        const id = params.data?.id;

        return `
          <div style="display:flex;align-items:center;justify-content:flex-start;gap:8px;height:100%;padding-left:4px;box-sizing:border-box;">
            <button class="action-btn edit-btn" data-action="edit" data-id="${id}" title="Edit" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid #dbeafe;border-radius:6px;background:#eff6ff;color:#2563eb;cursor:pointer;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </button>
            <button class="action-btn delete-btn" data-action="delete" data-id="${id}" title="Delete" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid #fee2e2;border-radius:6px;background:#fef2f2;color:#dc2626;cursor:pointer;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6v14H5V6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>
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

  onGridReady(params: GridReadyEvent<OrganizationTypeItem>): void {
    this.gridApi = params.api;
    this.applyOrganisationTypeView();
  }

  onSearchChange(text: string): void {
    this.searchText.set(text);
    this.currentPage = 1;
    this.applyOrganisationTypeView();
  }

  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;
    const button = target?.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const id = Number(button.getAttribute('data-id'));
    const item = this.rowData.find((row) => row.id === id);

    if (!item) return;

    if (action === 'edit') {
      this.openEditModal(item);
    }

    if (action === 'delete') {
      this.confirmDelete(item);
    }
  }

  // =====================================================
  // MODAL ACTIONS
  // =====================================================

  submitted = false;

  openAddModal(): void {
    this.submitted = false;
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.formData = {
      id: 0,
      name: '',
      short_code: '',
      description: '',
      type: '',
      is_active: true,
      is_postmapping: false,
    };
    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
  }

  openEditModal(item: OrganizationTypeItem): void {
    this.submitted = false;
    this.isEditMode.set(true);
    this.selectedItem.set(item);
    this.formData = {
      id: item.id,
      name: item.name,
      short_code: item.short_code,
      description: item.description === '-' ? '' : item.description,
      type: item.type === '-' ? '' : item.type,
      is_active: item.is_active,
      is_postmapping: item.is_postmapping ?? false,
    };
    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
  }

  closeModal(): void {
    this.submitted = false;
    this.isModalOpen.set(false);
  }

  // =====================================================
  // SAVE (API)
  // =====================================================

  saveOrganizationType(): void {
    this.submitted = true;

    const nameRegex = /^[A-Za-z]+(?:[ _-][A-Za-z]+)*$/;
    const shortCodeRegex = /^[A-Za-z]+(?:[_-][A-Za-z]+)*$/;
    if (!this.formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter Organization Type Name.',
      });
      return;
    }

    if (!nameRegex.test(this.formData.name.trim())) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Format',
        text: 'Organization Type Name contains invalid characters.',
      });
      return;
    }

    if (
      this.formData.short_code &&
      this.formData.short_code.trim() &&
      !shortCodeRegex.test(this.formData.short_code.trim())
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Format',
        text: 'Short Code contains invalid characters (2-20 alphanumeric characters allowed).',
      });
      return;
    }

    if (!this.formData.type) {
      Swal.fire({ icon: 'warning', title: 'Required Field', text: 'Please select Type.' });
      return;
    }

    if (this.isEditMode()) {
      const payload = {
        organisation_type_id: this.formData.id,
        organisation_type: this.formData.name.trim(),
        short_name: this.formData.short_code.trim().toUpperCase(),
        description: this.formData.description.trim(),
        type: this.formData.type,
        is_draft: false,
        is_active: this.formData.is_active,
        is_postmapping: this.formData.is_postmapping,
        organisations: this.selectedItem()?.organisations || [],
      };

      this.organisationService.updateOrganisationType(payload).subscribe({
        next: (res: any) => {
          // console.log('[OrganizationType] Update response:', res);
          this.closeModal();

          if (
            res &&
            (res.code === 0 || res.code === '0' || res.status === false || res.status === 0)
          ) {
            Swal.fire({
              icon: 'warning',
              title: res.message || 'Update Failed',
              text: res.message || 'Failed to update organization type.',
              confirmButtonColor: '#1c52a3',
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: 'Updated Successfully',
            text: res?.message || `Organization type "${this.formData.name}" has been updated.`,
            timer: 1600,
            showConfirmButton: false,
          });
          this.loadOrganisationTypes();
        },
        error: (err: any) => {
          console.error('[OrganizationType] Update failed:', err);
          this.closeModal();
          let errMsg = err?.error?.message || err?.message || 'Failed to update organization type.';
          if (err?.error) {
            let errObj = err.error;
            if (typeof errObj === 'string') {
              try {
                const decrypted = CryptoHelper.decrypt(errObj);
                errObj = JSON.parse(decrypted || errObj);
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
    } else {
      const payload = {
        organisation_type: this.formData.name.trim(),
        short_name: this.formData.short_code.trim().toUpperCase(),
        description: this.formData.description.trim(),
        type: this.formData.type,
        is_draft: false,
        is_postmapping: this.formData.is_postmapping,
        is_active: this.formData.is_active,
        organisations: [],
      };

      this.organisationService.addOrganisationType(payload).subscribe({
        next: (res: any) => {
          // console.log('[OrganizationType] Add response:', res);
          this.closeModal();

          if (
            res &&
            (res.code === 0 || res.code === '0' || res.status === false || res.status === 0)
          ) {
            Swal.fire({
              icon: 'warning',
              title: res.message || 'Organisation type already exists',
              text: res.message || 'Organisation type already exists',
              confirmButtonColor: '#1c52a3',
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: 'Created Successfully',
            text: res?.message || `Organization type "${this.formData.name}" has been created.`,
            timer: 1600,
            showConfirmButton: false,
          });
          this.loadOrganisationTypes(1);
        },
        error: (err: any) => {
          console.error('[OrganizationType] Create failed:', err);
          this.closeModal();
          let errMsg = err?.error?.message || err?.message || 'Failed to create organization type.';
          if (err?.error) {
            let errObj = err.error;
            if (typeof errObj === 'string') {
              try {
                const decrypted = CryptoHelper.decrypt(errObj);
                errObj = JSON.parse(decrypted || errObj);
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
  }

  // =====================================================
  // DELETE (API)
  // =====================================================

  confirmDelete(item: OrganizationTypeItem): void {
    Swal.fire({
      title: 'Delete Organization Type?',
      text: `Are you sure you want to delete "${item.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.organisationService.deleteOrganisationType(item.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: `"${item.name}" has been deleted.`,
            timer: 1500,
            showConfirmButton: false,
          });
          this.loadOrganisationTypes();
        },
        error: (err) => {
          console.error('[OrganizationType] Delete failed:', err);
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Failed to delete organization type.',
          });
        },
      });
    });
  }

  // =====================================================
  // EXPORT
  // =====================================================

  exportCsv(): void {
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv({
      fileName: `organization-types_${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }
}
