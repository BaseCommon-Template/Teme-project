import {
  Component,
  OnInit,
  AfterViewInit,
  signal,
  inject,
  ViewChild,
  ElementRef,
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
import { CryptoHelper } from '../../core/helpers/crypto-helper';
import { MenuManagementService } from '../../core/services/menu-management';
import { MenuService } from '../../core/services/menu';

ModuleRegistry.registerModules([AllCommunityModule]);

// =====================================================
// INTERFACE
// =====================================================

export interface MenuRole {
  role_id: number;
  role_name: string | null;
  priority: number;
  PAdd: string;
  PDelete: string;
  PEdit: string;
  PView: string;
}

export interface MenuItem {
  menu_id: number;
  menu_name: string;
  parent_id: number;
  parent_name: string | null;
  controller_name: string | null;
  action_name: string | null;
  description: string | null;
  menu_type: number;
  active: boolean;
  priority: number;
  roles: MenuRole[];
  lang_labels: any;
}

export interface RoleMaster {
  Id: string;
  roleid: number;
  rolename: string;
  isactive: boolean;
  priority: number;
}

// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-menu-management',
  standalone: true,

  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],

  templateUrl: './menu-management.html',

  styleUrl: './menu-management.css',
})
export class MenuManagement implements OnInit, AfterViewInit {
  private readonly menuService = inject(MenuManagementService);
  private readonly appMenuService = inject(MenuService);

  private gridApi!: GridApi<MenuItem>;

  Math = Math;

  // =====================================================
  // DATA
  // =====================================================

  allMenus: MenuItem[] = [];
  rowData: MenuItem[] = [];

  rolesList: RoleMaster[] = [];
  // =====================================================
  // SEARCH
  // =====================================================

  readonly searchText = signal<string>('');

  // =====================================================
  // MODAL
  // =====================================================

  readonly isModalOpen = signal<boolean>(false);

  readonly isEditMode = signal<boolean>(false);

  readonly selectedItem = signal<MenuItem | null>(null);

  readonly showActiveOnly = signal<boolean>(true);

  readonly isLoading = signal<boolean>(true);

  @ViewChild('searchInput')
  searchInput!: ElementRef<HTMLInputElement>;

  @ViewChild('firstFormInput')
  firstFormInput!: ElementRef<HTMLInputElement>;

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

  toggleActiveFilter(): void {
    this.showActiveOnly.update((value) => !value);

    this.currentPage = 1;

    this.applyMenuView();
  }

  onMenuNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Numbers remove kar do
    input.value = input.value.replace(/[0-9]/g, '');

    // ngModel ko updated value do
    this.formData.menuName = input.value;
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  currentPage = 1;

  pageSize = 1000;

  totalRecords = 0;

  totalPages = 0;

  // =====================================================
  // GRID HEIGHT
  // =====================================================

  rowHeight = 38;

  headerHeight = 30;

  // =====================================================
  // FORM
  // =====================================================

  submitted = false;

  formData = {
    menuId: 0,

    menuName: '',

    description: '',

    parentId: 0,

    controllerName: '',

    menuType: 1,

    priority: 1,

    active: true,

    roles: [
      {
        roleId: 13,

        priority: 1,

        pAdd: '1',

        pDelete: '1',

        pEdit: '1',

        pView: '1',
      },
    ],
  };

  // =====================================================
  // COLUMN DEFINITIONS
  // =====================================================

