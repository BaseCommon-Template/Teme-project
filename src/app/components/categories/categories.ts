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
import { Router } from '@angular/router';
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

import { CategoryService } from '../../services/category.service';

// =====================================================
// AG GRID MODULE
// =====================================================

ModuleRegistry.registerModules([AllCommunityModule]);

// =====================================================
// CATEGORY INTERFACE
// =====================================================

export interface CategoryItem {
  id: number;

  category: string;

  sub_categories: string[];

  is_active: boolean;

  is_draft: boolean;

  created_at: string;
}

// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLInputElement>;

  // =====================================================
  // REGEX
  // =====================================================

  private readonly categoryNameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;

  // =====================================================
  // MATH
  // =====================================================

  readonly Math = Math;

  // =====================================================
  // SERVICE
  // =====================================================

  private readonly categoryService = inject(CategoryService);

  // =====================================================
  // GRID API
  // =====================================================

  private gridApi!: GridApi<CategoryItem>;

  // =====================================================
  // SEARCH & STATUS FILTERS
  // =====================================================

  readonly searchText = signal<string>('');

  readonly showActiveOnly = signal<boolean>(true);

  private readonly router = inject(Router);

  categoryType: 'central' | 'state' = 'central';

  onCategoryTypeChange(type: 'central' | 'state'): void {
  this.categoryType = type;

  if (type === 'state') {
    this.router.navigate(['/masters/state']);
  }
}

  // =====================================================
  // MODAL
  // =====================================================

  readonly isModalOpen = signal<boolean>(false);

  readonly isEditMode = signal<boolean>(false);

  readonly selectedItem = signal<CategoryItem | null>(null);

  // =====================================================
  // LOADING
  // =====================================================

  readonly isLoading = signal<boolean>(false);

  // =====================================================
  // FORM DATA
  // =====================================================

  formData: {
    id: number;
    category: string;
    sub_categories: string[];
    is_active: boolean;
  } = {
    id: 0,

    category: '',

    sub_categories: [],

    is_active: true,
  };

  // =====================================================
  // ROW DATA
  // =====================================================

  allCategories: CategoryItem[] = [];

  rowData: CategoryItem[] = [];

  // =====================================================
  // SERVER PAGINATION
  // =====================================================

  currentPage = 1;

  totalRecords = 0;

  totalPages = 1;

  rowsPerPage = 20;

  // =====================================================
  // GRID COLUMNS
  // =====================================================

  colDefs: ColDef<CategoryItem>[] = [
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
        textAlign: 'center',

        display: 'flex',

        alignItems: 'center',

        justifyContent: 'center',

        fontSize: '12px',

        color: '#333',
      },
    },

    // ===================================================
    // CATEGORY
    // ===================================================

    {
      field: 'category',

      headerName: 'CATEGORY',

      minWidth: 250,

      flex: 1.3,

      cellRenderer: (params: ICellRendererParams<CategoryItem>) => {
        if (!params.data) {
          return '';
        }

        return `

            <span
              style="
                font-size:12px;
                color:#333;
                font-weight:600;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
                width:100%;
                display:block;
              "
            >

              ${this.escapeHtml(params.data.category)}

            </span>

          `;
      },
    },

    // ===================================================
    // SUB CATEGORIES
    // ===================================================

    // {
    //   field: 'sub_categories',

    //   headerName: 'SUB CATEGORIES',

    //   minWidth: 300,

    //   flex: 1.6,

    //   autoHeight: true,

    //   wrapText: true,

    //   cellRenderer: (params: ICellRendererParams<CategoryItem>) => {
    //     if (!params.data) {
    //       return '';
    //     }

    //     const subCategories = params.data.sub_categories || [];

    //     // ---------------------------------------------
    //     // NO SUB CATEGORY
    //     // ---------------------------------------------

    //     if (subCategories.length === 0) {
    //       return `

    //           <span
    //             style="
    //               font-size:11px;
    //               color:#94a3b8;
    //             "
    //           >

    //             No sub-categories

    //           </span>

    //         `;
    //     }

    //     // ---------------------------------------------
    //     // SUB CATEGORY BADGES
    //     // ---------------------------------------------

    //     return `

    //         <div
    //           style="
    //             display:flex;
    //             align-items:center;
    //             flex-wrap:wrap;
    //             gap:4px;
    //             padding:4px 0;
    //             line-height:18px;
    //           "
    //         >

    //           ${subCategories
    //             .map(
    //               (sub) => `

    //                 <span
    //                   style="
    //                     display:inline-block;
    //                     padding:2px 8px;
    //                     border-radius:10px;
    //                     background:#f1f5f9;
    //                     border:1px solid #e2e8f0;
    //                     color:#475569;
    //                     font-size:10px;
    //                   "
    //                 >

    //                   ${this.escapeHtml(sub)}

    //                 </span>

    //               `,
    //             )
    //             .join('')}

    //         </div>

    //       `;
    //   },
    // },

    // ===================================================
    // STATUS
    // ===================================================

    {
      field: 'is_active',

      headerName: 'STATUS',

      width: 145,

      minWidth: 130,

      maxWidth: 145,

      cellRenderer: (params: ICellRendererParams<CategoryItem>) => {
        const isActive = params.value === true;

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
                  font-size:11px;
                  font-weight:600;
                  line-height:1;
                  white-space:nowrap;
                  background:${isActive ? '#ecfdf5' : '#fff1f2'};
                  border:1px solid ${isActive ? '#86efac' : '#fda4af'};
                  color:${isActive ? '#059669' : '#e11d48'};
                "
              >

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

    // ===================================================
    // ACTIONS
    // ===================================================

    // {
    //   headerName: 'ACTIONS',

    //   width: 150,

    //   minWidth: 150,

    //   maxWidth: 150,

    //   sortable: false,

    //   filter: false,

    //   resizable: false,

    //   cellRenderer: (params: ICellRendererParams<CategoryItem>) => {
    //     const id = params.data?.id;

    //     return `

    //         <div
    //           style="
    //             display:flex;
    //             align-items:center;
    //             justify-content:flex-start;
    //             gap:8px;
    //             height:100%;
    //             padding-left:4px;
    //             box-sizing:border-box;
    //           "
    //         >

    //           <!-- EDIT -->

    //           <button
    //             type="button"
    //             class="action-btn edit-btn"
    //             title="Edit"
    //             data-action="edit"
    //             data-id="${id}"
    //             style="
    //               width:30px;
    //               height:30px;
    //               display:flex;
    //               align-items:center;
    //               justify-content:center;
    //               padding:0;
    //               border:1px solid #dbeafe;
    //               border-radius:6px;
    //               background:#eff6ff;
    //               color:#2563eb;
    //               cursor:pointer;
    //             "
    //           >

    //             <svg
    //               width="15"
    //               height="15"
    //               viewBox="0 0 24 24"
    //               fill="none"
    //               stroke="currentColor"
    //               stroke-width="2"
    //               stroke-linecap="round"
    //               stroke-linejoin="round"
    //             >

    //               <path
    //                 d="M12 20h9"
    //               ></path>

    //               <path
    //                 d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
    //               ></path>

    //             </svg>

    //           </button>


    //           <!-- DELETE -->

    //           <button
    //             type="button"
    //             class="action-btn delete-btn"
    //             title="Delete"
    //             data-action="delete"
    //             data-id="${id}"
    //             style="
    //               width:30px;
    //               height:30px;
    //               display:flex;
    //               align-items:center;
    //               justify-content:center;
    //               padding:0;
    //               border:1px solid #fee2e2;
    //               border-radius:6px;
    //               background:#fef2f2;
    //               color:#dc2626;
    //               cursor:pointer;
    //             "
    //           >

    //             <svg
    //               width="15"
    //               height="15"
    //               viewBox="0 0 24 24"
    //               fill="none"
    //               stroke="currentColor"
    //               stroke-width="2"
    //               stroke-linecap="round"
    //               stroke-linejoin="round"
    //             >

    //               <path
    //                 d="M3 6h18"
    //               ></path>

    //               <path
    //                 d="M8 6V4h8v2"
    //               ></path>

    //               <path
    //                 d="M19 6v14H5V6"
    //               ></path>

    //               <path
    //                 d="M10 11v6"
    //               ></path>

    //               <path
    //                 d="M14 11v6"
    //               ></path>

    //             </svg>

    //           </button>

    //         </div>

    //       `;
    //   },
    // },
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

  // =====================================================
  // INIT & FOCUS
  // =====================================================

  ngOnInit(): void {
    this.loadCategories(1);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.searchInput?.nativeElement.focus(), 100);
  }

  // =====================================================
  // STATUS FILTER & VIEW COMPUTATION
  // =====================================================

  toggleActiveFilter(): void {
    this.showActiveOnly.update((value) => !value);
    this.currentPage = 1;
    this.applyCategoryView();
  }

  applyCategoryView(): void {
    let filtered = [...this.allCategories];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.is_active === true);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        (item) =>
          (item.category || '').toLowerCase().includes(search) ||
          (item.sub_categories || []).some((sub) => (sub || '').toLowerCase().includes(search)),
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
  // GET ALL CATEGORIES
  // =====================================================

  loadCategories(page: number = this.currentPage): void {
    this.isLoading.set(true);

    this.categoryService.getAllCategory(0, undefined, page, this.rowsPerPage).subscribe({
      next: (response) => {
        // console.log('CATEGORY API RESPONSE:', response);

        if (!response?.data) {
          this.allCategories = [];
          this.rowData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
          this.isLoading.set(false);
          return;
        }

        try {
          const decrypted = this.categoryService.decryptResponse(response.data);

          // console.log('DECRYPTED CATEGORY RESPONSE:', decrypted);

          const records: any[] = Array.isArray(decrypted) ? decrypted : [];

          // console.log('CATEGORY RECORDS:', records);

          this.allCategories = records.map((item: any) => ({
            id: Number(item.AutoCategoryId),

            category: item.CategoryName || '',

            sub_categories: [],

            is_active: true,

            is_draft: false,

            created_at: '-',
          }));

          // console.log('MAPPED CATEGORIES:', this.allCategories);

          this.applyCategoryView();
        } catch (error) {
          console.error('CATEGORY DECRYPTION ERROR:', error);

          this.allCategories = [];
          this.rowData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
        }

        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('CATEGORY GET ALL ERROR:', error);

        this.allCategories = [];
        this.rowData = [];
        this.totalRecords = 0;
        this.totalPages = 0;

        this.isLoading.set(false);
      },
    });
  }

  // =====================================================
  // GRID READY
  // =====================================================

  onGridReady(params: GridReadyEvent<CategoryItem>): void {
    this.gridApi = params.api;
    this.applyCategoryView();
  }

  // =====================================================
  // SEARCH
  // =====================================================

  onSearchChange(text: string): void {
    this.searchText.set(text);
    this.currentPage = 1;
    this.applyCategoryView();
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

    // console.log(
    //   'ACTION:',
    //   action
    // );

    // console.log(
    //   'CLICKED CATEGORY ID:',
    //   id
    // );

    const item = this.rowData.find((row) => Number(row.id) === id);

    if (!item) {
      console.error('CATEGORY NOT FOUND:', id);

      return;
    }

    // ---------------------------------------------
    // EDIT
    // ---------------------------------------------

    if (action === 'edit') {
      this.openEditModal(item);
    }

    // ---------------------------------------------
    // DELETE
    // ---------------------------------------------
    else if (action === 'delete') {
      this.confirmDelete(item);
    }
  }

  submitted = false;

  // =====================================================
  // ADD MODAL
  // =====================================================

  openAddModal(): void {
    this.submitted = false;

    this.isEditMode.set(false);

    this.selectedItem.set(null);

    this.formData = {
      id: 0,

      category: '',

      sub_categories: [],

      is_active: true,
    };

    this.isModalOpen.set(true);

    setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
  }

  // =====================================================
  // EDIT MODAL
  // =====================================================

  openEditModal(item: CategoryItem): void {
    // console.log(
    //   'EDIT CLICKED:',
    //   item
    // );

    if (!item.id) {
      Swal.fire({
        icon: 'error',

        title: 'Invalid Category',

        text: 'Category ID is missing.',
      });

      return;
    }

    this.isLoading.set(true);

    this.categoryService.getCategoryById(Number(item.id)).subscribe({
      next: (response) => {
        // console.log(
        //   'GET CATEGORY BY ID RESPONSE:',
        //   response
        // );

        try {
          if (!response?.data) {
            throw new Error('No data received from API');
          }

          // -------------------------------------------
          // DECRYPT
          // -------------------------------------------

          const decrypted = this.categoryService.decryptResponse(response.data);

          // console.log(
          //   'GET CATEGORY BY ID DECRYPTED:',
          //   decrypted
          // );

          // -------------------------------------------
          // FIND RECORD
          // -------------------------------------------

          let data = decrypted;

          if (Array.isArray(decrypted?.records)) {
            data = decrypted.records[0];
          } else if (decrypted?.record) {
            data = decrypted.record;
          } else if (decrypted?.data) {
            data = decrypted.data;
          }

          if (!data) {
            throw new Error('Category record not found');
          }

          // -------------------------------------------
          // SET FORM
          // -------------------------------------------

          this.formData = {
            id: Number(data.autocategory_id ?? item.id),

            category: data.category ?? item.category ?? '',

            sub_categories: Array.isArray(data.sub_categories) ? [...data.sub_categories] : [],

            is_active: data.is_active ?? item.is_active ?? true,
          };

          this.selectedItem.set(item);

          this.isEditMode.set(true);

          this.isModalOpen.set(true);

          setTimeout(() => this.firstFormInput?.nativeElement.focus(), 100);
        } catch (error) {
          console.error('GET CATEGORY BY ID ERROR:', error);

          Swal.fire({
            icon: 'error',

            title: 'Error',

            text: 'Unable to load category details.',
          });
        }

        this.isLoading.set(false);
      },

      error: (error) => {
        console.error('GET CATEGORY BY ID API ERROR:', error);

        this.isLoading.set(false);

        Swal.fire({
          icon: 'error',

          title: 'API Error',

          text: this.getErrorMessage(error),
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

      category: '',

      sub_categories: [],

      is_active: true,
    };
  }

  // =====================================================
  // ADD SUB CATEGORY
  // =====================================================

  addSubCategory(): void {
    this.formData.sub_categories.push('');
  }

  // =====================================================
  // REMOVE SUB CATEGORY
  // =====================================================

  removeSubCategory(index: number): void {
    this.formData.sub_categories.splice(index, 1);
  }

  // =====================================================
  // SAVE CATEGORY
  // =====================================================

  saveCategory(): void {
    this.submitted = true;

    const category = this.formData.category.trim();

    // ---------------------------------------------
    // CATEGORY REQUIRED
    // ---------------------------------------------

    if (!category) {
      Swal.fire({
        icon: 'warning',

        title: 'Required Field',

        text: 'Please enter Category Name.',
      });

      return;
    }

    // ---------------------------------------------
    // CATEGORY LENGTH
    // ---------------------------------------------

    if (category.length > 100) {
      Swal.fire({
        icon: 'warning',

        title: 'Invalid Category',

        text: 'Category Name cannot exceed 100 characters.',
      });

      return;
    }

    // ---------------------------------------------
    // CATEGORY REGEX
    // ---------------------------------------------

    if (!this.categoryNameRegex.test(category)) {
      Swal.fire({
        icon: 'warning',

        title: 'Invalid Category',

        text: 'Category Name should contain only letters and single spaces.',
      });

      return;
    }

    // ---------------------------------------------
    // SUB CATEGORIES
    // ---------------------------------------------

    const cleanedSubCategories: string[] = [];

    for (let i = 0; i < this.formData.sub_categories.length; i++) {
      const subCategory = this.formData.sub_categories[i].trim();

      // Empty row is allowed.
      if (!subCategory) {
        continue;
      }

      if (subCategory.length > 100) {
        Swal.fire({
          icon: 'warning',

          title: 'Invalid Sub Category',

          text: `Sub Category ${i + 1} cannot exceed 100 characters.`,
        });

        return;
      }

      if (!this.categoryNameRegex.test(subCategory)) {
        Swal.fire({
          icon: 'warning',

          title: 'Invalid Sub Category',

          text: `Sub Category ${i + 1} should contain only letters and single spaces.`,
        });

        return;
      }

      cleanedSubCategories.push(subCategory);
    }

    // console.log(
    //   'FINAL CATEGORY:',
    //   category
    // );

    // console.log(
    //   'FINAL SUB CATEGORIES:',
    //   cleanedSubCategories
    // );

    this.isLoading.set(true);

    // =================================================
    // UPDATE
    // =================================================

    if (this.isEditMode()) {
      // console.log(
      //   'UPDATING CATEGORY ID:',
      //   this.formData.id
      // );

      this.categoryService
        .updateCategory(
          Number(this.formData.id),

          category,

          cleanedSubCategories,

          false,
          this.formData.is_active,
        )
        .subscribe({
          next: (response) => {
            // console.log(
            //   'UPDATE CATEGORY RESPONSE:',
            //   response
            // );

            this.handleMutationSuccess(
              response,

              'updated',

              category,
            );
          },

          error: (error) => {
            console.error('UPDATE CATEGORY ERROR:', error);

            this.isLoading.set(false);
            this.closeModal();

            let errMsg = this.getErrorMessage(error);
            if (error?.error) {
              let errObj = error.error;
              if (typeof errObj === 'string') {
                try {
                  const decrypted = this.categoryService.decryptResponse(errObj);
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

    // =================================================
    // ADD
    // =================================================

    // console.log(
    //   'ADDING NEW CATEGORY'
    // );

    this.categoryService.addCategory(category, cleanedSubCategories, false).subscribe({
      next: (response) => {
        // console.log(
        //   'ADD CATEGORY RESPONSE:',
        //   response
        // );

        this.handleMutationSuccess(response, 'added', category);
      },

      error: (error) => {
        console.error('ADD CATEGORY ERROR:', error);

        this.isLoading.set(false);
        this.closeModal();

        let errMsg = this.getErrorMessage(error);
        if (error?.error) {
          let errObj = error.error;
          if (typeof errObj === 'string') {
            try {
              const decrypted = this.categoryService.decryptResponse(errObj);
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

  // =====================================================
  // MUTATION SUCCESS
  // =====================================================

  private handleMutationSuccess(
    response: any,
    action: 'added' | 'updated',
    category: string,
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
          response.message || (action === 'added' ? 'Category already exists' : 'Update Failed'),
        text:
          response.message || (action === 'added' ? 'Category already exists' : 'Update Failed'),
        confirmButtonColor: '#1c52a3',
      });
      return;
    }

    // ---------------------------------------------
    // TRY TO DECRYPT RESPONSE
    // ---------------------------------------------

    if (response?.data) {
      try {
        const decrypted = this.categoryService.decryptResponse(response.data);

        // console.log(
        //   `CATEGORY ${
        //     action.toUpperCase()
        //   } DECRYPTED RESPONSE:`,
        //   decrypted
        // );
      } catch (error) {
        console.warn('Mutation response decryption failed:', error);
      }
    }

    // ---------------------------------------------
    // STOP LOADING
    // ---------------------------------------------

    this.isLoading.set(false);

    // ---------------------------------------------
    // CLOSE MODAL
    // ---------------------------------------------

    this.closeModal();

    // ---------------------------------------------
    // SUCCESS MESSAGE
    // ---------------------------------------------

    Swal.fire({
      icon: 'success',
      title: action === 'added' ? 'Added Successfully' : 'Updated Successfully',
      text: response?.message || `Category "${category}" has been ${action} successfully.`,
      timer: 1600,
      showConfirmButton: false,
    });

    // ---------------------------------------------
    // RELOAD FIRST PAGE
    // ---------------------------------------------

    this.currentPage = 1;

    this.loadCategories(1);
  }

  // =====================================================
  // DELETE CONFIRMATION
  // =====================================================

  confirmDelete(item: CategoryItem): void {
    Swal.fire({
      title: 'Delete Category?',

      text: `Are you sure you want to delete "${item.category}"?`,

      icon: 'warning',

      showCancelButton: true,

      confirmButtonColor: '#ef4444',

      cancelButtonColor: '#64748b',

      confirmButtonText: 'Yes, Delete',

      cancelButtonText: 'Cancel',
    })

      .then((result) => {
        if (result.isConfirmed) {
          this.performDelete(item);
        }
      });
  }

  // =====================================================
  // DELETE API
  // =====================================================

  private performDelete(item: CategoryItem): void {
    this.isLoading.set(true);

    // console.log(
    //   'DELETE CATEGORY ID:',
    //   item.id
    // );

    this.categoryService.deleteCategory(Number(item.id)).subscribe({
      next: (response) => {
        // console.log(
        //   'DELETE CATEGORY RESPONSE:',
        //   response
        // );

        // -------------------------------------------
        // DECRYPT RESPONSE
        // -------------------------------------------

        if (response?.data) {
          try {
            const decrypted = this.categoryService.decryptResponse(response.data);

            // console.log(
            //   'DELETE DECRYPTED RESPONSE:',
            //   decrypted
            // );
          } catch (error) {
            console.warn('DELETE RESPONSE DECRYPT ERROR:', error);
          }
        }

        this.isLoading.set(false);

        Swal.fire({
          icon: 'success',

          title: 'Deleted Successfully',

          text: `"${item.category}" has been deleted.`,

          timer: 1500,

          showConfirmButton: false,
        });

        // -------------------------------------------
        // IF LAST ROW OF PAGE
        // MOVE TO PREVIOUS PAGE
        // -------------------------------------------

        if (this.rowData.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }

        this.loadCategories(this.currentPage);
      },

      error: (error) => {
        console.error('DELETE CATEGORY ERROR:', error);

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
  // PAGINATION CONTROLS
  // =====================================================

  goToFirstPage(): void {
    if (this.currentPage > 1) {
      this.currentPage = 1;
      this.applyCategoryView();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyCategoryView();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyCategoryView();
    }
  }

  goToLastPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage = this.totalPages;
      this.applyCategoryView();
    }
  }

  onRowsPerPageChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);

    if (!value) return;

    this.rowsPerPage = value;
    this.currentPage = 1;
    this.applyCategoryView();
  }

  // =====================================================
  // DATE FORMAT
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
      Swal.fire({
        icon: 'warning',

        title: 'Grid Not Ready',

        text: 'Please wait for the table to load.',
      });

      return;
    }

    this.gridApi.exportDataAsCsv({
      fileName: `categories_${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }

  // =====================================================
  // TOTAL COUNT
  // =====================================================

  get totalCount(): number {
    return this.totalRecords;
  }

  // =====================================================
  // ACTIVE COUNT
  // =====================================================

  get activeCount(): number {
    return this.rowData.filter((row) => row.is_active).length;
  }

  // =====================================================
  // INACTIVE COUNT
  // =====================================================

  get inactiveCount(): number {
    return this.rowData.filter((row) => !row.is_active).length;
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
    return String(value || '')
      .replace(/&/g, '&amp;')

      .replace(/</g, '&lt;')

      .replace(/>/g, '&gt;')

      .replace(/"/g, '&quot;')

      .replace(/'/g, '&#039;');
  }
}
