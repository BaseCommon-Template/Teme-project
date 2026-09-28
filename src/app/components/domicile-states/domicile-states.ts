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
import {
  StateService,
  StatePayload,
  DistrictPayload,
  PoliceStationPayload,
} from '../../services/state.service';
import { CryptoHelper } from '../../helpers/crypto-helper';
import { CategoryService } from '../../services/category.service';
import { forkJoin } from 'rxjs';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface PoliceStationItem {
  ps_cd: number;
  ps_name: string;
  is_draft: boolean;
}

export interface DistrictItem {
  district_cd: number;
  district_name: string;
  is_draft: boolean;
  police_stations: PoliceStationItem[];
}

export interface StateItem {
  id: string | number;
  state_cd: number;
  state_name: string;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  districts_count: number;
  districts: DistrictItem[];
}

export interface CategoryItem {
  id: string | number;
  autocategory_id: number;
  category: string;
  sub_categories: string[];
  is_active: boolean;
  is_draft: boolean;
}

@Component({
  selector: 'app-domicile-states',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './domicile-states.html',
  styleUrl: './domicile-states.css',
})
export class DomicileStates implements OnInit, AfterViewInit {
  private gridApi!: GridApi<StateItem>;
  private readonly stateService = inject(StateService);
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLInputElement>;

  // Pagination & Grid settings matching Menu Management
  currentPage = 1;
  pageSize = 50;
  totalRecords = 0;
  totalPages = 0;
  rowHeight = 38;
  headerHeight = 30;

  readonly searchText = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<StateItem | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly showActiveOnly = signal<boolean>(true);

  readonly Math = Math;
  submitted = false;

  formData = {
    id: '' as string | number,
    state_cd: 40 as number,
    state_name: '',
    is_active: true,
    is_draft: false,
    districts: [] as DistrictItem[],
  };

  allStates: StateItem[] = [];
  rowData: StateItem[] = [];

  allCategories: CategoryItem[] = [];
  categoryRowData: CategoryItem[] = [];

  readonly showCategories = signal<boolean>(false);
  readonly selectedStateForCategory = signal<StateItem | null>(null);
  readonly isCategoryLoading = signal<boolean>(false);
  readonly isCategoryModalOpen = signal<boolean>(false);
  readonly isCategoryEditMode = signal<boolean>(false);
  readonly selectedCategory = signal<CategoryItem | null>(null);
  categoryType: 'central' | 'new' = 'central';
  selectedCentralCategoryIds: number[] = [];
  newCategoryName = '';

  categoryDropdownOpen = false;
  categorySearchText = '';

  centralCategorySubmitted = false;
  newCategorySubmitted = false;

  readonly isAddingCategory = signal<boolean>(false);

  categoryFormData = {
    autocategory_id: 0,
    category: '',
    sub_categories: [] as string[],
    is_draft: false,
    is_active: true,
  };

  newSubCategory = '';

