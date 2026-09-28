import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
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
import { RoleApiService, RoleApiPayload, RoleRecord } from '../../services/role-api.service';

ModuleRegistry.registerModules([AllCommunityModule]);

// =====================================================
// INTERFACE
// =====================================================

export interface RoleItem {
  id: number;
  role_id: number;
  role_name: string;
  priority: number;
  status: boolean;
  otp: boolean;
  ip: boolean;
  entry_date: string;
}

// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './role-management.html',
  styleUrl: './role-management.css',
})
export class RoleManagement implements OnInit, AfterViewInit {
  private readonly roleApiService = inject(RoleApiService);
  private gridApi!: GridApi<RoleItem>;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLInputElement>;

  Math = Math;
  readonly isLoading = signal<boolean>(false);

  // =====================================================
  // SEARCH & FILTERS
  // =====================================================

  readonly searchText = signal<string>('');
  readonly showActiveOnly = signal<boolean>(true);

  // =====================================================
  // PAGINATION
  // =====================================================

  currentPage = 1;
  pageSize = 25;
  totalRecords = 0;
  totalPages = 0;

  // =====================================================
  // MODAL & FORM
  // =====================================================

  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<RoleItem | null>(null);

  submitted = false;

  formData = {
    id: 0,
    role_id: 0,
    role_name: '',
    priority: 1,
    status: true,
    otp: false,
    ip: false,
  };

  // =====================================================
  // DATA
  // =====================================================

  allRoles: RoleItem[] = [];

  rowData: RoleItem[] = [];

  ngOnInit(): void {
    this.applyRoleView();
    this.loadRolesFromApi();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
  }

