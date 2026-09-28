import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  ChangeDetectorRef,
  HostListener,
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
  CellClickedEvent,
} from 'ag-grid-community';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {
  UserManagementService,
  UserApiItem,
  UserRoleOption,
} from '../../core/services/user-management';
import { CryptoHelper } from '../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface UserItem {
  id: number;
  userId: string;
  name: string;
  designation: string;
  rank: string;
  role: string;
  roleIds: number[];
  email: string;
  phone: string;
  organization_type: string;
  organization: string;
  is_active: boolean;
  created_at: string;
}

interface UserFormData {
  id: number | string;
  userId: string;
  username: string;
  role: string;
  roleId: number | string;

  // Multiple selected roles
  roleIds: number[];

  name: string;
  rank: string;
  designation: string;
  email: string;
  phone: string;
  password: string;
  oldPassword?: string;
  organization_type: string;
  organization: string;
  is_active: boolean;
}

export interface UserAccessRole {
  roleid: number;
  rolename: string;
  priority: number;
  ip_based: 'Y' | 'N';
  otp_based: 'Y' | 'N';
  isactive: boolean;
}

export interface UserAccessInfo {
  userid: string;
  ip: string;
  roles: UserAccessRole[];
}

@Component({
  selector: 'app-usersmanagement',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './usersmanagement.html',
  styleUrl: './usersmanagement.css',
})
export class Usersmanagement implements OnInit, AfterViewInit {
  private readonly userService = inject(UserManagementService);
  private readonly cdr = inject(ChangeDetectorRef);

  private gridApi!: GridApi<UserItem>;

  @ViewChild('searchInput')
  searchInput!: ElementRef<HTMLInputElement>;

  @ViewChild('firstFormInput')
  firstFormInput!: ElementRef<HTMLInputElement>;

  Math = Math;
  Number = Number;

  // =====================================================
  // DATA
  // =====================================================

  allUsers: UserItem[] = [];
  rowData: UserItem[] = [];

  roleOptions: UserRoleOption[] = [];
  organizationTypes: any[] = [];
  organizations: any[] = [];
  allOrganizationRecords: any[] = [];
  selectedOrganizationType = '';
  roleSearchText = '';
  roleDropdownOpen = false;

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  readonly searchText = signal<string>('');
  readonly showActiveOnly = signal<boolean>(true);

  // =====================================================
  // MODAL
  // =====================================================

  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedUser = signal<UserItem | null>(null);
  readonly isLoading = signal<boolean>(true);

  readonly isAccessModalOpen = signal<boolean>(false);
  readonly accessUser = signal<UserItem | null>(null);

  accessUserIp = '';

  accessRoleSettings: Array<{
    roleId: number;
    roleName: string;
    priority: number;
    otpBased: boolean;
    ipBased: boolean;
    isActive: boolean;
  }> = [];

  // =====================================================
  // PAGINATION
  // =====================================================

  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;
  totalPages = 0;

  // =====================================================
  // GRID
  // =====================================================

  rowHeight = 38;
  headerHeight = 30;

  // =====================================================
  // FORM
  // =====================================================

  submitted = false;
  showPassword = false;
  showOldPassword = false;

  formData: UserFormData = this.getEmptyForm();

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Agar click Role dropdown ke andar hua hai
    // to dropdown open hi rahega
    if (target.closest('.role-multiselect')) {
      return;
    }

