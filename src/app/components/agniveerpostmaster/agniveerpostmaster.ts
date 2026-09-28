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

import { AgniveerUploadService } from '../../services/agniveer-upload/agniveer-upload';
import { CryptoHelper } from '../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

// =====================================================
// INTERFACE
// =====================================================

export interface AgniveerPostItem {
  id?: string | number;
  PostAutoId?: number;
  PostName?: string;
  post_name?: string;
  Branch?: string;
  branch?: string;
  CreatedAt?: string;
  created_at?: string;
  UpdatedAt?: string;
  IsActive?: boolean;
  is_active?: boolean;
  srNo?: number;
}

// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-agniveer-post-master',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './agniveerpostmaster.html',
  styleUrl: './agniveerpostmaster.css',
})
export class AgniveerPostMaster implements OnInit, AfterViewInit {
  private gridApi!: GridApi<AgniveerPostItem>;
  private readonly agniveerUploadService = inject(AgniveerUploadService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // =====================================================
  // STATE SIGNALS
  // =====================================================

  readonly searchText = signal<string>('');
  readonly pageSize = signal<number>(20);
  readonly isLoading = signal<boolean>(false);
  readonly showActiveOnly = signal<boolean>(true);

  currentPage = 1;
  totalRecords = 0;
  totalPages = 0;

  allAgniveerPosts: AgniveerPostItem[] = [];
  rowData: AgniveerPostItem[] = [];
  filteredRowData = signal<AgniveerPostItem[]>([]);

  readonly Math = Math;

  // =====================================================
  // GRID COLUMNS
  // =====================================================

  colDefs: ColDef<AgniveerPostItem>[] = [
    // SR NO
    {
      headerName: 'SR. NO.',
      width: 90,
      minWidth: 80,
      maxWidth: 100,
      valueGetter: (params) => (params.node?.rowIndex != null ? params.node.rowIndex + 1 : ''),
      sortable: true,
      filter: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        fontSize: '12px',
        color: '#333',
      },
    },

    // POST NAME
    {
      field: 'PostName',
      headerName: 'POST NAME',
      minWidth: 320,
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<AgniveerPostItem>) => {
        return `
          <span class="post-name-badge">
            ${params.value || '-'}
          </span>
        `;
      },
    },

    // BRANCH
    {
      field: 'Branch',
      headerName: 'BRANCH',
      minWidth: 200,
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<AgniveerPostItem>) => {
        const val = params.value || '-';
        return `
          <span class="branch-badge">
            ${val}
          </span>
        `;
      },
    },

    // STATUS
    {
      field: 'IsActive',
      headerName: 'STATUS',
      minWidth: 120,
      width: 130,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<AgniveerPostItem>) => {
        const active = params.value !== false;
        return `
          <span class="status-badge ${active ? 'status-active' : 'status-inactive'}">
            ${active ? 'ACTIVE' : 'INACTIVE'}
          </span>
        `;
      },
    },
  ];

  // =====================================================
  // GRID SETTINGS
  // =====================================================

  rowHeight = 48;
  headerHeight = 34;

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
    flex: 0,
  };

  // =====================================================
  // LIFECYCLE
  // =====================================================

  ngOnInit(): void {
    this.loadAgniveerPosts();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  // =====================================================
  // DATA FETCHING & VIEW CALCULATION
  // =====================================================

  loadAgniveerPosts(): void {
    this.isLoading.set(true);

    this.agniveerUploadService.getPostMaster().subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;

        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('Agniveer Post Master decryption error:', err);
          }
        }

        const records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : [];

        this.allAgniveerPosts = records.map((item: any, index: number): AgniveerPostItem => {
          const postName = item.PostName ?? item.post_name ?? item.postName ?? '-';
          const branch = item.Branch ?? item.branch ?? '-';
          const createdAtRaw = item.CreatedAt ?? item.created_at ?? item.createdAt;
          const formattedDate = createdAtRaw ? this.formatDate(new Date(createdAtRaw)) : '-';
          const isActive = item.IsActive !== undefined ? item.IsActive : item.is_active !== false;

          return {
            id: item.Id ?? item.id ?? item.PostAutoId ?? index + 1,
            PostAutoId: item.PostAutoId ?? index + 1,
            PostName: postName,
            post_name: postName,
            Branch: branch,
            branch: branch,
            CreatedAt: formattedDate,
            created_at: formattedDate,
            UpdatedAt: item.UpdatedAt ?? item.updated_at,
            IsActive: isActive,
            is_active: isActive,
            srNo: index + 1,
          };
        });

        this.currentPage = 1;
        this.applyAgniveerPostView();
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching Agniveer Post Master data:', err);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  applyAgniveerPostView(): void {
    const search = this.searchText().trim().toLowerCase();
    const activeOnly = this.showActiveOnly();

    let filtered = this.allAgniveerPosts;

    if (activeOnly) {
      filtered = filtered.filter((item) => item.IsActive !== false);
    }

    if (search) {
      filtered = filtered.filter(
        (item) =>
          (item.PostName || '').toLowerCase().includes(search) ||
          (item.Branch || '').toLowerCase().includes(search) ||
          (item.CreatedAt || '').toLowerCase().includes(search)
      );
    }

    this.totalRecords = filtered.length;
    const ps = this.pageSize();
    this.totalPages = Math.ceil(this.totalRecords / ps) || 1;

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * ps;
    const paginated = filtered.slice(startIndex, startIndex + ps).map((item, idx) => ({
      ...item,
      srNo: startIndex + idx + 1,
    }));

    this.filteredRowData.set(paginated);

    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.filteredRowData());
    }
  }

  private formatDate(date: Date): string {
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  // =====================================================
  // GRID READY
  // =====================================================

  onGridReady(params: GridReadyEvent<AgniveerPostItem>): void {
    this.gridApi = params.api;
    if (this.filteredRowData().length > 0) {
      this.gridApi.setGridOption('rowData', this.filteredRowData());
    }
  }

  // =====================================================
  // SEARCH & FILTER
  // =====================================================

  onSearchChange(text: string): void {
    this.searchText.set(text);
    this.currentPage = 1;
    this.applyAgniveerPostView();
  }

  toggleActiveOnly(event?: Event | boolean): void {
    if (event !== undefined) {
      const value = typeof event === 'boolean' ? event : (event.target as HTMLInputElement).checked;
      this.showActiveOnly.set(value);
    } else {
      this.showActiveOnly.update((v) => !v);
    }
    this.currentPage = 1;
    this.applyAgniveerPostView();
  }

  toggleActiveFilter(): void {
    this.toggleActiveOnly();
  }

  // =====================================================
  // PAGE SIZE & PAGINATION
  // =====================================================

  onPageSizeChange(value: number | string): void {
    const ps = Number(value);
    if (!ps) return;
    this.pageSize.set(ps);
    this.currentPage = 1;
    this.applyAgniveerPostView();
  }

  goToFirstPage(): void {
    if (this.currentPage === 1) return;
    this.currentPage = 1;
    this.applyAgniveerPostView();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.applyAgniveerPostView();
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.applyAgniveerPostView();
  }

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage = this.totalPages;
    this.applyAgniveerPostView();
  }

  // =====================================================
  // EXPORT
  // =====================================================

  exportCsv(): void {
    if (!this.gridApi) {
      return;
    }

    this.gridApi.exportDataAsCsv({
      fileName: `agniveer_posts_${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }
}