  /**
   * Load roles using API GET /api/Role/GetRoles with RoleId: 0 (encrypted payload & decrypted response)
   */
  loadRolesFromApi(): void {
    this.isLoading.set(true);
    // console.log('[RoleManagement] Invoking getRoles(0)...');

    this.roleApiService.getRoles(0).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        // console.log('[RoleManagement] Decrypted GetRoles(0) response:', res);
        this.processRolesResponse(res);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('[RoleManagement] Error loading roles from API:', err);
      },
    });
  }

  /**
   * Helper to map raw API role array/object into AG Grid rows
   */
  private processRolesResponse(res: any): void {
    let list: any[] = [];

    if (Array.isArray(res)) {
      list = res;
    } else if (res && typeof res === 'object') {
      list = res.records || res.roles || res.data || res.dataResult || res.result || [];
      if (!Array.isArray(list) && (res.RoleId || res.role_id || res.roleId)) {
        list = [res];
      }
    }

    if (Array.isArray(list) && list.length > 0) {
      const mappedRows: RoleItem[] = list.map((item: RoleRecord, index: number) => {
        const roleId = Number(item.RoleId ?? item.role_id ?? item.roleId ?? index + 1);
        const roleName = String(item.RoleName ?? item.role_name ?? item.roleName ?? '');
        const priority = Number(item.Priority ?? item.priority ?? 1);
        const isActive =
          item.IsActive !== undefined
            ? Boolean(item.IsActive)
            : item.is_active !== undefined
              ? Boolean(item.is_active)
              : item['status'] !== undefined
                ? Boolean(item['status'])
                : true;
        const otpVal =
          item.OtpBased ?? item.otp_based ?? item.otpBased ?? (item['otp'] ? 'Y' : 'N');
        const ipVal = item.IpBased ?? item.ip_based ?? item.ipBased ?? (item['ip'] ? 'Y' : 'N');
        const entryDate =
          item.EntryDate ||
          item.entry_date ||
          item.entryDate ||
          new Date().toLocaleDateString('en-GB');

        return {
          id: index + 1,
          role_id: roleId,
          role_name: roleName,
          priority: priority,
          status: isActive,
          otp: String(otpVal).toUpperCase() === 'Y' || String(otpVal) === 'true',
          ip: String(ipVal).toUpperCase() === 'Y' || String(ipVal) === 'true',
          entry_date: String(entryDate),
        };
      });

      this.allRoles = mappedRows;
      this.applyRoleView();
    }
  }

  // =====================================================
  // GRID COLUMNS
  // =====================================================

  colDefs: ColDef<RoleItem>[] = [
    // ---------------------------------------------------
    // SR NO
    // ---------------------------------------------------
    {
      headerName: 'SR. NO.',
      width: 75,
      minWidth: 70,
      maxWidth: 85,
      sortable: false,
      filter: false,
      resizable: false,
      valueGetter: (params) =>
        (params.node?.rowIndex ?? 0) + 1 + (this.currentPage - 1) * this.pageSize,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#333',
      },
    },

    // ---------------------------------------------------
    // ROLE ID
    // ---------------------------------------------------
    {
      field: 'role_id',
      headerName: 'ROLE ID',
      width: 120,
      minWidth: 100,
      flex: 0.6,
      cellRenderer: (params: ICellRendererParams<RoleItem>) => {
        return `
          <span class="user-text user-id-text">
            ${params.value ?? '-'}
          </span>
        `;
      },
    },

    // ---------------------------------------------------
    // ROLE NAME
    // ---------------------------------------------------
    {
      field: 'role_name',
      headerName: 'ROLE NAME',
      minWidth: 200,
      flex: 1.3,
      cellRenderer: (params: ICellRendererParams<RoleItem>) => {
        return `
          <span class="user-text user-name-text">
            ${params.value || '-'}
          </span>
        `;
      },
    },

    // ---------------------------------------------------
    // PRIORITY
    // ---------------------------------------------------
    {
      field: 'priority',
      headerName: 'PRIORITY',
      width: 120,
      minWidth: 100,
      flex: 0.6,
      cellRenderer: (params: ICellRendererParams<RoleItem>) => {
        return `
          <span style="width:26px; height:26px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; background:#f1f5f9; color:#29466b; font-size:11px; font-weight:700;">
            ${params.value ?? '-'}
          </span>
        `;
      },
    },

    // ---------------------------------------------------
    // OTP
    // ---------------------------------------------------
    {
      field: 'otp',
      headerName: 'OTP',
      width: 90,
      minWidth: 80,
      maxWidth: 100,
      cellRenderer: (params: ICellRendererParams<RoleItem>) => {
        const enabled = params.value === true;
        return `
          <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:22px; border-radius:10px; background:${enabled ? '#eff6ff' : '#f8fafc'}; border:1px solid ${enabled ? '#bfdbfe' : '#e2e8f0'}; color:${enabled ? '#2563eb' : '#64748b'}; font-size:11px; font-weight:700;">
            ${enabled ? 'Y' : 'N'}
          </span>
        `;
      },
    },

    // ---------------------------------------------------
    // IP
    // ---------------------------------------------------
    {
      field: 'ip',
      headerName: 'IP',
      width: 90,
      minWidth: 80,
      maxWidth: 100,
      cellRenderer: (params: ICellRendererParams<RoleItem>) => {
        const enabled = params.value === true;
        return `
          <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:22px; border-radius:10px; background:${enabled ? '#eff6ff' : '#f8fafc'}; border:1px solid ${enabled ? '#bfdbfe' : '#e2e8f0'}; color:${enabled ? '#2563eb' : '#64748b'}; font-size:11px; font-weight:700;">
            ${enabled ? 'Y' : 'N'}
          </span>
        `;
      },
    },

    // ---------------------------------------------------
    // STATUS
    // ---------------------------------------------------
    {
      field: 'status',
      headerName: 'STATUS',
      minWidth: 140,
      flex: 0.8,
      cellRenderer: (params: ICellRendererParams<RoleItem>) => {
        const active = params.value === true;
        return `
          <div class="status-cell">
            <span class="user-status-pill ${active ? 'active' : 'inactive'}">
              <span class="status-dot"></span>
              <span>${active ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
        `;
      },
    },

    // ---------------------------------------------------
    // ACTIONS
    // ---------------------------------------------------
    {
      headerName: 'ACTIONS',
      width: 100,
      minWidth: 95,
      maxWidth: 110,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params: ICellRendererParams<RoleItem>) => {
        const id = params.data?.id;

        return `
          <div class="action-buttons">
            <button
              type="button"
              class="action-edit"
              data-action="edit"
              data-id="${id}"
              title="Edit Role"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
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

  rowHeight = 38;
  headerHeight = 30;

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
    flex: 0,
  };

  onGridReady(params: GridReadyEvent<RoleItem>): void {
    this.gridApi = params.api;
    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', [...this.rowData]);
    }
  }

  // =====================================================
  // SEARCH & PAGINATION & FILTER METHODS
  // =====================================================

  onSearchChange(text: string): void {
    this.searchText.set(text);
    this.currentPage = 1;
    this.applyRoleView();
  }

  clearSearch(): void {
    this.onSearchChange('');
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((value) => !value);
    this.currentPage = 1;
    this.applyRoleView();
  }

  onPageSizeChange(size: number | string): void {
    this.pageSize = Number(size) || 25;
    this.currentPage = 1;
    this.applyRoleView();
  }

  goToFirstPage(): void {
    if (this.currentPage > 1) {
      this.currentPage = 1;
      this.applyRoleView();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyRoleView();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyRoleView();
    }
  }

  goToLastPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage = this.totalPages;
      this.applyRoleView();
    }
  }

  private applyRoleView(): void {
    let filtered = [...this.allRoles];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.status);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((item) =>
        [item.role_id, item.role_name, item.priority, item.entry_date].some((val) =>
          String(val ?? '')
            .toLowerCase()
            .includes(search),
        ),
      );
    }

    this.totalRecords = filtered.length;
    this.totalPages = this.totalRecords > 0 ? Math.ceil(this.totalRecords / this.pageSize) : 0;

    if (this.totalPages > 0 && this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.totalPages === 0) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.rowData = filtered.slice(start, start + this.pageSize);

    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', [...this.rowData]);
    }
  }

  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;
    const button = target?.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const id = Number(button.getAttribute('data-id'));
    const item =
      this.allRoles.find((row) => row.id === id) || this.rowData.find((row) => row.id === id);

    if (!item && action !== 'getbyid') return;

    if (action === 'getbyid') {
      const roleId = Number(button.getAttribute('data-roleid')) || item?.role_id || 0;
      this.fetchRoleByIdApi(roleId);
    } else if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.confirmDelete(item);
    } else if (action === 'logs' && item) {
      this.showLogs(item);
    }
  }

  /**
   * Call /api/Role/GetRoles with RoleId specified (Get By ID)
   */
  fetchRoleByIdApi(roleId: number): void {
    Swal.fire({
      title: 'Encrypting Payload & Calling API...',
      text: `Fetching Role details for RoleId: ${roleId}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.roleApiService.getRoles(roleId).subscribe({
      next: (res) => {
        Swal.close();
        // console.log(`[RoleManagement] GetRoles(${roleId}) response:`, res);

        Swal.fire({
          icon: 'info',
          title: `Decrypted Role Details (ID: ${roleId})`,
          html: `<pre style="text-align:left; background:#f8fafc; padding:10px; border-radius:6px; font-size:12px; max-height:250px; overflow:auto;">${JSON.stringify(res, null, 2)}</pre>`,
          confirmButtonText: 'OK',
        });
      },
      error: (err) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'API Call Failed',
          text: `Failed to fetch Role ID ${roleId}: ${err?.message || 'Server error'}`,
        });
      },
    });
  }

  // =====================================================
  // ADD & EDIT MODAL
  // =====================================================

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.submitted = false;

    this.formData = {
      id: 0,
      role_id: 0,
      role_name: '',
      priority: 1,
      status: true,
      otp: false,
      ip: false,
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
  }

  openEditModal(item: RoleItem): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);
    this.submitted = false;

    this.formData = {
      id: item.id,
      role_id: item.role_id,
      role_name: item.role_name,
      priority: item.priority,
      status: item.status,
      otp: item.otp,
      ip: item.ip,
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.submitted = false;
  }

  preventRoleNameInvalidCharacters(event: KeyboardEvent): void {
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

  sanitizeRoleName(): void {
    this.formData.role_name = this.formData.role_name
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  // =====================================================
  // SAVE ROLE (Calls API with AES Encrypted Payload)
  // =====================================================

  saveRole(): void {
    this.submitted = true;

    if (!this.formData.role_name.trim()) {
      return;
    }

    if (!this.formData.priority || this.formData.priority < 1) {
      return;
    }

    const action = this.isEditMode() ? 'Update' : 'Add';
    const roleIdToSend = this.isEditMode() ? this.formData.role_id : 0;

    const payload: RoleApiPayload = {
      Action: action,
      RoleId: roleIdToSend,
      RoleName: this.formData.role_name.trim(),
      EntryDate: null,
      IsActive: this.formData.status,
      Priority: Number(this.formData.priority),
      OtpBased: this.formData.otp ? 'Y' : 'N',
      IpBased: this.formData.ip ? 'Y' : 'N',
    };

    Swal.fire({
      title: 'Encrypting Payload & Sending...',
      text: `Posting to api/Role/AddUpdateRole (${action})`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.roleApiService.addUpdateRole(payload).subscribe({
      next: (res) => {
        Swal.close();
        // console.log('[RoleManagement] AddUpdateRole response:', res);

        // Update local table data
        if (this.isEditMode()) {
          this.allRoles = this.allRoles.map((item) => {
            if (item.id !== this.formData.id) return item;
            return {
              ...item,
              role_name: this.formData.role_name.trim(),
              priority: Number(this.formData.priority),
              status: this.formData.status,
              otp: this.formData.otp,
              ip: this.formData.ip,
            };
          });
        } else {
          const newId = this.allRoles.length
            ? Math.max(...this.allRoles.map((item) => item.id)) + 1
            : 1;
          const returnedRoleId =
            Number(res?.RoleId ?? res?.role_id ?? res?.roleId ?? 0) ||
            Math.max(...this.allRoles.map((item) => item.role_id), 0) + 1;

          const newItem: RoleItem = {
            id: newId,
            role_id: returnedRoleId,
            role_name: this.formData.role_name.trim(),
            priority: Number(this.formData.priority),
            status: this.formData.status,
            otp: this.formData.otp,
            ip: this.formData.ip,
            entry_date: new Date().toLocaleDateString('en-GB'),
          };

          this.allRoles = [newItem, ...this.allRoles];
        }

        this.applyRoleView();
        this.closeModal();

        Swal.fire({
          icon: 'success',
          title: `${action} Successful`,
          text: `Role "${this.formData.role_name}" saved `,
          timer: 2000,
          showConfirmButton: false,
        });
      },
      error: (err) => {
        Swal.close();
        console.error('[RoleManagement] AddUpdateRole error:', err);

        // Fallback update so UI remains functional even if offline/backend fails
        if (this.isEditMode()) {
          this.allRoles = this.allRoles.map((item) => {
            if (item.id !== this.formData.id) return item;
            return {
              ...item,
              role_name: this.formData.role_name.trim(),
              priority: Number(this.formData.priority),
              status: this.formData.status,
              otp: this.formData.otp,
              ip: this.formData.ip,
            };
          });
        } else {
          const newId = this.allRoles.length
            ? Math.max(...this.allRoles.map((item) => item.id)) + 1
            : 1;
          const newRoleId = this.allRoles.length
            ? Math.max(...this.allRoles.map((item) => item.role_id)) + 1
            : 1;

          const newItem: RoleItem = {
            id: newId,
            role_id: newRoleId,
            role_name: this.formData.role_name.trim(),
            priority: Number(this.formData.priority),
            status: this.formData.status,
            otp: this.formData.otp,
            ip: this.formData.ip,
            entry_date: new Date().toLocaleDateString('en-GB'),
          };

          this.allRoles = [newItem, ...this.allRoles];
        }

        this.applyRoleView();
        this.closeModal();

        Swal.fire({
          icon: 'warning',
          title: 'Encrypted Request Sent (API Notice)',
          text: `Encrypted request was sent. Local table updated. Note: ${err?.message || 'Server error or CORS on staging endpoint'}`,
        });
      },
    });
  }

  showLogs(item: RoleItem): void {
    Swal.fire({
      title: `${item.role_name} Logs`,
      html: `
        <div style="text-align:left; font-size:13px; line-height:1.7;">
          <strong>Role ID:</strong> ${item.role_id}<br>
          <strong>Created:</strong> ${item.entry_date}<br>
          <strong>Status:</strong> ${item.status ? 'ACTIVE' : 'INACTIVE'}<br>
          <strong>OTP:</strong> ${item.otp ? 'Enabled' : 'Disabled'}<br>
          <strong>IP:</strong> ${item.ip ? 'Enabled' : 'Disabled'}
        </div>
      `,
      confirmButtonText: 'Close',
    });
  }

  confirmDelete(item: RoleItem): void {
    Swal.fire({
      title: 'Delete Role?',
      text: `Are you sure you want to delete "${item.role_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.allRoles = this.allRoles.filter((row) => row.id !== item.id);
      this.applyRoleView();

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: `"${item.role_name}" has been removed.`,
        timer: 1500,
        showConfirmButton: false,
      });
    });
  }

  exportCsv(): void {
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv({
      fileName: `roles_${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }
}