  colDefs: ColDef<MenuItem>[] = [
    // =====================================================
    // SR NO
    // =====================================================
    {
      headerName: 'SR. NO.',
      width: 70,
      minWidth: 70,
      maxWidth: 80,

      valueGetter: (params) => {
        return (params.node?.rowIndex ?? 0) + 1 + (this.currentPage - 1) * this.pageSize;
      },

      sortable: false,
      filter: false,
    },

    // =====================================================
    // MENU NAME
    // =====================================================
    {
      field: 'menu_name',
      headerName: 'MENU NAME',

      flex: 1.5,
      minWidth: 180,

      sortable: true,
      filter: true,

      cellRenderer: (params: ICellRendererParams<MenuItem>) => {
        return `
        <div
          style="
            display:flex;
            align-items:center;
            height:100%;
            width:100%;
            font-size:12px;
            color:#222;
            font-weight:500;
          "
        >
          ${params.value ?? '-'}
        </div>
      `;
      },
    },

    // =====================================================
    // PARENT MENU
    // =====================================================
    {
      field: 'parent_name',
      headerName: 'PARENT MENU',

      flex: 1.2,
      minWidth: 150,

      sortable: true,
      filter: true,

      valueGetter: (params) => {
        return params.data?.parent_name || '-';
      },
    },

    // =====================================================
    // CONTROLLER
    // =====================================================
    {
      field: 'controller_name',
      headerName: 'CONTROLLER',

      flex: 1.6,
      minWidth: 200,

      sortable: true,
      filter: true,

      valueGetter: (params) => {
        return params.data?.controller_name || '-';
      },
    },

    // =====================================================
    // MENU TYPE
    // =====================================================
    {
      field: 'menu_type',
      headerName: 'MENU TYPE',

      width: 120,
      minWidth: 110,
      maxWidth: 130,

      sortable: true,
      filter: true,

      cellRenderer: (params: ICellRendererParams<MenuItem>) => {
        const menuType = Number(params.value);

        const isPublic = menuType === 1;

        return `
        <div
          style="
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:flex-start;
            box-sizing:border-box;
            padding-left:8px;
          "
        >
          <span class="menu-type-pill ${isPublic ? 'public' : 'private'}">
            ${isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      `;
      },
    },

    // =====================================================
    // PRIORITY
    // =====================================================
    {
      field: 'priority',
      headerName: 'PRIORITY',

      width: 90,
      minWidth: 80,
      maxWidth: 100,

      sortable: true,
      filter: true,

      cellStyle: {
        textAlign: 'center',
      },
    },

    // =====================================================
    // ACTIVE / STATUS
    // =====================================================
    {
      field: 'active',
      headerName: 'STATUS',

      width: 120,
      minWidth: 115,
      maxWidth: 130,

      sortable: true,
      filter: true,

      cellRenderer: (params: ICellRendererParams<MenuItem>) => {
        const isActive = params.value === true;

        return `
        <div
          style="
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:flex-start;
            padding-left:8px;
            box-sizing:border-box;
          "
        >
          <span
            class="menu-status-pill ${isActive ? 'active' : 'inactive'}"
          >
            <span class="status-dot"></span>

            <span>
              ${isActive ? 'Active' : 'Inactive'}
            </span>
          </span>
        </div>
      `;
      },
    },

    // =====================================================
    // ACTIONS
    // =====================================================
    {
      headerName: 'ACTIONS',

      width: 120,
      minWidth: 110,
      maxWidth: 130,

      sortable: false,
      filter: false,

      cellRenderer: (params: ICellRendererParams<MenuItem>) => {
        return `
        <div class="action-buttons">

          <button
            type="button"
            class="action-edit"
            data-action="edit"
            title="Edit"
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
            title="Delete"
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

  // =====================================================
  // DEFAULT COLUMN
  // =====================================================

  defaultColDef: ColDef = {
    sortable: true,

    filter: true,

    resizable: true,

    minWidth: 80,

    flex: 0,
  };

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadMenus();
    this.loadRoles();
  }

  // =====================================================
  // GRID READY
  // =====================================================

  onGridReady(params: GridReadyEvent<MenuItem>): void {
    this.gridApi = params.api;
    this.applyMenuView();
  }

  // =====================================================
  // GET ALL
  // =====================================================

  applyMenuView(): void {
    let filtered = [...this.allMenus];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.active === true);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        (item) =>
          (item.menu_name || '').toLowerCase().includes(search) ||
          (item.parent_name || '').toLowerCase().includes(search) ||
          (item.controller_name || '').toLowerCase().includes(search),
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

  loadMenus(): void {
    this.isLoading.set(true);

    this.menuService.getAllMenu(1, 1000).subscribe({
      next: (res: any) => {
        let data = res?.data;

        try {
          if (typeof data === 'string') {
            data = CryptoHelper.decrypt(data);
          }
        } catch (error) {
          console.error('Menu decrypt error:', error);
        }

        try {
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }
        } catch {
          console.warn('Menu data is not valid JSON');
        }

        let records: any[] = [];

        if (Array.isArray(data)) {
          records = data;
        } else if (Array.isArray(data?.records)) {
          records = data.records;
        } else if (Array.isArray(data?.data)) {
          records = data.data;
        }

        this.allMenus = records.map((item: any): MenuItem => ({
          menu_id: Number(item.menu_id ?? item.menuId ?? item.automenu_id ?? 0),

          menu_name: item.menu_name ?? item.menuName ?? item.menu ?? '',

          parent_id: Number(item.parent_id ?? item.parentId ?? 0),

          parent_name: item.parent_name ?? item.parentName ?? null,

          controller_name: item.controller_name ?? item.controllerName ?? item.url_path ?? null,

          action_name: item.action_name ?? item.actionName ?? null,

          description: item.description ?? null,

          menu_type: Number(item.menu_type ?? item.menuType ?? 1),

          active:
            item.active === true ||
            item.active === 1 ||
            item.active === '1' ||
            item.active === 'true',

          priority: Number(item.priority ?? 0),

          roles: Array.isArray(item.roles)
            ? item.roles.map((role: any): MenuRole => ({
              role_id: Number(role.role_id ?? role.roleId ?? 0),

              role_name: role.role_name ?? role.roleName ?? null,

              priority: Number(role.priority ?? 0),

              PAdd: String(role.PAdd ?? role.pAdd ?? '0'),

              PDelete: String(role.PDelete ?? role.pDelete ?? '0'),

              PEdit: String(role.PEdit ?? role.pEdit ?? '0'),

              PView: String(role.PView ?? role.pView ?? '0'),
            }))
            : [],

          lang_labels: item.lang_labels ?? item.langLabels ?? null,
        }));

        this.applyMenuView();
        this.isLoading.set(false);
      },

      error: (error: any) => {
        console.error('Menu GetAll Error:', error);

        this.allMenus = [];

        this.rowData = [];

        this.totalRecords = 0;

        this.totalPages = 0;

        this.isLoading.set(false);
      },
    });
  }

  loadRoles(): void {
    this.menuService.getAllRoles().subscribe({
      next: (res: any) => {
        // console.log('========== ROLE API RESPONSE ==========');
        // console.log('Full Response:', res);

        let data = res?.data;

        // ==========================================
        // DECRYPT
        // ==========================================

        try {
          if (typeof data === 'string') {
            data = CryptoHelper.decrypt(data);

            // console.log('Decrypted Role Data:', data);
          }
        } catch (error) {
          console.error('Role decrypt error:', error);
          this.rolesList = [];
          return;
        }

        // ==========================================
        // PARSE STRING
        // ==========================================

        try {
          if (typeof data === 'string') {
            data = JSON.parse(data);
          }
        } catch (error) {
          console.error('Role data JSON parse error:', error);
          this.rolesList = [];
          return;
        }

        // console.log('Parsed Role Data:', data);

        // ==========================================
        // GET ROLE ARRAY
        // ==========================================

        let roles: any[] = [];

        if (Array.isArray(data)) {
          roles = data;
        } else if (Array.isArray(data?.records)) {
          roles = data.records;
        } else if (Array.isArray(data?.data)) {
          roles = data.data;
        } else if (Array.isArray(data?.RoleMaster?.records)) {
          roles = data.RoleMaster.records;
        } else if (Array.isArray(data?.roles)) {
          roles = data.roles;
        }

        // console.log('All Roles:', roles);

        // ==========================================
        // ONLY ACTIVE ROLES
        // ==========================================

        this.rolesList = roles
          .filter((role: any) => {
            const active = role.isactive ?? role.isActive ?? role.IsActive;

            return (
              active === true ||
              active === 1 ||
              active === '1' ||
              active === 'true' ||
              active === 'True' ||
              active === 'TRUE'
            );
          })
          .map((role: any): RoleMaster => ({
            Id: String(role.Id ?? role.id ?? ''),
            roleid: Number(role.roleid ?? role.roleId ?? role.RoleId ?? 0),
            rolename: String(role.rolename ?? role.roleName ?? role.RoleName ?? ''),
            isactive: true,
            priority: Number(role.priority ?? role.Priority ?? 1),
          }))
          .filter((role) => role.roleid > 0 && !!role.rolename);

        // console.log('========== FINAL ACTIVE ROLE LIST ==========');
        // console.log(this.rolesList);
      },

      error: (error: any) => {
        console.error('ROLE API ERROR:', error);
        this.rolesList = [];
      },
    });
  }

  // =====================================================
  // PARENT MENU DROPDOWN
  // =====================================================

  parentMenuDropdownOpen = false;
  parentMenuSearchText = '';

  get filteredParentMenus(): MenuItem[] {
    const search = this.parentMenuSearchText.trim().toLowerCase();

    if (!search) {
      return this.rowData;
    }

    return this.rowData.filter((menu) =>
      String(menu.menu_name ?? '')
        .toLowerCase()
        .includes(search),
    );
  }

  get selectedParentMenuName(): string {
    const parentId = Number(this.formData.parentId);

    if (!parentId || parentId === 0) {
      return 'No Parent Menu';
    }

    const selectedMenu = this.rowData.find((menu) => Number(menu.menu_id) === parentId);

    return selectedMenu?.menu_name ?? 'Select Parent Menu';
  }

  toggleParentMenuDropdown(): void {
    this.parentMenuDropdownOpen = !this.parentMenuDropdownOpen;

    if (this.parentMenuDropdownOpen) {
      this.parentMenuSearchText = '';
    }
  }

  selectParentMenu(menuId: number): void {
    this.formData.parentId = Number(menuId);

    this.parentMenuDropdownOpen = false;
    this.parentMenuSearchText = '';
  }

  clearParentMenu(): void {
    this.formData.parentId = 0;

    this.parentMenuDropdownOpen = false;
    this.parentMenuSearchText = '';
  }

  // =====================================================
  // SEARCH
  // =====================================================

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.currentPage = 1;
    this.applyMenuView();
  }

  // =====================================================
  // PAGE SIZE
  // =====================================================

  onPageSizeChange(value: string): void {
    this.pageSize = Number(value) || 20;

    this.currentPage = 1;

    this.applyMenuView();
  }

  // =====================================================
  // CHECK ROLE SELECTED
  // =====================================================

  isRoleSelected(roleId: number): boolean {
    return this.formData.roles.some((role) => Number(role.roleId) === Number(roleId));
  }

  hasRoleValidationError(): boolean {
    return this.submitted && this.formData.roles.length === 0;
  }

  // =====================================================
  // TOGGLE ROLE
  // =====================================================

  toggleRole(roleMaster: RoleMaster): void {
    const index = this.formData.roles.findIndex(
      (role) => Number(role.roleId) === Number(roleMaster.roleid),
    );

    // REMOVE ROLE
    if (index !== -1) {
      this.formData.roles.splice(index, 1);

      return;
    }

    // ADD ROLE
    this.formData.roles.push({
      roleId: roleMaster.roleid,

      priority: this.formData.roles.length + 1,

      pAdd: '1',

      pDelete: '0',

      pEdit: '1',

      pView: '1',
    });
  }

  togglePublicRole(): void {
    const index = this.formData.roles.findIndex((role) => Number(role.roleId) === 0);

    // REMOVE PUBLIC
    if (index !== -1) {
      this.formData.roles.splice(index, 1);

      this.formData.roles.forEach((role, i) => {
        role.priority = i + 1;
      });

      return;
    }

    // ADD PUBLIC
    this.formData.roles.unshift({
      roleId: 0,
      priority: 1,
      pAdd: '1',
      pDelete: '0',
      pEdit: '1',
      pView: '1',
    });

    // Recalculate priority
    this.formData.roles.forEach((role, i) => {
      role.priority = i + 1;
    });
  }

  // =====================================================
  // GET ROLE PRIORITY
  // =====================================================

  getRolePriority(roleId: number): number {
    const role = this.formData.roles.find((item) => Number(item.roleId) === Number(roleId));

    return role?.priority ?? 1;
  }

  // =====================================================
  // UPDATE ROLE PRIORITY
  // =====================================================

  updateRolePriority(roleId: number, value: string): void {
    const role = this.formData.roles.find((item) => Number(item.roleId) === Number(roleId));

    if (role) {
      role.priority = Number(value) || 1;
    }
  }

  // =====================================================
  // GET ROLE PERMISSION
  // =====================================================

  getRolePermission(roleId: number, permission: 'pAdd' | 'pDelete' | 'pEdit' | 'pView'): string {
    const role = this.formData.roles.find((item) => Number(item.roleId) === Number(roleId));

    return role?.[permission] ?? '0';
  }

  // =====================================================
  // UPDATE ROLE PERMISSION
  // =====================================================

  updateRolePermission(
    roleId: number,
    permission: 'pAdd' | 'pDelete' | 'pEdit' | 'pView',
    checked: boolean,
  ): void {
    const role = this.formData.roles.find((item) => Number(item.roleId) === Number(roleId));

    if (role) {
      role[permission] = checked ? '1' : '0';
    }
  }

  // =====================================================
  // FIRST PAGE
  // =====================================================

  goToFirstPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage = 1;

    this.applyMenuView();
  }

  // =====================================================
  // PREVIOUS
  // =====================================================

  goToPreviousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;

    this.applyMenuView();
  }

  // =====================================================
  // NEXT
  // =====================================================

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;

    this.applyMenuView();
  }

  // =====================================================
  // LAST
  // =====================================================

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage = this.totalPages;

    this.applyMenuView();
  }

  // =====================================================
  // CELL CLICK
  // =====================================================

  onCellClicked(event: CellClickedEvent<MenuItem>): void {
    // ACTIONS column
    if (String(event.colDef.headerName ?? '').toUpperCase() !== 'ACTIONS') {
      return;
    }

    const target = event.event?.target as HTMLElement | null;

    // Find clicked button
    const button = target?.closest('button');

    if (!button) {
      return;
    }

    const action = button.getAttribute('data-action');

    if (!action) {
      return;
    }

    const item = event.data;

    if (!item) {
      console.warn('Menu row data not found.');
      return;
    }

    // console.log('========== ACTION CLICK ==========');
    // console.log('Action:', action);
    // console.log('Menu:', item);
    // console.log('Menu ID:', item.menu_id);

    // EDIT
    if (action === 'edit') {
      this.openEditModal(item);
      return;
    }

    // DELETE
    if (action === 'delete') {
      this.deleteMenu(item);
      return;
    }
  }

  // =====================================================
  // ADD MODAL
  // =====================================================

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.parentMenuDropdownOpen = false;
    this.parentMenuSearchText = '';
    this.submitted = false;

    this.formData = {
      menuId: 0,
      menuName: '',
      description: '',
      parentId: 0,
      controllerName: '',
      menuType: 1,
      priority: 1,
      active: true,
      roles: [],
    };

    this.isModalOpen.set(true);
    this.focusFirstFormInput();
  }

  // =====================================================
  // EDIT MODAL
  // =====================================================

  openEditModal(item: MenuItem): void {
    this.isEditMode.set(true);

    this.selectedItem.set(item);
    this.parentMenuDropdownOpen = false;
    this.parentMenuSearchText = '';
    this.submitted = false;

    this.formData = {
      menuId: Number(item.menu_id),

      menuName: item.menu_name ?? '',

      description: item.description ?? '',

      parentId: Number(item.parent_id ?? 0),

      controllerName: item.controller_name ?? '',

      menuType: Number(item.menu_type ?? 1),

      priority: Number(item.priority ?? 1),

      active: item.active,

      roles: item.roles?.length
        ? item.roles.map((role) => ({
          roleId: Number(role.role_id),

          priority: Number(role.priority),

          pAdd: role.PAdd ?? '0',

          pDelete: role.PDelete ?? '0',

          pEdit: role.PEdit ?? '0',

          pView: role.PView ?? '0',
        }))
        : [],
    };

    this.isModalOpen.set(true);
  }

  // =====================================================
  // ADD ROLE
  // =====================================================

  addRole(): void {
    this.formData.roles.push({
      roleId: 0,

      priority: this.formData.roles.length + 1,

      pAdd: '1',

      pDelete: '0',

      pEdit: '1',

      pView: '1',
    });
  }

  // =====================================================
  // REMOVE ROLE
  // =====================================================

  removeRole(index: number): void {
    if (this.formData.roles.length <= 1) {
      return;
    }

    this.formData.roles.splice(index, 1);

    this.formData.roles.forEach((role, i) => {
      role.priority = i + 1;
    });
  }

  preventMenuNameInvalidCharacters(event: KeyboardEvent): void {
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

  sanitizeMenuName(): void {
    this.formData.menuName = this.formData.menuName
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  preventControllerNameInvalidCharacters(event: KeyboardEvent): void {
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

    if (!/^[A-Za-z0-9 @#_./-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeControllerName(): void {
    this.formData.controllerName = (this.formData.controllerName || '')
      .replace(/[^A-Za-z0-9 @#_./-]/g, '')
      .slice(0, 200);
  }

  preventDescriptionInvalidCharacters(event: KeyboardEvent): void {
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
      'Enter',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[A-Za-z0-9 @#_./-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeDescription(): void {
    this.formData.description = (this.formData.description || '')
      .replace(/[^A-Za-z0-9 @#_./\r\n-]/g, '')
      .slice(0, 500);
  }

  saveMenu(form?: any): void {
    this.submitted = true;

    if (form && form.invalid) {
      return;
    }

    if (!this.formData.roles || this.formData.roles.length === 0) {
      return;
    }

    // ==========================================
    // EXTRA SAFETY VALIDATION
    // ==========================================

    const menuName = this.formData.menuName.trim();
    const controllerName = this.formData.controllerName.trim();
    const description = (this.formData.description || '').trim();

    const menuNameRegex = /^[A-Za-z]+(?:[ _-][A-Za-z]+)*$/;
    const controllerRegex = /^[A-Za-z0-9 @#_./-]+$/;
    const descriptionRegex = /^[A-Za-z0-9 @#_./\r\n-]*$/;

    if (!menuNameRegex.test(menuName)) {
      return;
    }

    if (!controllerRegex.test(controllerName)) {
      return;
    }

    if (description && !descriptionRegex.test(description)) {
      return;
    }

    // PRIORITY
    if (!/^[1-9][0-9]*$/.test(String(this.formData.priority))) {
      return;
    }

    // ==========================================
    // ADD
    // ==========================================

    if (!this.isEditMode()) {
      const payload = {
        menuId: 0,

        menuName: this.formData.menuName.trim(),

        description: this.formData.description.trim(),

        parentId: Number(this.formData.parentId),

        controllerName: this.formData.controllerName.trim(),

        menuType: Number(this.formData.menuType),

        priority: Number(this.formData.priority),

        roles: this.formData.roles.map((role) => ({
          roleId: Number(role.roleId),
          priority: Number(role.priority),
          pAdd: role.pAdd,
          pDelete: role.pDelete,
          pEdit: role.pEdit,
          pView: role.pView,
        })),
      };

      this.menuService.addMenu(payload).subscribe({
        next: (res: any) => {
          const responseCode = Number(res?.code ?? 0);
          const responseMessage = String(res?.message ?? 'Unable to create Menu.');

          if (responseCode !== 1) {
            Swal.fire({
              icon: 'error',
              title: 'Add Failed',
              text: responseMessage,
              confirmButtonText: 'OK',
              allowOutsideClick: false,
              allowEscapeKey: false,
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: 'Created Successfully',
            text: responseMessage,
            timer: 1800,
            showConfirmButton: false,
          });

          this.closeModal();
          this.loadMenus();
          this.appMenuService.refresh();
        },

        error: (error: any) => {
          console.error('Menu Add Error:', error);

          Swal.fire({
            icon: 'error',
            title: 'Add Failed',
            text: 'Unable to create Menu.',
          });
        },
      });

      return;
    }

    // ==========================================
    // UPDATE
    // ==========================================

    const updatePayload = {
      menuId: Number(this.formData.menuId),

      menuName: this.formData.menuName.trim(),

      description: this.formData.description.trim(),

      parentId: Number(this.formData.parentId),

      controllerName: this.formData.controllerName.trim(),

      menuType: Number(this.formData.menuType),

      priority: Number(this.formData.priority),

      active: Boolean(this.formData.active),

      roles: this.formData.roles.map((role) => ({
        roleId: Number(role.roleId),
        priority: Number(role.priority),
        pAdd: role.pAdd,
        pDelete: role.pDelete,
        pEdit: role.pEdit,
        pView: role.pView,
      })),
    };

    this.menuService.updateMenu(updatePayload).subscribe({
      next: (res: any) => {
        const responseCode = Number(res?.code ?? 0);
        const responseMessage = String(res?.message ?? 'Unable to update Menu.');

        if (responseCode !== 1) {
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: responseMessage,
            confirmButtonText: 'OK',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Updated Successfully',
          text: responseMessage,
          timer: 1800,
          showConfirmButton: false,
        });

        this.closeModal();
        this.loadMenus();
        this.appMenuService.refresh();
      },

      error: (error: any) => {
        console.error('Menu Update Error:', error);

        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Unable to update Menu.',
        });
      },
    });
  }

  // =====================================================
  // DELETE
  // =====================================================

  deleteMenu(item: MenuItem): void {
    Swal.fire({
      icon: 'warning',

      title: 'Delete Menu?',

      text: `Are you sure you want to delete "${item.menu_name}"?`,
      showCancelButton: true,

      confirmButtonText: 'Yes, Delete',

      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      const payload = {
        menuId: Number(item.menu_id),
      };

      // console.log('========== MENU DELETE PAYLOAD ==========');

      // console.log(payload);

      this.menuService.deleteMenu(payload).subscribe({
        next: (res: any) => {
          // console.log('Menu Delete Response:', res);

          Swal.fire({
            icon: 'success',
            title: 'Deleted Successfully',
            timer: 1600,
            showConfirmButton: false,
          });

          this.loadMenus();
          this.appMenuService.refresh();
        },

        error: (error: any) => {
          console.error('Menu Delete Error:', error);

          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Unable to delete Menu.',
          });
        },
      });
    });
  }

  // =====================================================
  // CLOSE
  // =====================================================

  closeModal(): void {
    this.isModalOpen.set(false);

    this.selectedItem.set(null);
  }

  // =====================================================
  // EXPORT
  // =====================================================

  exportCsv(): void {
    if (!this.rowData.length) {
      Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: 'There is no data to export.',
      });

      return;
    }

    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: 'menu-management.csv',
      });
    }
  }
}