  colDefs: ColDef<StateItem>[] = [
    {
      headerName: 'SR. NO.',
      width: 100,
      minWidth: 100,
      maxWidth: 100,
      valueGetter: (params) => {
        if (params.node?.rowIndex == null) return '';
        return (this.currentPage - 1) * this.pageSize + params.node.rowIndex + 1;
      },
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
      field: 'state_name',
      headerName: 'STATE / UT NAME',
      minWidth: 250,
      flex: 1.35,
      cellRenderer: (params: ICellRendererParams<StateItem>) => {
        if (!params.data) return '';
        return `
          <span style="
            font-size:12px;
            color:#333;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            width:100%;
            display:block;
          ">
            ${params.data.state_name}
          </span>
        `;
      },
    },
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 175,
      minWidth: 115,
      maxWidth: 135,
      cellRenderer: (params: ICellRendererParams<StateItem>) => {
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
    {
      headerName: 'ACTIONS',
      width: 250,
      minWidth: 150,
      maxWidth: 250,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params: ICellRendererParams<StateItem>) => {
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
           <button
  class="action-btn delete-btn"
  title="Show Category"
  data-action="category"
  data-id="${id}"
  style="
    width:fit-content;
    height:30px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:10px 12px;
    border:1px solid #dbeafe;
    border-radius:6px;
    background:#eff6ff;
    color:#2563eb;
    cursor:pointer;
  "
>
  Show Category
</button>
          </div>
        `;
      },
    },
  ];

  categoryColDefs: ColDef<CategoryItem>[] = [
    {
      headerName: 'SR. NO.',
      width: 100,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      sortable: false,
      filter: false,
    },
    {
      field: 'category',
      headerName: 'CATEGORY',
      minWidth: 250,
      flex: 1,
    },
    // {
    //   field: 'is_active',
    //   headerName: 'STATUS',
    //   width: 130,
    //   valueGetter: (params) => (params.data?.is_active ? 'Active' : 'Inactive'),
    // },
    // {
    //   headerName: 'ACTIONS',
    //   width: 180,
    //   sortable: false,
    //   filter: false,
    //   cellRenderer: (params: ICellRendererParams<CategoryItem>) => {
    //     const id = params.data?.id;

    //     return `
    //     <div style="
    //         display:flex;
    //         align-items:center;
    //         justify-content:flex-start;
    //         gap:8px;
    //         height:100%;
    //         padding-left:4px;
    //         box-sizing:border-box;
    //       ">
    //         <button
    //           class="action-btn edit-btn"
    //           title="Edit"
    //           data-action="edit"
    //           style="
    //             width:30px;
    //             height:30px;
    //             display:flex;
    //             align-items:center;
    //             justify-content:center;
    //             padding:0;
    //             border:1px solid #dbeafe;
    //             border-radius:6px;
    //             background:#eff6ff;
    //             color:#2563eb;
    //             cursor:pointer;
    //           "
    //         >
    //           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //             <path d="M12 20h9"></path>
    //             <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    //           </svg>
    //         </button>

    //         <button
    //           class="action-btn delete-btn"
    //           title="Delete"
    //           data-action="delete"
    //           style="
    //             width:30px;
    //             height:30px;
    //             display:flex;
    //             align-items:center;
    //             justify-content:center;
    //             padding:0;
    //             border:1px solid #fee2e2;
    //             border-radius:6px;
    //             background:#fef2f2;
    //             color:#dc2626;
    //             cursor:pointer;
    //           "
    //         >
    //           <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //             <path d="M3 6h18"></path>
    //             <path d="M8 6V4h8v2"></path>
    //             <path d="M19 6v14H5V6"></path>
    //             <path d="M10 11v6"></path>
    //             <path d="M14 11v6"></path>
    //           </svg>
    //         </button>

    //       </div>
    //   `;
    //   },
    // },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
    flex: 0,
  };

  ngOnInit(): void {
    this.loadStates();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  applyStateView(): void {
    let filtered = [...this.allStates];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.is_active === true);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((item) => (item.state_name || '').toLowerCase().includes(search));
    }

    this.totalRecords = filtered.length;
    this.totalPages = Math.ceil(this.totalRecords / this.pageSize) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    this.rowData = filtered.slice(start, start + this.pageSize);

    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', [...this.rowData]);
    }
  }

