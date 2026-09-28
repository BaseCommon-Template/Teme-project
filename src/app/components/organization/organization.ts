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

import { OrganisationService, OrganisationTypeMaster } from '../../services/organisation.service';
import { StateService } from '../../services/state.service';
import { CryptoHelper } from '../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

// =====================================================
// FLATTENED ROW — one row per nested `organisation`,
// carrying its parent organisation_type_id for CRUD calls
// =====================================================

export interface OrganizationItem {
  id: number; // organisation_id
  organisation_type_id: number;
  organization_name: string;
  organization_type: string; // display name of the parent type
  short_name: string;
  hq_street_address: string;
  city: string;
  state: string;
  state_cd: number | null;
  pincode: string;
  official_website: string;
  is_active: boolean;
  created_at: string;
}

export interface StateOption {
  state_cd: number;
  state_name: string;
  is_active?: boolean;
}

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './organization.html',
  styleUrl: './organization.css',
})
export class Organization implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLElement>;

  private gridApi!: GridApi<OrganizationItem>;
  private readonly organisationService = inject(OrganisationService);
  private readonly stateService = inject(StateService);
  readonly Math = Math;

  rowsPerPage = 20;
  currentPage = 1;
  totalRecords = 0;
  totalPages = 1;

  // =====================================================
  // STATE
  // =====================================================

  readonly searchText = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<OrganizationItem | null>(null);
  readonly showActiveOnly = signal<boolean>(true);
  readonly showInactive = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  /** Populates the ORGANIZATION TYPE dropdown; source of truth is the API. */
  readonly organisationTypes = signal<OrganisationTypeMaster[]>([]);
  readonly states = signal<StateOption[]>([]);

  formData: {
    id: number;
    organisation_type_id: number | null;
    organization_name: string;
    short_name: string;
    hq_street_address: string;
    city: string;
    state: string | null;
    pincode: string;
    official_website: string;
    is_active: boolean;
  } = {
    id: 0,
    organisation_type_id: null,
    organization_name: '',
    short_name: '',
    hq_street_address: '',
    city: '',
    state: null,
    pincode: '',
    official_website: '',
    is_active: true,
  };

  allOrganisations: OrganizationItem[] = [];
  rowData: OrganizationItem[] = [];

  // =====================================================
  // AG GRID COLUMNS (unchanged from your version)
  // =====================================================

  colDefs: ColDef<OrganizationItem>[] = [
    {
      headerName: 'SR. NO.',
      valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
      width: 90,
      minWidth: 90,
      maxWidth: 90,
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
      field: 'organization_name',
      headerName: 'ORGANIZATION',
      minWidth: 280,
      flex: 1.3,
      cellRenderer: (params: ICellRendererParams<OrganizationItem>) => {
        if (!params.data) return '';
        return `<span style="font-size:12px;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;display:block;font-weight:600;">${params.data.organization_name}</span>`;
      },
    },
    {
      field: 'organization_type',
      headerName: 'ORGANIZATION TYPE',
      minWidth: 260,
      flex: 1.2,
      cellRenderer: (params: ICellRendererParams<OrganizationItem>) => {
        if (!params.data) return '';
        return `<span style="display:inline-flex;align-items:center;height:26px;padding:0 11px;border-radius:12px;background:#f1f5f9;color:#29466b;font-size:11px;font-weight:700;letter-spacing:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${params.data.organization_type}</span>`;
      },
    },
    {
      field: 'short_name',
      headerName: 'SHORT NAME',
      width: 120,
      minWidth: 100,
      maxWidth: 130,
      cellRenderer: (params: ICellRendererParams<OrganizationItem>) => {
        return `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:28px;padding:0 9px;border-radius:9px;background:#eff6ff;border:1px solid #dbeafe;color:#2563eb;font-size:11px;font-weight:700;">${params.value || '-'}</span>`;
      },
    },
    {
      field: 'hq_street_address',
      headerName: 'HQ',
      minWidth: 280,
      flex: 1.25,
      cellRenderer: (params: ICellRendererParams<OrganizationItem>) => {
        return `<span style="font-size:12px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;width:100%;">${params.value || '-'}</span>`;
      },
    },
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 145,
      minWidth: 130,
      maxWidth: 145,
      cellRenderer: (params: ICellRendererParams<OrganizationItem>) => {
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
      cellRenderer: (params: ICellRendererParams<OrganizationItem>) => {
        const id = params.data?.id;
        return `
          <div style="display:flex;align-items:center;justify-content:flex-start;gap:8px;height:100%;padding-left:4px;box-sizing:border-box;">
            <button class="action-btn edit-btn" title="Edit" data-action="edit" data-id="${id}" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid #dbeafe;border-radius:6px;background:#eff6ff;color:#2563eb;cursor:pointer;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </button>
            <button class="action-btn delete-btn" title="Delete" data-action="delete" data-id="${id}" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid #fee2e2;border-radius:6px;background:#fef2f2;color:#dc2626;cursor:pointer;">
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

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.loadOrganisations();
    this.loadStates();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
  }

  onGridReady(params: GridReadyEvent<OrganizationItem>): void {
    this.gridApi = params.api;
    this.applyOrganisationView();
  }

  private loadStates(): void {
    this.stateService.getAllState(1, 50).subscribe({
      next: (res: any) => {
        try {
          let data: any = res?.data ?? res?.Data ?? res;

          // API response encrypted ho to decrypt
          if (typeof data === 'string') {
            try {
              const decrypted = CryptoHelper.decrypt(data);
              data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
            } catch (error) {
              console.error('State Decryption Error:', error);
            }
          }

          const records: any[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.records)
              ? data.records
              : Array.isArray(data?.data)
                ? data.data
                : [];

          const stateList: StateOption[] = records
            .map((item: any) => {
              const state = item?.State ?? item;

              return {
                state_cd: Number(state?.StateCd ?? state?.state_cd ?? state?.stateCd ?? 0),
                state_name: state?.StateName ?? state?.state_name ?? state?.stateName ?? '',
                is_active: state?.IsActive ?? state?.is_active ?? true,
              };
            })
            .filter((state: StateOption) => state.state_cd > 0 && state.state_name);

          this.states.set(stateList);
        } catch (error) {
          console.error('Failed to parse States:', error);
          this.states.set([]);
        }
      },

      error: (error: any) => {
        console.error('State API Error:', error);
        this.states.set([]);

        Swal.fire({
          icon: 'error',
          title: 'Unable to Load States',
          text: 'Unable to load state list.',
          confirmButtonColor: '#1c52a3',
        });
      },
    });
  }

  // =====================================================
  // VIEW COMPUTATION & PAGINATION CONTROLS
  // =====================================================

  applyOrganisationView(): void {
    let filtered = [...this.allOrganisations];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.is_active === true);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((item) =>
        [
          item.organization_name,
          item.organization_type,
          item.short_name,
          item.hq_street_address,
          item.city,
          item.state,
          item.pincode,
        ].some((val) =>
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

  onRowsPerPageChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = Number(select.value);
    if (!value) return;

    this.rowsPerPage = value;
    this.currentPage = 1;
    this.applyOrganisationView();
  }

  goToFirstPage(): void {
    if (this.currentPage > 1) {
      this.currentPage = 1;
      this.applyOrganisationView();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyOrganisationView();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyOrganisationView();
    }
  }

  goToLastPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage = this.totalPages;
      this.applyOrganisationView();
    }
  }

  // =====================================================
  // LOAD FROM API
  // =====================================================

  private loadOrganisations(page: number = this.currentPage): void {
    this.isLoading.set(true);

    this.organisationService.getAll(undefined, 1, 1000).subscribe({
      next: (result: any) => {
        const master = result?.OrganisationMaster ?? result;
        const types: OrganisationTypeMaster[] =
          master?.records ??
          result?.records ??
          result?.data?.OrganisationMaster?.records ??
          result?.data?.records ??
          (Array.isArray(master) ? master : []);

        this.organisationTypes.set(types);
        this.allOrganisations = this.flattenTypes(types);
        this.applyOrganisationView();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[Organization] Load error:', err);
        this.isLoading.set(false);
        this.allOrganisations = [];
        this.rowData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
      },
    });
  }

  private flattenTypes(types: OrganisationTypeMaster[]): OrganizationItem[] {
    if (!Array.isArray(types)) return [];

    return types.flatMap((type) =>
      (type.organisations ?? []).map((org) => ({
        id: org.organisation_id,
        organisation_type_id: type.organisation_type_id,
        organization_name: org.organisation_name,
        organization_type: type.organisation_type || type.short_name || '',
        short_name: org.short_name,
        hq_street_address: org.hq_street_address,
        city: org.hq_city,
        state: org.hq_state,
        state_cd: null,
        pincode: String(org.hq_pincode ?? ''),
        official_website: org.official_website_url,
        is_active: org.is_active ?? true,
        created_at: '',
      })),
    );
  }

  // =====================================================
  // ORGANIZATION NAME
  // Allowed: A-Z, a-z, space, hyphen (-)
  // =====================================================

  preventOrganizationNameInvalidCharacters(event: KeyboardEvent): void {
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

    // Only letters, space and hyphen
    if (!/^[A-Za-z _-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeOrganizationName(): void {
    this.formData.organization_name = this.formData.organization_name
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ');
  }

  // =====================================================
  // SHORT NAME
  // Allowed: A-Z, a-z, hyphen (-)
  // Space NOT allowed
  // =====================================================

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

    // Only letters and hyphen
    if (!/^[A-Za-z_-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeShortName(): void {
    this.formData.short_name = this.formData.short_name.replace(/[^A-Za-z_-]/g, '');
  }

  sanitizePincode(): void {
    this.formData.pincode = this.formData.pincode.replace(/\D/g, '').slice(0, 6);
  }

  // =====================================================
  // SEARCH / FILTER
  // =====================================================

  onSearchChange(text: string): void {
    this.searchText.set(text);
    this.currentPage = 1;
    this.applyOrganisationView();
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((value) => !value);
    this.currentPage = 1;
    this.applyOrganisationView();
  }

  toggleInactiveFilter(): void {
    this.showInactive.update((value) => !value);
    this.currentPage = 1;
    this.applyOrganisationView();
  }

  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;
    const button = target?.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const id = Number(button.getAttribute('data-id'));
    const item = this.rowData.find((row) => row.id === id);

    if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.confirmDelete(item);
    }
  }

  // =====================================================
  // ADD / EDIT MODAL
  // =====================================================

  submitted = false;

  openAddModal(): void {
    this.submitted = false;
    this.isEditMode.set(false);
    this.selectedItem.set(null);

    this.formData = {
      id: 0,
      organisation_type_id: null,
      organization_name: '',
      short_name: '',
      hq_street_address: '',
      city: '',
      state: null,
      pincode: '',
      official_website: '',
      is_active: true,
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
  }

  isCentralType(): boolean {
    if (!this.formData.organisation_type_id) return false;
    const selected = this.organisationTypes().find(
      (type) => Number(type.organisation_type_id) === Number(this.formData.organisation_type_id),
    );
    if (!selected || !selected.type) return false;
    const typeStr = String(selected.type).trim().toLowerCase();
    return typeStr === 'centre' || typeStr === 'central';
  }

  preventStateInvalidCharacters(event: KeyboardEvent): void {
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

    if (!/^[A-Za-z ._-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeState(): void {
    if (typeof this.formData.state === 'string') {
      this.formData.state = this.formData.state.replace(/[^A-Za-z ._-]/g, '');
    }
  }

  openEditModal(item: OrganizationItem): void {
    this.submitted = false;
    this.isEditMode.set(true);
    this.selectedItem.set(item);

    // API se aayi state ko states master ke according match karo
    const apiState = String(item.state ?? '').trim();

    const matchedState = this.states().find(
      (state) =>
        String(state.state_name ?? '')
          .trim()
          .toLowerCase() === apiState.toLowerCase(),
    );

    this.formData = {
      id: item.id,
      organisation_type_id: item.organisation_type_id,
      organization_name: item.organization_name,
      short_name: item.short_name,
      hq_street_address: item.hq_street_address,
      city: item.city,

      // IMPORTANT: If matched in master use that, otherwise use apiState directly (e.g. for Central type free-text)
      state: matchedState?.state_name ?? (apiState || null),

      pincode: item.pincode,
      official_website: item.official_website,
      is_active: item.is_active,
    };

    this.isModalOpen.set(true);

    setTimeout(() => {
      this.firstFormInput?.nativeElement.focus();
    }, 100);
  }

  closeModal(): void {
    this.submitted = false;
    this.isModalOpen.set(false);
  }

  // =====================================================
  // SAVE (Add / Update via API)
  // =====================================================

  saveOrganization(): void {
    this.submitted = true;

    const orgNameRegex = /^[A-Za-z]+(?:[ _-][A-Za-z]+)*$/;
    const shortNameRegex = /^[A-Za-z]+(?:[_-][A-Za-z]+)*$/;
    const addressRegex = /^[A-Za-z0-9\s.,/#-]{3,200}$/;
    const cityStateRegex = /^[A-Za-z\s.-]{2,50}$/;
    const pincodeRegex = /^[0-9]{6}$/;
    const websiteRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;

    if (!this.formData.organisation_type_id) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please select Organization Type.',
      });
      return;
    }
    if (!this.formData.organization_name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter Organization Name.',
      });
      return;
    }
    if (!orgNameRegex.test(this.formData.organization_name.trim())) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Format',
        text: 'Organization Name contains invalid characters or length (2-150 allowed).',
      });
      return;
    }
    if (
      this.formData.short_name &&
      this.formData.short_name.trim() &&
      !shortNameRegex.test(this.formData.short_name.trim())
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Format',
        text: 'Short Name can contain only letters and hyphen (-). Spaces are not allowed.',
      });
      return;
    }
    if (
      !this.formData.hq_street_address.trim() ||
      !addressRegex.test(this.formData.hq_street_address.trim())
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Format',
        text: 'Please enter valid HQ Street Address (3-200 characters).',
      });
      return;
    }

    // Central vs State validation
    if (this.isCentralType()) {
      if (!this.formData.state || !this.formData.state.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Required Field',
          text: 'Please enter State.',
          confirmButtonColor: '#1c52a3',
        });
        return;
      }
      if (!cityStateRegex.test(this.formData.state.trim())) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Format',
          text: 'Please enter valid State name (letters and spaces only).',
          confirmButtonColor: '#1c52a3',
        });
        return;
      }
    } else {
      if (!this.formData.city.trim() || !cityStateRegex.test(this.formData.city.trim())) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Format',
          text: 'Please enter valid City name (letters and spaces only).',
        });
        return;
      }
      if (!this.formData.state) {
        Swal.fire({
          icon: 'warning',
          title: 'Required Field',
          text: 'Please select State.',
          confirmButtonColor: '#1c52a3',
        });
        return;
      }
      if (!this.formData.pincode.trim() || !pincodeRegex.test(this.formData.pincode.trim())) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid Format',
          text: 'Please enter a valid 6-digit numeric Pincode.',
        });
        return;
      }
    }

    if (
      this.formData.official_website &&
      this.formData.official_website.trim() &&
      !websiteRegex.test(this.formData.official_website.trim())
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Format',
        text: 'Please enter a valid Website URL (e.g. https://example.com).',
      });
      return;
    }

    const organisationTypeId = this.formData.organisation_type_id!;
    const isCentral = this.isCentralType();
    const hqCity = isCentral ? '' : this.formData.city.trim();
    const hqPincode = isCentral ? 0 : Number(this.formData.pincode.trim());
    const hqState = (this.formData.state ?? '').trim();

    if (this.isEditMode()) {
      this.organisationService
        .updateOrganisation({
          organisation_type_id: organisationTypeId,
          organisation_id: this.formData.id,
          organisation_name: this.formData.organization_name.trim(),
          short_name: this.formData.short_name.trim().toUpperCase(),
          hq_street_address: this.formData.hq_street_address.trim(),
          hq_pincode: hqPincode,
          hq_city: hqCity,
          hq_state: hqState,
          official_website_url: this.formData.official_website.trim(),
          is_active: this.formData.is_active,
          is_draft: false,
          posts: [],
        })
        .subscribe({
          next: (res: any) => {
            if (
              res &&
              (res.code === 0 || res.code === '0' || res.status === false || res.status === 0)
            ) {
              Swal.fire({
                icon: 'warning',
                title: res.message || 'Save Failed',
                text: res.message || 'Failed to update organization.',
                confirmButtonColor: '#1c52a3',
              });
              return;
            }
            Swal.fire({
              icon: 'success',
              title: 'Updated Successfully',
              text:
                res?.message ||
                `Organization "${this.formData.organization_name}" has been updated.`,
              timer: 1800,
              showConfirmButton: false,
            });
            this.closeModal();
            this.loadOrganisations();
          },
          error: (err: any) => this.showSaveError(err),
        });
    } else {
      this.organisationService
        .addOrganisation(organisationTypeId, {
          organisation_id: 0,
          organisation_name: this.formData.organization_name.trim(),
          short_name: this.formData.short_name.trim().toUpperCase(),
          hq_street_address: this.formData.hq_street_address.trim(),
          hq_pincode: hqPincode,
          hq_city: hqCity,
          hq_state: hqState,
          official_website_url: this.formData.official_website.trim(),
          is_draft: false,
          posts: [],
        })
        .subscribe({
          next: (res: any) => {
            if (
              res &&
              (res.code === 0 || res.code === '0' || res.status === false || res.status === 0)
            ) {
              Swal.fire({
                icon: 'warning',
                title: res.message || 'Organisation already exists',
                text: res.message || 'Organisation already exists',
                confirmButtonColor: '#1c52a3',
              });
              return;
            }
            Swal.fire({
              icon: 'success',
              title: 'Added Successfully',
              text:
                res?.message ||
                `Organization "${this.formData.organization_name}" has been created.`,
              timer: 1800,
              showConfirmButton: false,
            });
            this.closeModal();
            this.loadOrganisations();
          },
          error: (err: any) => this.showSaveError(err),
        });
    }
  }

  private showSaveError(err?: any): void {
    const msg =
      err?.error?.message || err?.message || 'Something went wrong while saving. Please try again.';
    Swal.fire({
      icon: 'warning',
      title: msg,
      text: msg,
      confirmButtonColor: '#1c52a3',
    });
  }

  // =====================================================
  // DELETE (via API)
  // =====================================================

  confirmDelete(item: OrganizationItem): void {
    Swal.fire({
      title: 'Delete Organization?',
      text: `Are you sure you want to delete "${item.organization_name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.organisationService.deleteOrganisation(item.organisation_type_id, item.id).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: `"${item.organization_name}" has been removed.`,
            timer: 1500,
            showConfirmButton: false,
          });
          this.loadOrganisations();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Something went wrong while deleting. Please try again.',
          });
        },
      });
    });
  }

  // =====================================================
  // EXPORT
  // =====================================================

  exportCsv(): void {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `organizations_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  }

  // =====================================================
  // COUNTS
  // =====================================================

  get totalCount(): number {
    return this.rowData.length;
  }

  get activeCount(): number {
    return this.rowData.filter((row) => row.is_active).length;
  }

  get inactiveCount(): number {
    return this.rowData.filter((row) => !row.is_active).length;
  }
}