    this.roleDropdownOpen = false;
    this.roleSearchText = '';
  }

  private getEmptyForm(): UserFormData {
    return {
      id: '',
      userId: '',
      username: '',
      role: '',
      roleId: '',
      roleIds: [],
      name: '',
      rank: '',
      designation: '',
      email: '',
      phone: '',
      password: '',
      oldPassword: '',
      organization_type: '',
      organization: '',
      is_active: true,
    };
  }

  // =====================================================
  // INIT / FOCUS
  // =====================================================

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
    this.loadOrganizations();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 100);
  }

  private focusFirstFormInput(): void {
    setTimeout(() => {
      this.firstFormInput?.nativeElement.focus();
    }, 100);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleOldPasswordVisibility(): void {
    this.showOldPassword = !this.showOldPassword;
  }

  // =====================================================
  // GRID READY
  // =====================================================

  onGridReady(params: GridReadyEvent<UserItem>): void {
    this.gridApi = params.api;

    if (this.searchText()) {
      this.gridApi.setGridOption('quickFilterText', this.searchText());
    }
  }

  // =====================================================
  // COLUMN DEFINITIONS
  // =====================================================

  colDefs: ColDef<UserItem>[] = [
    {
      headerName: 'SR. NO.',
      width: 70,
      minWidth: 70,
      maxWidth: 80,
      sortable: false,
      filter: false,
      valueGetter: (params) =>
        (params.node?.rowIndex ?? 0) + 1 + (this.currentPage - 1) * this.pageSize,
    },

    {
      field: 'userId',
      headerName: 'USER ID',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<UserItem>) => `
        <span class="user-text user-id-text">${this.escapeHtml(params.value ?? '-')}</span>
      `,
    },

    {
      field: 'name',
      headerName: 'NAME',
      flex: 1.4,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<UserItem>) => `
        <span class="user-text user-name-text">${this.escapeHtml(params.value ?? '-')}</span>
      `,
    },

    {
      field: 'designation',
      headerName: 'DESIGNATION',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<UserItem>) => `
        <span class="user-designation">${this.escapeHtml(params.value ?? '-')}</span>
      `,
    },

    {
      field: 'rank',
      headerName: 'RANK',
      flex: 0.9,
      minWidth: 130,
      sortable: true,
      filter: true,
      valueGetter: (params) => params.data?.rank || '-',
    },

    {
      field: 'role',
      headerName: 'ROLE',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<UserItem>) => `
        <span class="user-role-pill">${this.escapeHtml(params.value ?? '-')}</span>
      `,
    },

    {
      field: 'email',
      headerName: 'EMAIL',
      flex: 1.5,
      minWidth: 230,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<UserItem>) => `
        <span class="user-text ellipsis" title="${this.escapeHtml(params.value ?? '')}">
          ${this.escapeHtml(params.value ?? '-')}
        </span>
      `,
    },

    {
      field: 'phone',
      headerName: 'PHONE',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
      valueGetter: (params) => params.data?.phone || '-',
    },

    {
      field: 'organization_type',
      headerName: 'ORGANIZATION TYPE',
      flex: 1.15,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<UserItem>) => `
        <span class="user-text ellipsis">${this.escapeHtml(params.value ?? '-')}</span>
      `,
    },

    {
      field: 'organization',
      headerName: 'ORGANIZATION',
      flex: 1.2,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<UserItem>) => `
        <span class="user-text ellipsis">${this.escapeHtml(params.value ?? '-')}</span>
      `,
    },

    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 120,
      minWidth: 115,
      maxWidth: 130,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<UserItem>) => {
        const active = this.toBoolean(params.value);

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

    {
      headerName: 'ACTIONS',
      width: 150,
      minWidth: 150,
      maxWidth: 250,
      sortable: false,
      filter: false,

      cellRenderer: (params: ICellRendererParams<UserItem>) => {
        return `
      <div class="action-buttons">

      <button
  type="button"
  class="action-edit"
  data-action="access"
  title="IP Access"
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
    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    <circle cx="12" cy="16" r="1"></circle>
  </svg>
</button>

        <button
          type="button"
          class="action-edit"
          data-action="edit"
          title="Edit User"
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

        <button
          type="button"
          class="action-delete"
          data-action="delete"
          title="Delete User"
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
            <path d="M10 11v5"></path>
            <path d="M14 11v5"></path>
          </svg>
        </button>

      </div>
    `;
      },
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
    flex: 0,
  };

  // =====================================================
  // GET USERS
  // =====================================================

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getAllUsers().subscribe({
      next: (res: any) => {
        try {
          // console.log('========== USERS GET ALL RESPONSE ==========');
          // console.log('Full Response:', res);

          const data = this.parseApiData(res);

          // console.log('========== DECRYPTED ORGANISATION DATA ==========');
          // console.log(data);

          const records = this.extractOrganizationArray(data);

          // console.log('Organisation Records:', records);

          this.allUsers = records.map((item: UserApiItem, index: number) =>
            this.mapUser(item, index),
          );

          this.currentPage = 1;
          this.applyUserView();

          // console.log('Final Users:', this.allUsers);
          this.isLoading.set(false);
        } catch (error) {
          console.error('Failed to parse Users response:', error);
          this.allUsers = [];
          this.rowData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }
      },

      error: (error: any) => {
        console.error('Users GetAll API Error:', error);

        this.allUsers = [];
        this.rowData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.isLoading.set(false);

        Swal.fire({
          icon: 'error',
          title: 'Unable to Load Users',
          text: this.getApiErrorMessage(error, 'Unable to load users.'),
        });
      },
    });
  }

  // =====================================================
  // LOAD ACTIVE ROLES
  // =====================================================

  loadRoles(): void {
    this.userService.getAllRoles().subscribe({
      next: (res: any) => {
        try {
          // console.log('========== ROLES GET ALL RESPONSE ==========');
          // console.log('Full Role Response:', res);

          const data = this.parseApiData(res);

          // console.log('========== DECRYPTED ROLE DATA ==========');
          // console.log(data);

          const roles = this.extractArray(data);

          // console.log('Role Records:', roles);

          this.roleOptions = roles
            .filter((role: any) => {
              const isActive =
                role.IsActive ??
                role.isActive ??
                role.isactive ??
                role.is_active ??
                role.Active ??
                role.active;

              return this.toBoolean(isActive);
            })
            .map((role: any) => ({
              roleid: Number(role.RoleId ?? role.roleid ?? role.roleId ?? 0),

              rolename: String(role.RoleName ?? role.rolename ?? role.roleName ?? role.name ?? ''),

              isactive: true,
            }))
            .filter((role: UserRoleOption) => role.roleid > 0 && !!role.rolename);

          // console.log('========== ACTIVE ROLE OPTIONS ==========');
          // console.log(this.roleOptions);

          this.cdr.detectChanges();
        } catch (error) {
          console.error('Failed to parse Roles response:', error);

          this.roleOptions = [];
          this.cdr.detectChanges();
        }
      },

      error: (error: any) => {
        console.error('Role API Error:', error);

        this.roleOptions = [];

        this.cdr.detectChanges();
      },
    });
  }

  // =====================================================
  // ROLE MULTI SELECT
  // =====================================================

  get filteredRoleOptions(): UserRoleOption[] {
    const search = this.roleSearchText.trim().toLowerCase();

    if (!search) {
      return this.roleOptions;
    }

    return this.roleOptions.filter((role) => role.rolename.toLowerCase().includes(search));
  }

  toggleRoleDropdown(): void {
    this.roleDropdownOpen = !this.roleDropdownOpen;

    if (!this.roleDropdownOpen) {
      this.roleSearchText = '';
    }
  }

  isRoleSelected(roleId: number): boolean {
    return this.formData.roleIds.includes(roleId);
  }

  toggleRole(role: UserRoleOption): void {
    const roleId = Number(role.roleid);

    const index = this.formData.roleIds.indexOf(roleId);

    if (index > -1) {
      // Remove role
      this.formData.roleIds.splice(index, 1);
    } else {
      // Add role
      this.formData.roleIds.push(roleId);
    }

    // Trigger Angular change detection for ngModel/UI
    this.formData.roleIds = [...this.formData.roleIds];

    this.updateSelectedRoles();

    // Clear search after selection
    this.roleSearchText = '';
  }

  removeRole(roleId: number): void {
    this.formData.roleIds = this.formData.roleIds.filter((id) => id !== roleId);

    this.updateSelectedRoles();
  }

  updateSelectedRoles(): void {
    const selectedRoles = this.roleOptions.filter((role) =>
      this.formData.roleIds.includes(Number(role.roleid)),
    );

    this.formData.role = selectedRoles.map((role) => role.rolename).join(', ');
  }

  getRoleName(roleId: number): string {
    return this.roleOptions.find((role) => Number(role.roleid) === Number(roleId))?.rolename ?? '';
  }

  loadOrganizations(): void {
    this.userService.getAllOrganizations().subscribe({
      next: (res: any) => {
        // console.log('========== ORGANISATION GET ALL ==========');
        // console.log('Full Response:', res);

        try {
          const data = this.parseApiData(res);

          // console.log('========== DECRYPTED ORGANISATION DATA ==========');
          // console.log(data);

          const master = data?.OrganisationMaster;

          if (!master || !Array.isArray(master.records)) {
            console.error('OrganisationMaster.records not found', data);

            this.allOrganizationRecords = [];
            this.organizationTypes = [];
            this.organizations = [];
            return;
          }

          const records = master.records;

          // console.log('Organisation Records:', records);

          // Complete API records
          this.allOrganizationRecords = records;

          // ================================
          // ORGANIZATION TYPES
          // ================================

          this.organizationTypes = records
            .filter((item: any) => {
              const isActive =
                item.IsActive ??
                item.isActive ??
                item.isactive ??
                item.is_active ??
                item.Active ??
                item.active;

              return (
                item.organisation_type_id != null &&
                item.organisation_type &&
                this.toBoolean(isActive)
              );
            })
            .map((item: any) => ({
              organization_type_id: Number(item.organisation_type_id),
              organization_type: String(item.organisation_type),
            }));

          // console.log('Organization Types:', this.organizationTypes);

          // Initially organization empty
          this.organizations = [];

          this.cdr.detectChanges();
        } catch (error) {
          console.error('Failed to parse organisation response:', error);

          this.allOrganizationRecords = [];
          this.organizationTypes = [];
          this.organizations = [];
        }
      },

      error: (error: any) => {
        console.error('Organisation GetAll API Error:', error);

        this.allOrganizationRecords = [];
        this.organizationTypes = [];
        this.organizations = [];
      },
    });
  }

  onOrganizationTypeChange(typeId: string | number): void {
    // console.log('Selected Organization Type ID:', typeId);

    // Pehle organization clear
    this.formData.organization = '';
    this.organizations = [];

    if (!typeId) {
      return;
    }

    const selectedTypeId = Number(typeId);

    // console.log('Selected Organization Type ID Number:', selectedTypeId);

    const selectedType = this.allOrganizationRecords.find(
      (item: any) => Number(item.organisation_type_id) === selectedTypeId,
    );

    // console.log('Selected Organization Type Record:', selectedType);

    if (!selectedType) {
      console.warn('Organization Type record not found:', selectedTypeId);
      return;
    }

    // =================================================
    // API RESPONSE:
    // organisations: [...]
    // =================================================

    this.organizations = Array.isArray(selectedType.organisations)
      ? selectedType.organisations
      : Array.isArray(selectedType.organizations)
        ? selectedType.organizations
        : [];

    // console.log('Organizations for selected type:', this.organizations);

    this.cdr.detectChanges();
  }

  // =====================================================
  // CONDITIONAL ORGANIZATION FIELDS
  // =====================================================

  hasRole12(): boolean {
    return this.formData.roleIds.includes(12);
  }

  hasRole13(): boolean {
    return this.formData.roleIds.includes(13);
  }

  hasRequiredRoles(): boolean {
    return this.formData.roleIds.includes(12) && this.formData.roleIds.includes(13);
  }

  // =====================================================
  // SEARCH
  // =====================================================

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.currentPage = 1;
    this.applyUserView();
  }

  clearSearch(): void {
    this.onSearchChange('');
    setTimeout(() => this.searchInput?.nativeElement.focus(), 0);
  }

  // =====================================================
  // ACTIVE FILTER
  // =====================================================

  toggleActiveFilter(): void {
    this.showActiveOnly.update((value) => !value);
    this.currentPage = 1;
    this.applyUserView();
  }

  // =====================================================
  // CLIENT-SIDE FILTER + PAGINATION
  // =====================================================

  private applyUserView(): void {
    let filtered = [...this.allUsers];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((user) => user.is_active);
    }

    const search = this.searchText().trim().toLowerCase();

    if (search) {
      filtered = filtered.filter((user) =>
        [
          user.userId,
          user.name,
          user.designation,
          user.rank,
          user.role,
          user.email,
          user.phone,
          user.organization_type,
          user.organization,
        ].some((value) =>
          String(value ?? '')
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

    this.cdr.detectChanges();
  }

  // =====================================================
  // PAGE SIZE
  // =====================================================

  onPageSizeChange(value: string): void {
    const size = Number(value);

    if (!Number.isFinite(size) || size <= 0) {
      return;
    }

    this.pageSize = size;
    this.currentPage = 1;
    this.applyUserView();
  }

  goToFirstPage(): void {
    if (this.currentPage <= 1) return;

    this.currentPage = 1;
    this.applyUserView();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) return;

    this.currentPage--;
    this.applyUserView();
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) return;

    this.currentPage++;
    this.applyUserView();
  }

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) return;

    this.currentPage = this.totalPages;
    this.applyUserView();
  }

  // =====================================================
  // CELL CLICK
  // =====================================================

  onCellClicked(event: CellClickedEvent<UserItem>): void {
    // ACTIONS column only
    if (String(event.colDef.headerName ?? '').toUpperCase() !== 'ACTIONS') {
      return;
    }

    const user = event.data;

    if (!user) {
      console.warn('User row data not found.');
      return;
    }

    // Clicked element
    const target = event.event?.target as Element | null;

    // Button find karo
    const button = target?.closest('button');

    if (!button) {
      console.warn('Action button not found.', target);
      return;
    }

    const action = button.getAttribute('data-action');

    // EDIT
    if (action === 'edit') {
      this.openEditModal(user);
      return;
    }

    // DELETE
    if (action === 'delete') {
      this.confirmDelete(user);
      return;
    }

    // ACCESS
    if (action === 'access') {
      this.openAccessModal(user);
      return;
    }
  }

  preventUserIdInvalidCharacters(event: KeyboardEvent): void {
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

    if (!/^[A-Za-z0-9@_-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeUserId(): void {
    this.formData.userId = this.formData.userId.replace(/[^A-Za-z0-9@_-]/g, '').slice(0, 50);
  }

  preventUserNameInvalidCharacters(event: KeyboardEvent): void {
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

    if (!/^[A-Za-z _-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeUserName(): void {
    this.formData.username = this.formData.username
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  preventDesignationInvalidCharacters(event: KeyboardEvent): void {
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

    if (!/^[A-Za-z ._-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeDesignation(): void {
    this.formData.designation = this.formData.designation
      .replace(/[^A-Za-z ._-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  preventRankInvalidCharacters(event: KeyboardEvent): void {
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

    if (!/^[A-Za-z ._-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeRank(): void {
    this.formData.rank = this.formData.rank
      .replace(/[^A-Za-z ._-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  preventEmailInvalidCharacters(event: KeyboardEvent): void {
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

    if (!/^[A-Za-z0-9@._-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeEmail(): void {
    this.formData.email = this.formData.email.replace(/[^A-Za-z0-9@._-]/g, '').slice(0, 150);
  }

  // =====================================================
  // ADD
  // =====================================================

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedUser.set(null);
    this.submitted = false;
    this.formData = this.getEmptyForm();
    this.showPassword = false;
    this.showOldPassword = false;
    this.isModalOpen.set(true);
    this.focusFirstFormInput();
  }

  // =====================================================
  // EDIT
  // =====================================================

  openEditModal(user: UserItem): void {
    this.isEditMode.set(true);
    this.selectedUser.set(user);
    this.submitted = false;
    this.showPassword = false;
    this.showOldPassword = false;

    const selectedRole = this.roleOptions.find(
      (role) => role.rolename.toLowerCase() === user.role.toLowerCase(),
    );

    // ==========================================
    // BASIC DATA
    // ==========================================

    this.formData = {
      id: user.id,
      userId: user.userId,
      username: user.name,
      role: user.role,
      roleId: selectedRole?.roleid ?? '',
      roleIds: (user.roleIds || []).filter((roleId) =>
        this.roleOptions.some((role) => Number(role.roleid) === Number(roleId)),
      ),
      name: user.name,
      rank: user.rank,
      designation: user.designation,
      email: user.email,
      phone: user.phone,
      password: '',
      oldPassword: '',
      organization_type: '',
      organization: '',
      is_active: user.is_active,
    };

    // ==========================================
    // FIND ORGANIZATION TYPE
    // ==========================================

    const selectedType = this.organizationTypes.find(
      (type: any) =>
        String(type.organization_type).trim().toLowerCase() ===
        String(user.organization_type).trim().toLowerCase(),
    );

    if (selectedType) {
      // SELECT VALUE = ID
      this.formData.organization_type = String(selectedType.organization_type_id);

      // ========================================
      // LOAD ORGANIZATIONS
      // ========================================

      const selectedTypeRecord = this.allOrganizationRecords.find(
        (item: any) =>
          Number(item.organisation_type_id) === Number(selectedType.organization_type_id),
      );

      // console.log('Selected Organization Type Record:', selectedTypeRecord);

      this.organizations = Array.isArray(selectedTypeRecord?.organisations)
        ? selectedTypeRecord.organisations
        : Array.isArray(selectedTypeRecord?.organizations)
          ? selectedTypeRecord.organizations
          : [];

      // console.log('Organizations:', this.organizations);

      // ========================================
      // FIND ORGANIZATION
      // ========================================

      const selectedOrg = this.organizations.find(
        (org: any) =>
          String(org.organisation_name ?? org.organisationName ?? org.organisationName ?? '')
            .trim()
            .toLowerCase() ===
          String(user.organization ?? '')
            .trim()
            .toLowerCase(),
      );

      // console.log('User Organization:', user.organization);

      // console.log('Selected Organization:', selectedOrg);

      if (selectedOrg) {
        // SELECT VALUE = ORGANISATION ID
        this.formData.organization = String(selectedOrg.organisation_id);
      }
    }

    // ==========================================
    // OPEN MODAL
    // ==========================================

    this.isModalOpen.set(true);

    this.cdr.detectChanges();

    this.focusFirstFormInput();
  }

  openAccessModal(user: UserItem): void {
    this.accessUser.set(user);

    // Modal open karo
    this.isAccessModalOpen.set(true);

    // Initial state
    this.accessUserIp = '';
    this.accessRoleSettings = [];

    this.cdr.detectChanges();

    // ================================
    // GET USER ACCESS INFO
    // ================================

    const payload = {
      userid: user.userId,
    };

    this.userService.getUserAccessInfo(payload).subscribe({
      next: (res: any) => {
        try {
          const data = this.parseApiData(res);

          // --------------------------------
          // API response normalize
          // --------------------------------

          const accessData: UserAccessInfo =
            data?.data ?? data?.Data ?? data?.userAccessInfo ?? data?.UserAccessInfo ?? data;

          // --------------------------------
          // IP
          // --------------------------------

          this.accessUserIp = String(accessData?.ip ?? '');

          // --------------------------------
          // ROLES
          // --------------------------------

          const roles = Array.isArray(accessData?.roles) ? accessData.roles : [];

          this.accessRoleSettings = roles
            .filter((role: any) =>
              this.toBoolean(role.isactive ?? role.isActive ?? role.IsActive ?? true),
            )
            .map((role: any) => ({
              roleId: Number(role.roleid ?? role.roleId ?? role.RoleId ?? 0),

              roleName: String(
                role.rolename ??
                  role.roleName ??
                  role.RoleName ??
                  this.getRoleName(Number(role.roleid ?? role.roleId ?? 0)) ??
                  'Unknown Role',
              ),

              priority: Number(role.priority ?? role.Priority ?? 0),

              otpBased:
                String(role.otp_based ?? role.otpBased ?? role.OtpBased ?? 'N').toUpperCase() ===
                'Y',

              ipBased:
                String(role.ip_based ?? role.ipBased ?? role.IpBased ?? 'N').toUpperCase() === 'Y',

              isActive: this.toBoolean(role.isactive ?? role.isActive ?? role.IsActive ?? true),
            }));

          this.cdr.detectChanges();
        } catch (error) {
          console.error('Failed to parse User Access Info:', error);

          Swal.fire({
            icon: 'error',
            title: 'Unable to Load Access',
            text: 'Unable to load user access information.',
          });
        }
      },

      error: (error: any) => {
        console.error('GetUserAccessInfo API Error:', error);

        Swal.fire({
          icon: 'error',
          title: 'Unable to Load Access',
          text: this.getApiErrorMessage(error, 'Unable to load user access information.'),
        });

        this.accessRoleSettings = [];
        this.accessUserIp = '';
        this.cdr.detectChanges();
      },
    });
  }

  // =====================================================
  // CLOSE
  // =====================================================

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedUser.set(null);
  }

  closeAccessModal(): void {
    this.isAccessModalOpen.set(false);
    this.accessUser.set(null);
    this.accessUserIp = '';
    this.accessRoleSettings = [];
  }

  toggleOtpBased(index: number): void {
    this.accessRoleSettings[index].otpBased = !this.accessRoleSettings[index].otpBased;

    this.accessRoleSettings = [...this.accessRoleSettings];
  }

  toggleIpBased(index: number): void {
    this.accessRoleSettings[index].ipBased = !this.accessRoleSettings[index].ipBased;

    this.accessRoleSettings = [...this.accessRoleSettings];
  }

  submitAccessConfiguration(): void {
    const user = this.accessUser();

    if (!user) {
      return;
    }

    // ==========================================
    // VALIDATE IP
    // ==========================================

    const ip = this.accessUserIp.trim();

    if (!ip) {
      Swal.fire({
        icon: 'warning',
        title: 'IP Address Required',
        text: 'Please enter IP address.',
      });

      return;
    }

    // ==========================================
    // BUILD UPDATE PAYLOAD
    // ==========================================

    const payload = {
      userid: user.userId,

      ip: ip,

      roles: this.accessRoleSettings.map((role) => ({
        roleid: Number(role.roleId),

        rolename: role.roleName,

        priority: Number(role.priority ?? 0),

        ip_based: role.ipBased ? 'Y' : 'N',

        otp_based: role.otpBased ? 'Y' : 'N',

        isactive: role.isActive,
      })),
    };

    // ==========================================
    // UPDATE API
    // ==========================================

    this.userService.updateUserAccessInfo(payload).subscribe({
      next: (res: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Updated Successfully',
          text: 'User access configuration updated successfully.',
          timer: 1600,
          showConfirmButton: false,
        });

        this.closeAccessModal();
      },

      error: (error: any) => {
        console.error('UpdateUserAccessInfo API Error:', error);

        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: this.getApiErrorMessage(error, 'Unable to update user access configuration.'),
        });
      },
    });
  }

  // =====================================================
  // SAVE
  // =====================================================

  saveUser(form?: any): void {
    this.submitted = true;

    // Required roles
    // if (!this.hasRequiredRoles()) {
    //   Swal.fire({
    //     icon: 'warning',
    //     title: 'Role Required',
    //     text: 'Please select both Role ID 12 and Role ID 13.',
    //   });
    //   return;
    // }

    // Angular form validation
    if (form?.invalid) {
      Object.keys(form.controls).forEach((key) => {
        form.controls[key].markAsTouched();
      });

      this.cdr.detectChanges();

      // console.log('❌ FORM INVALID');
      // console.log(
      //   'Invalid Controls:',
      //   Object.keys(form.controls).filter((key) => form.controls[key].invalid),
      // );

      return;
    }

    const userid = this.formData.userId.trim();
    const username = this.formData.username.trim();
    const name = this.formData.name.trim();
    const designation = this.formData.designation.trim();
    const rank = this.formData.rank.trim();
    const email = this.formData.email.trim();
    const phone = this.formData.phone.trim();
    const password = this.formData.password.trim();

    if (!userid) {
      return;
    }

    if (!username) {
      return;
    }

    if (!designation) {
      return;
    }

    if (!email) {
      return;
    }

    if (!this.isEditMode() && (!password || password.length < 6 || password.length > 16)) {
      return;
    }

    if (this.isEditMode() && password) {
      if (password.length < 6 || password.length > 16) {
        return;
      }
    }

    // ==========================================
    // ORGANISATION
    // ==========================================

    const selectedOrganisation = this.organizations.find(
      (item: any) => Number(item.organisation_id) === Number(this.formData.organization),
    );

    const selectedOrganisationType = this.organizationTypes.find(
      (item: any) => Number(item.organization_type_id) === Number(this.formData.organization_type),
    );

    // ==========================================
    // FINAL PAYLOAD
    // ==========================================

    const payload: any = {
      id: this.isEditMode() ? String(this.formData.id) : '',

      userId: userid,

      userName: username,

      password: password,

      contact: {
        mobileNo: phone,
        countryCode: 91,
        emailId: email,
      },

      roles: this.formData.roleIds.map((roleId) => ({
        role_id: Number(roleId),
      })),

      isActive: true,

      mfaVerified: false,

      designation: designation,

      rank: rank,

      organisation: selectedOrganisation
        ? {
            organisation_id: Number(selectedOrganisation.organisation_id),
            organisation_name: String(selectedOrganisation.organisation_name),
          }
        : null,

      organisation_type: selectedOrganisationType
        ? {
            organisation_type_id: Number(selectedOrganisationType.organization_type_id),
            organisation_type_name: String(selectedOrganisationType.organization_type),
          }
        : null,
    };

    if (this.isEditMode() && !password) {
      delete payload.password;
    }

    // console.log('========== FINAL USER ADD / UPDATE PAYLOAD ==========');

    // console.log(JSON.stringify(payload, null, 2));

    this.userService.addOrUpdateUser(payload).subscribe({
      next: (res: any) => {
        // console.log('========== RAW ADD / UPDATE RESPONSE ==========');
        // console.log('Response:', res);
        // console.log('Response Code:', res?.code);
        // console.log('Response Message:', res?.message);
        // console.log('Response Data:', res?.data);

        // ==========================================
        // BACKEND RESPONSE
        // ==========================================

        const responseCode = Number(res?.code ?? res?.Code);

        const responseMessage = String(
          res?.message ?? res?.Message ?? res?.error ?? res?.Error ?? '',
        ).trim();

        const messageLower = responseMessage.toLowerCase();

        // console.log('Final Code:', responseCode);
        // console.log('Final Message:', responseMessage);

        // ==========================================
        // BUSINESS ERROR
        // ==========================================

        const isBusinessError =
          messageLower.includes('already exists') ||
          messageLower.includes('already exist') ||
          messageLower.includes('duplicate') ||
          messageLower.includes('failed') ||
          messageLower.includes('error') ||
          messageLower.includes('invalid') ||
          messageLower.includes('required') ||
          messageLower.includes('not found');

        if (isBusinessError) {
          // console.log('❌ BACKEND BUSINESS ERROR');
          // console.log('Error Message:', responseMessage);

          Swal.fire({
            icon: 'error',

            title: this.isEditMode() ? 'Update Failed' : 'Create Failed',

            text: responseMessage,

            confirmButtonText: 'OK',

            // IMPORTANT
            allowOutsideClick: false,
            allowEscapeKey: false,
          });

          // ❗ VERY IMPORTANT
          // Modal close nahi hoga
          // User form me changes kar sakta hai
          return;
        }

        // ==========================================
        // SUCCESS RESPONSE
        // Backend: code = 1 means SUCCESS
        // ==========================================

        if (responseCode === 1) {
          // console.log('✅ USER SAVED SUCCESSFULLY');

          Swal.fire({
            icon: 'success',
            title: this.isEditMode() ? 'Updated Successfully' : 'Created Successfully',

            text: this.isEditMode()
              ? `User "${username}" has been updated.`
              : `User "${username}" has been created.`,

            timer: 1800,
            showConfirmButton: false,
          });

          this.closeModal();
          this.loadUsers();

          return;
        }

        // ==========================================
        // OTHER / UNKNOWN RESPONSE
        // ==========================================

        Swal.fire({
          icon: 'error',

          title: this.isEditMode() ? 'Update Failed' : 'Create Failed',

          text: responseMessage || 'Unable to save user.',

          confirmButtonText: 'OK',

          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        return;

        // ==========================================
        // SUCCESS
        // ==========================================

        // console.log('✅ USER SAVED SUCCESSFULLY');

        Swal.fire({
          icon: 'success',

          title: this.isEditMode() ? 'Updated Successfully' : 'Created Successfully',

          text: this.isEditMode()
            ? `User "${username}" has been updated.`
            : `User "${username}" has been created.`,

          timer: 1800,
          showConfirmButton: false,
        });

        this.closeModal();
        this.loadUsers();
      },

      error: (error: any) => {
        console.error('========== USER ADD / UPDATE HTTP ERROR ==========');

        console.error(error);

        Swal.fire({
          icon: 'error',

          title: this.isEditMode() ? 'Update Failed' : 'Create Failed',

          text: this.getApiErrorMessage(
            error,
            this.isEditMode() ? 'Unable to update user.' : 'Unable to create user.',
          ),

          confirmButtonText: 'OK',

          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        // Modal close nahi hoga
      },
    });
  }

  // =====================================================
  // DELETE / REMOVE
  // =====================================================

  confirmDelete(user: UserItem): void {
    Swal.fire({
      title: 'Remove User?',
      text: `Are you sure you want to remove "${user.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Remove',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const payload = {
        id: user.id,
      };

      // console.log('========== USER REMOVE PAYLOAD ==========');
      // console.log(payload);

      this.userService.removeUser(payload).subscribe({
        next: (res: any) => {
          // console.log('User Remove Response:', res);

          Swal.fire({
            icon: 'success',
            title: 'Removed Successfully',
            text: `User "${user.name}" has been removed.`,
            timer: 1600,
            showConfirmButton: false,
          });

          this.loadUsers();
        },

        error: (error: any) => {
          console.error('User Remove API Error:', error);

          Swal.fire({
            icon: 'error',
            title: 'Remove Failed',
            text: this.getApiErrorMessage(error, 'Unable to remove user.'),
          });
        },
      });
    });
  }

  // =====================================================
  // EXPORT
  // =====================================================

  exportCsv(): void {
    if (!this.gridApi || !this.rowData.length) {
      Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: 'There is no data to export.',
      });
      return;
    }

    this.gridApi.exportDataAsCsv({
      fileName: 'users.csv',
    });
  }

  // =====================================================
  // HELPERS
  // =====================================================

  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  private parseApiData(res: any): any {
    let data: any = Array.isArray(res) ? res : (res?.data ?? res?.Data ?? res?.result ?? res);

    if (typeof data === 'string') {
      try {
        data = this.userService.decryptResponse(data);
      } catch {
        // If the service helper is not able to decrypt, try plain JSON.
      }

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          // Keep original string.
        }
      }
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const nested =
        data.records ?? data.users ?? data.userList ?? data.result ?? data.data ?? data.Data;

      if (typeof nested === 'string') {
        let parsedNested: any = nested;

        try {
          parsedNested = this.userService.decryptResponse(nested);
        } catch {
          // ignore
        }

        if (typeof parsedNested === 'string') {
          try {
            parsedNested = JSON.parse(parsedNested);
          } catch {
            // keep string
          }
        }

        return parsedNested;
      }
    }

    return data;
  }

  private extractArray(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.records)) {
      return data.records;
    }

    if (Array.isArray(data?.users)) {
      return data.users;
    }

    if (Array.isArray(data?.userList)) {
      return data.userList;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  }

  private extractOrganizationArray(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (!data || typeof data !== 'object') {
      return [];
    }

    // Common response structures
    if (Array.isArray(data.records)) {
      return data.records;
    }

    if (Array.isArray(data.organizations)) {
      return data.organizations;
    }

    if (Array.isArray(data.organisations)) {
      return data.organisations;
    }

    if (Array.isArray(data.data)) {
      return data.data;
    }

    if (Array.isArray(data.result)) {
      return data.result;
    }

    // Nested data
    if (data.data && typeof data.data === 'object') {
      const nested = this.extractOrganizationArray(data.data);

      if (nested.length) {
        return nested;
      }
    }

    if (data.result && typeof data.result === 'object') {
      const nested = this.extractOrganizationArray(data.result);

      if (nested.length) {
        return nested;
      }
    }

    return [];
  }

  private mapUser(item: any, index: number): UserItem {
    // ==============================
    // ROLES
    // ==============================

    const roles = Array.isArray(item.Roles)
      ? item.Roles
      : Array.isArray(item.roles)
        ? item.roles
        : [];

    const roleNames = roles
      .map((role: any) => role.RoleName ?? role.rolename ?? role.roleName ?? role.name ?? '')
      .filter(Boolean);

    const roleIds = roles
      .map((role: any) => Number(role.RoleId ?? role.roleid ?? role.roleId ?? 0))
      .filter((id: number) => id > 0);

    // ==============================
    // CONTACT
    // ==============================

    const contact = item.Contact ?? item.contact ?? {};

    // ==============================
    // ORGANISATION
    // ==============================

    const organisation = item.Organisation ?? item.organisation ?? null;

    const organisationType =
      item.OrganisationType ?? item.organisationType ?? item.organisation_type ?? null;

    // ==============================
    // FINAL USER
    // ==============================

    return {
      id: String(item.Id ?? item.id ?? item.userautoid ?? item.userAutoId ?? '') as any,

      userId: String(item.UserId ?? item.userid ?? item.userId ?? item.username ?? ''),

      name: String(
        item.UserName ??
          item.username ??
          item.userName ??
          item.Name ??
          item.name ??
          item.full_name ??
          item.fullName ??
          '',
      ),

      designation: String(item.Designation ?? item.designation ?? item.post ?? ''),

      rank: String(item.Rank ?? item.rank ?? ''),

      role: roleNames.join(', '),

      roleIds: roleIds,

      email: String(
        contact.EmailId ?? contact.emailid ?? item.EmailId ?? item.email ?? item.emailid ?? '',
      ),

      phone: String(
        contact.MobileNo ??
          contact.mobileno ??
          item.MobileNo ??
          item.mobile ??
          item.phone ??
          item.mobileno ??
          '',
      ),

      organization_type: String(
        organisationType?.OrganisationTypeName ??
          organisationType?.organisationTypeName ??
          organisationType?.organisation_type_name ??
          item.OrganisationTypeName ??
          item.organizationTypeName ??
          item.organisation_type ??
          item.organization_type ??
          '',
      ),

      organization: String(
        organisation?.OrganisationName ??
          organisation?.organisationName ??
          organisation?.organisation_name ??
          item.OrganisationName ??
          item.organizationName ??
          item.organisation_name ??
          item.organization ??
          '',
      ),

      is_active: this.toBoolean(
        item.IsActive ?? item.isActive ?? item.is_active ?? item.isactive ?? true,
      ),

      created_at: String(
        item.CreatedAt ??
          item.createdAt ??
          item.created_at ??
          item.EntryDate ??
          item.entryDate ??
          '',
      ),
    };
  }
  private toBoolean(value: any): boolean {
    if (value === true || value === 1) {
      return true;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      return ['true', '1', 'yes', 'y', 'active', 'enabled'].includes(normalized);
    }

    return false;
  }

  private escapeHtml(value: any): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private getApiErrorMessage(error: any, fallback: string): string {
    return error?.error?.message ?? error?.error?.Message ?? error?.message ?? fallback;
  }
}