  loadStates(page: number = this.currentPage): void {
    this.isLoading.set(true);

    this.stateService.getAllStateNew(1, 1000).subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;

        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('State Decryption Error:', err);
          }
        }

        let records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : [];

        this.allStates = records.map((item: any, index: number): StateItem => {
          const stateObj = item.State || item;
          const rawDistricts = Array.isArray(stateObj.Districts)
            ? stateObj.Districts
            : Array.isArray(stateObj.districts)
              ? stateObj.districts
              : [];

          const parsedDistricts: DistrictItem[] = rawDistricts.map((d: any, dIdx: number) => {
            const rawPs = Array.isArray(d.PoliceStations)
              ? d.PoliceStations
              : Array.isArray(d.police_stations)
                ? d.police_stations
                : [];

            const parsedPs: PoliceStationItem[] = rawPs.map((p: any, pIdx: number) => ({
              ps_cd: Number(
                p.PsCd ?? p.ps_cd ?? Number(d.DistrictCd ?? d.district_cd ?? 0) * 100 + (pIdx + 1),
              ),
              ps_name: p.PsName ?? p.ps_name ?? '',
              is_draft: p.IsDraft ?? p.is_draft ?? false,
            }));

            return {
              district_cd: Number(
                d.DistrictCd ??
                  d.district_cd ??
                  Number(stateObj.StateCd ?? stateObj.state_cd ?? 0) * 1000 + (dIdx + 1),
              ),
              district_name: d.DistrictName ?? d.district_name ?? '',
              is_draft: d.IsDraft ?? d.is_draft ?? false,
              police_stations: parsedPs,
            };
          });

          const stateCd = Number(stateObj.StateCd ?? stateObj.state_cd ?? index + 1);

          return {
            id: stateObj.Id || stateObj.id || stateCd || index + 1,
            state_cd: stateCd,
            state_name: stateObj.StateName ?? stateObj.state_name ?? stateObj.Name ?? '',
            is_active: stateObj.IsActive ?? stateObj.is_active ?? true,
            is_draft: stateObj.IsDraft ?? stateObj.is_draft ?? false,
            created_at: stateObj.CreatedAt ?? stateObj.created_at ?? '',
            districts_count: parsedDistricts.length,
            districts: parsedDistricts,
          };
        });

        this.applyStateView();
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('State GetAll API Error:', error);
        this.isLoading.set(false);
        this.allStates = [];
        this.rowData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
      },
    });
  }

  loadCentralCategories(): void {
    this.isCategoryLoading.set(true);

    this.categoryService.getAllCategory(0, undefined, 1, 1000).subscribe({
      next: (res: any) => {
        try {
          let data: any = res?.data ?? res;

          if (typeof data === 'string') {
            const decrypted = CryptoHelper.decrypt(data);

            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          }

          const records: any[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.records)
              ? data.records
              : Array.isArray(data?.data)
                ? data.data
                : [];

          this.allCategories = records.map((item: any): CategoryItem => ({
            id: item.AutoCategoryId ?? item.autocategory_id ?? item.autoCategoryId ?? item.id ?? 0,

            autocategory_id: Number(
              item.AutoCategoryId ?? item.autocategory_id ?? item.autoCategoryId ?? item.id ?? 0,
            ),

            category: item.CategoryName ?? item.category ?? item.Category ?? '',

            sub_categories: Array.isArray(item.SubCategories)
              ? item.SubCategories
              : Array.isArray(item.sub_categories)
                ? item.sub_categories
                : [],

            is_active: item.IsActive ?? item.is_active ?? true,

            is_draft: item.IsDraft ?? item.is_draft ?? false,
          }));

          this.isCategoryLoading.set(false);
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Central Category Decryption Error:', error);

          this.allCategories = [];
          this.isCategoryLoading.set(false);
        }
      },

      error: (error) => {
        console.error('Central Category API Error:', error);

        this.allCategories = [];
        this.isCategoryLoading.set(false);

        Swal.fire({
          icon: 'error',
          title: 'Unable to Load Categories',
          text: 'Central categories could not be loaded.',
        });
      },
    });
  }

  onCategoryTypeChange(type: 'central' | 'new'): void {
    this.categoryType = type;

    this.categoryDropdownOpen = false;
    this.categorySearchText = '';

    this.centralCategorySubmitted = false;
    this.newCategorySubmitted = false;

    if (type === 'central') {
      this.newCategoryName = '';
    } else {
      this.selectedCentralCategoryIds = [];
    }
  }

  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  get filteredCentralCategories(): CategoryItem[] {
    const search = this.categorySearchText.trim().toLowerCase();

    return this.allCategories.filter((category) => {
      if (!category.is_active) {
        return false;
      }

      if (!search) {
        return true;
      }

      return category.category.toLowerCase().includes(search);
    });
  }

  isCentralCategorySelected(categoryId: number): boolean {
    return this.selectedCentralCategoryIds.includes(categoryId);
  }

  toggleCentralCategory(categoryId: number): void {
    const index = this.selectedCentralCategoryIds.indexOf(categoryId);

    if (index === -1) {
      this.selectedCentralCategoryIds = [...this.selectedCentralCategoryIds, categoryId];
    } else {
      this.selectedCentralCategoryIds = this.selectedCentralCategoryIds.filter(
        (id) => id !== categoryId,
      );
    }

    this.centralCategorySubmitted = false;
  }

  removeCentralCategory(categoryId: number): void {
    this.selectedCentralCategoryIds = this.selectedCentralCategoryIds.filter(
      (id) => id !== categoryId,
    );
  }

  getSelectedCentralCategories(): CategoryItem[] {
    return this.allCategories.filter((category) =>
      this.selectedCentralCategoryIds.includes(Number(category.autocategory_id)),
    );
  }

  onCategorySearchChange(value: string): void {
    this.categorySearchText = value;
  }

  clearCategorySearch(): void {
    this.categorySearchText = '';
  }

  preventStateNameInvalidCharacters(event: KeyboardEvent): void {
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

  sanitizeStateName(): void {
    this.formData.state_name = this.formData.state_name
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  onStateCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/\D/g, '').slice(0, 8);

    this.formData.state_cd = Number(input.value) || 0;
  }

  addCategoryToState(): void {
    const state = this.selectedStateForCategory();

    if (!state) {
      return;
    }

    // =====================================================
    // CENTRAL CATEGORY
    // =====================================================

    if (this.categoryType === 'central') {
      this.centralCategorySubmitted = true;

      if (this.selectedCentralCategoryIds.length === 0) {
        return;
      }

      this.isAddingCategory.set(true);

      // One API call for every selected category
      const requests = this.selectedCentralCategoryIds.map((categoryId) => {
        // console.log('Adding category ID:', categoryId);

        return this.categoryService.addStateCategory(
          Number(categoryId),
          '',
          [],
          [Number(state.state_cd)],
          true,
          false,
        );
      });

      forkJoin(requests).subscribe({
        next: (responses) => {
          const failedResponse = responses.find((response: any) => {
            const data = this.getCategoryApiResponse(response);

            return Number(data?.code) === 0;
          });

          if (failedResponse) {
            const data = this.getCategoryApiResponse(failedResponse);

            this.isAddingCategory.set(false);

            Swal.fire({
              icon: 'error',
              title: 'Unable to Add Category',
              text: data?.message || data?.Message || 'Category could not be added.',
            });

            return;
          }

          this.handleCategoryAddSuccess();
        },

        error: (error) => {
          this.isAddingCategory.set(false);

          Swal.fire({
            icon: 'error',
            title: 'Unable to Add Category',
            text: this.getCategoryApiErrorMessage(error, 'Unable to add category.'),
          });
        },
      });

      return;
    }

    // =====================================================
    // NEW CATEGORY
    // =====================================================

    this.newCategorySubmitted = true;

    const categoryName = (this.categoryFormData.category || '').trim();

    if (!categoryName) {
      return;
    }

    if (categoryName.length > 100) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Category',
        text: 'Category Name cannot exceed 100 characters.',
      });

      return;
    }

    this.isAddingCategory.set(true);

    this.categoryService
      .addStateCategory(0, categoryName, [], [Number(state.state_cd)], true, false)
      .subscribe({
        next: (response) => {
          const data = this.getCategoryApiResponse(response);

          if (Number(data?.code) === 0) {
            this.isAddingCategory.set(false);

            Swal.fire({
              icon: 'error',
              title: 'Unable to Add Category',
              text: data?.message || data?.Message || 'Category could not be added.',
            });

            return;
          }

          this.handleCategoryAddSuccess();
        },
        error: (error) => {
          console.error('ADD NEW CATEGORY ERROR:', error);

          this.isAddingCategory.set(false);

          Swal.fire({
            icon: 'error',
            title: 'Unable to Add Category',
            text: this.getCategoryApiErrorMessage(error, 'Unable to add category.'),
          });
        },
      });
  }

  preventCategoryNameInvalidCharacters(event: KeyboardEvent): void {
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

    // Only letters, numbers, space, underscore, hyphen, slash, parentheses
    if (!/^[A-Za-z0-9 _()/\-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeCategoryName(): void {
    this.categoryFormData.category = (this.categoryFormData.category || '')
      .replace(/[^A-Za-z0-9 _()/\-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  private getCategoryApiErrorMessage(error: any, fallback: string): string {
    const candidates = [
      error?.error?.message,
      error?.error?.Message,

      error?.error?.messageText,
      error?.error?.MessageText,

      error?.message,

      error?.error?.error,
      error?.error?.Error,

      error?.error?.data?.message,
      error?.error?.data?.Message,

      error?.error?.result?.message,
      error?.error?.result?.Message,
    ];

    const message = candidates.find(
      (value) => value !== undefined && value !== null && String(value).trim() !== '',
    );

    if (message) {
      return String(message);
    }

    return fallback;
  }

  private handleCategoryAddSuccess(): void {
    this.isAddingCategory.set(false);

    this.isCategoryModalOpen.set(false);

    this.selectedCentralCategoryIds = [];
    this.newCategoryName = '';
    this.categoryFormData.category = '';
    this.categoryType = 'central';

    const state = this.selectedStateForCategory();

    if (state) {
      this.showCategoryTable(state);
    }

    Swal.fire({
      icon: 'success',
      title: 'Category Added',
      text: 'Category added successfully.',
      timer: 1600,
      showConfirmButton: false,
    });
  }

  private getCategoryApiResponse(res: any): any {
    if (res?.code !== undefined || res?.message !== undefined) {
      return res;
    }

    if (typeof res === 'string') {
      try {
        const decrypted = CryptoHelper.decrypt(res);

        return typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
      } catch (error) {
        console.error('Category Add Response Decryption Error:', error);
        return res;
      }
    }

    const data = res?.data ?? res?.Data ?? res?.result ?? res;

    if (typeof data === 'string') {
      try {
        const decrypted = CryptoHelper.decrypt(data);

        return typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
      } catch (error) {
        console.error('Category Add Response Decryption Error:', error);
      }
    }

    return data;
  }

  closeCategoryAddModal(): void {
    this.isCategoryModalOpen.set(false);

    this.selectedCentralCategoryIds = [];
    this.newCategoryName = '';
    this.categoryFormData.category = '';
    this.categoryType = 'central';
  }

  onGridReady(params: GridReadyEvent<StateItem>): void {
    this.gridApi = params.api;
    if (this.rowData.length) {
      this.gridApi.setGridOption('rowData', this.rowData);
    }
  }

  onSearchChange(text: string): void {
    this.searchText.set(text);
    this.currentPage = 1;
    this.applyStateView();
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((v) => !v);
    this.currentPage = 1;
    this.applyStateView();
  }

  onPageSizeChange(value: string): void {
    this.pageSize = Number(value) || 20;
    this.currentPage = 1;
    this.applyStateView();
  }

  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;
    const button = target?.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    const item = this.rowData.find((r) => String(r.id) === String(id));

    if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.confirmDelete(item);
    } else if (action === 'category' && item) {
      this.showCategoryTable(item);
    }
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.submitted = false;

    const nextCd =
      this.rowData.length > 0
        ? Math.max(...this.rowData.map((r) => Number(r.state_cd) || 0)) + 1
        : 40;

    this.formData = {
      id: '',
      state_cd: nextCd,
      state_name: '',
      is_active: true,
      is_draft: false,
      districts: [],
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  openEditModal(item: StateItem): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);
    this.submitted = false;

    this.formData = {
      id: item.id,
      state_cd: item.state_cd,
      state_name: item.state_name,
      is_active: item.is_active,
      is_draft: item.is_draft,
      districts: item.districts ? JSON.parse(JSON.stringify(item.districts)) : [],
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.isEditMode.set(false);
    this.selectedItem.set(null);
  }

  addDistrict(): void {
    const stateCd = Number(this.formData.state_cd) || 40;
    const nextDistrictCd =
      this.formData.districts.length > 0
        ? Math.max(...this.formData.districts.map((d) => Number(d.district_cd) || 0)) + 1
        : stateCd * 1000 + 1;

    this.formData.districts.push({
      district_cd: nextDistrictCd,
      district_name: '',
      is_draft: this.formData.is_draft,
      police_stations: [],
    });
  }

  removeDistrict(index: number): void {
    this.formData.districts.splice(index, 1);
  }

  addPoliceStation(districtIndex: number): void {
    const dist = this.formData.districts[districtIndex];
    const distCd = Number(dist.district_cd) || 40001;
    const nextPsCd =
      dist.police_stations.length > 0
        ? Math.max(...dist.police_stations.map((p) => Number(p.ps_cd) || 0)) + 1
        : distCd * 100 + 1;

    dist.police_stations.push({
      ps_cd: nextPsCd,
      ps_name: '',
      is_draft: dist.is_draft,
    });
  }

  removePoliceStation(districtIndex: number, psIndex: number): void {
    this.formData.districts[districtIndex].police_stations.splice(psIndex, 1);
  }

  saveState(): void {
    this.submitted = true;
    const stateName = this.formData.state_name.trim();

    if (!stateName) {
      return;
    }

    this.isLoading.set(true);
    const stateCd = Number(this.formData.state_cd) || 0;

    const districtsPayload: DistrictPayload[] = this.formData.districts.map((d) => ({
      district_cd: Number(d.district_cd) || 0,
      district_name: d.district_name.trim(),
      is_draft: !!d.is_draft,
      police_stations: (d.police_stations || []).map((p) => ({
        ps_cd: Number(p.ps_cd) || 0,
        ps_name: p.ps_name.trim(),
        is_draft: !!p.is_draft,
      })),
    }));

    const statePayload: StatePayload = {
      state_cd: stateCd,
      state_name: stateName,
      is_draft: !!this.formData.is_draft,
      is_active: !!this.formData.is_active,
      districts: districtsPayload,
    };

    if (this.isEditMode()) {
      this.stateService.updateState(statePayload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: `State "${stateName}" updated successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadStates();
        },
        error: () => {
          this.isLoading.set(false);
          const idx = this.rowData.findIndex((r) => String(r.id) === String(this.formData.id));
          if (idx !== -1) {
            this.rowData[idx] = {
              ...this.rowData[idx],
              state_name: stateName,
              state_cd: stateCd,
              is_active: this.formData.is_active,
              is_draft: this.formData.is_draft,
              districts_count: this.formData.districts.length,
              districts: JSON.parse(JSON.stringify(this.formData.districts)),
            };
            if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
          }
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Saved',
            text: `State "${stateName}" saved successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
      });
    } else {
      this.stateService.addState(statePayload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Created',
            text: `State "${stateName}" added successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadStates();
        },
        error: () => {
          this.isLoading.set(false);
          const newRecord: StateItem = {
            id: Date.now().toString(),
            state_cd: stateCd,
            state_name: stateName,
            is_active: this.formData.is_active,
            is_draft: this.formData.is_draft,
            created_at: new Date().toISOString(),
            districts_count: this.formData.districts.length,
            districts: JSON.parse(JSON.stringify(this.formData.districts)),
          };
          this.rowData = [newRecord, ...this.rowData];
          this.totalRecords++;
          if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Created',
            text: `State "${stateName}" added successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
      });
    }
  }

  confirmDelete(item: StateItem): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete state "${item.state_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);
        this.stateService.deleteState(item.state_cd).subscribe({
          next: () => {
            this.isLoading.set(false);
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: `State "${item.state_name}" has been deleted.`,
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadStates();
          },
          error: () => {
            this.isLoading.set(false);
            this.rowData = this.rowData.filter((r) => r.id !== item.id);
            this.totalRecords = Math.max(0, this.totalRecords - 1);
            if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: `State "${item.state_name}" has been deleted.`,
              timer: 2000,
              showConfirmButton: false,
            });
          },
        });
      }
    });
  }

  backToStates(): void {
    this.showCategories.set(false);

    this.selectedStateForCategory.set(null);
    this.categoryRowData = [];
    this.allCategories = [];
  }

  showCategoryTable(state: StateItem): void {
    this.selectedStateForCategory.set(state);
    this.showCategories.set(true);
    this.isCategoryLoading.set(true);

    this.categoryService.getAllCategoryCondition(state.state_cd, undefined, 1, 1000).subscribe({
      next: (res: any) => {
        // console.log('========== CATEGORY API RESPONSE ==========', res);

        let data: any = res?.data ?? res;

        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (error) {
            console.error('Category Decryption Error:', error);
          }
        }

        const records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.Category)
                ? data.Category
                : [];

        this.allCategories = records.map((item: any): CategoryItem => ({
          id: item.AutoCategoryId ?? item.autocategory_id ?? item.autoCategoryId ?? item.id ?? 0,

          autocategory_id: Number(
            item.AutoCategoryId ?? item.autocategory_id ?? item.autoCategoryId ?? item.id ?? 0,
          ),

          category: item.CategoryName ?? item.category ?? item.Category ?? '',

          sub_categories: Array.isArray(item.SubCategories)
            ? item.SubCategories
            : Array.isArray(item.sub_categories)
              ? item.sub_categories
              : [],

          is_active: item.IsActive ?? item.is_active ?? true,

          is_draft: item.IsDraft ?? item.is_draft ?? false,
        }));

        this.categoryRowData = [...this.allCategories];

        this.isCategoryLoading.set(false);
        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Category GetAll API Error:', error);

        this.allCategories = [];
        this.categoryRowData = [];
        this.isCategoryLoading.set(false);
      },
    });
  }

  openCategoryAddModal(): void {
    const state = this.selectedStateForCategory();

    if (!state) {
      Swal.fire({
        icon: 'warning',
        title: 'State Not Selected',
        text: 'Please select a state first.',
      });

      return;
    }

    this.categoryType = 'central';

    this.selectedCentralCategoryIds = [];

    this.newCategoryName = '';
    this.categoryFormData.category = '';

    this.categoryDropdownOpen = false;
    this.categorySearchText = '';

    this.centralCategorySubmitted = false;
    this.newCategorySubmitted = false;

    this.isCategoryModalOpen.set(true);

    this.loadCentralCategories();
  }

  exportCsv(): void {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `Domicile_States_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  }

  goToFirstPage(): void {
    if (this.currentPage === 1) return;
    this.currentPage = 1;
    this.applyStateView();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.applyStateView();
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.applyStateView();
  }

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage = this.totalPages;
    this.applyStateView();
  }
}
