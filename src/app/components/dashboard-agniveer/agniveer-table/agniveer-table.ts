import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from 'ag-grid-community';
import { DashboardService } from '../../../services/dashboard/dashboard';
import { CryptoHelper } from '../../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface AgniveerTableItem {
  srNo?: number;
  Agniveer_Id_No: string;
  Name: string;
  Gender: string;
  Email_ID: string;
  agniveer_force_type_id: number | string;
  agniveer_force_type: string;
  rehabilitated: boolean;
  raw?: any;
}

@Component({
  selector: 'app-agniveer-table',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AgGridAngular],
  templateUrl: './agniveer-table.html',
  styleUrl: './agniveer-table.css',
})
export class AgniveerTable implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dashboardService = inject(DashboardService);

  readonly activeFilter = signal<'all' | 'rehabilitated' | 'toBeRehab'>('all');
  readonly searchQuery = signal<string>('');
  readonly rawRecords = signal<AgniveerTableItem[]>([]);
  readonly isLoading = signal<boolean>(false);

  // Pagination Signals
  readonly pageNumber = signal<number>(1);
  readonly recordPerPage = signal<number>(20);
  readonly totalRecords = signal<number>(0);
  readonly totalPages = signal<number>(1);

  readonly Math = Math;

  gridApi?: GridApi<AgniveerTableItem>;
  rowHeight = 38;
  headerHeight = 30;

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  colDefs: ColDef<AgniveerTableItem>[] = [
    {
      headerName: 'SR. NO.',
      width: 75,
      minWidth: 70,
      maxWidth: 85,
      sortable: false,
      filter: false,
      resizable: false,
      valueGetter: (params) =>
        (params.node?.rowIndex ?? 0) + 1 + (this.pageNumber() - 1) * this.recordPerPage(),
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#333',
      },
    },
    {
      headerName: 'AGNIVEER ID',
      field: 'Agniveer_Id_No',
      minWidth: 140,
      flex: 1,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
        return `
          <span class="user-text user-id-text">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      headerName: 'CANDIDATE NAME',
      field: 'Name',
      minWidth: 170,
      flex: 1.3,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
        return `
          <span class="user-text user-name-text">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      headerName: 'GENDER',
      field: 'Gender',
      minWidth: 100,
      flex: 0.8,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
        return `
          <span class="user-text">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    // {
    //   headerName: 'EMAIL ID',
    //   field: 'Email_ID',
    //   minWidth: 200,
    //   flex: 1.4,
    //   sortable: true,
    //   filter: true,
    //   resizable: true,
    //   cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
    //     return `
    //       <span class="user-text">
    //         ${params.value || '-'}
    //       </span>
    //     `;
    //   },
    // },
    // {
    //   headerName: 'FORCE ID',
    //   field: 'agniveer_force_type_id',
    //   minWidth: 110,
    //   flex: 0.8,
    //   sortable: true,
    //   filter: true,
    //   resizable: true,
    //   cellStyle: {
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     fontSize: '12px',
    //     color: '#64748b',
    //     fontWeight: '500',
    //   },
    // },
    {
      headerName: 'FORCE TYPE',
      field: 'agniveer_force_type',
      minWidth: 140,
      flex: 1,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
        return `
          <span class="user-text" style="color: #1267e8; font-weight: 600;">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      headerName: 'REHABILITATED',
      field: 'rehabilitated',
      minWidth: 140,
      flex: 0.9,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
        const active = params.value === true;
        return `
          <div class="status-cell">
            <span class="user-status-pill ${active ? 'active' : 'inactive'}">
              <span class="status-dot"></span>
              <span>${active ? 'Yes' : 'No'}</span>
            </span>
          </div>
        `;
      },
    },
  ];

  readonly filteredRecords = computed(() => {
    const list = this.rawRecords();
    const filter = this.activeFilter();
    const q = this.searchQuery().toLowerCase().trim();

    let filtered = list;
    if (filter === 'rehabilitated') {
      filtered = list.filter((item) => Boolean(item.rehabilitated));
    } else if (filter === 'toBeRehab') {
      filtered = list.filter((item) => !Boolean(item.rehabilitated));
    }

    if (q) {
      filtered = filtered.filter(
        (item) =>
          (item.Name && item.Name.toLowerCase().includes(q)) ||
          (item.Agniveer_Id_No && item.Agniveer_Id_No.toLowerCase().includes(q)) ||
          (item.Email_ID && item.Email_ID.toLowerCase().includes(q)) ||
          (item.agniveer_force_type && item.agniveer_force_type.toLowerCase().includes(q)) ||
          (item.Gender && item.Gender.toLowerCase().includes(q)),
      );
    }

    return filtered;
  });

  readonly counts = computed(() => {
    const all = this.rawRecords();
    const rehab = all.filter((i) => Boolean(i.rehabilitated)).length;
    return {
      all: all.length,
      rehabilitated: rehab,
      toBeRehab: all.length - rehab,
    };
  });

  ngOnInit(): void {
    // Read query parameters (e.g. ?filter=rehabilitated)
    this.route.queryParams.subscribe((params) => {
      const f = params['filter'];
      if (f === 'rehabilitated' || f === 'toBeRehab') {
        this.activeFilter.set(f);
      } else {
        this.activeFilter.set('all');
      }
    });

    this.fetchAgniveerData();
  }

  fetchAgniveerData(): void {
    this.isLoading.set(true);
    const param = {
      page_number: this.pageNumber(),
      record_per_page: this.recordPerPage(),
    };
    const payload = JSON.stringify(param);
    const encryptedPayload = CryptoHelper.encrypt(payload);

    this.dashboardService.getAgniveerData(JSON.stringify(encryptedPayload)).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res && res.code === 1 && res.data) {
          let resData: any = CryptoHelper.decrypt(res.data);
          try {
            resData = JSON.parse(resData);
          } catch {
            // Already parsed
          }
          // console.log('[AgniveerTable] Fetched page:', this.pageNumber(), resData);

          const records: any[] = resData?.records || (Array.isArray(resData) ? resData : []);
          let total = Number(resData?.total_records ?? resData?.total ?? 0);
          if (!total) {
            if (records.length === this.recordPerPage()) {
              total = this.pageNumber() * this.recordPerPage() + 1;
            } else {
              total = (this.pageNumber() - 1) * this.recordPerPage() + records.length;
            }
          }
          const totalP = Number(
            resData?.total_pages ?? (Math.ceil(total / this.recordPerPage()) || 1),
          );

          this.totalRecords.set(total);
          this.totalPages.set(totalP);

          const startIdx = (this.pageNumber() - 1) * this.recordPerPage();
          const mapped: AgniveerTableItem[] = records.map((r: any, idx: number) => ({
            srNo: startIdx + idx + 1,
            Agniveer_Id_No: r.Agniveer_Id_No || r.agniveer_id_no || r.id || '',
            Name: r.Name || r.name || r.candidate_name || '',
            Gender: r.Gender || r.gender || '',
            Email_ID: r.Email_ID || r.email_id || r.email || '',
            agniveer_force_type_id: r.agniveer_force_type_id ?? '',
            agniveer_force_type: r.agniveer_force_type || r.force_type || 'Indian Army',
            rehabilitated: Boolean(r.rehabilitated),
            raw: r,
          }));

          this.rawRecords.set(mapped);
          setTimeout(() => this.gridApi?.sizeColumnsToFit(), 50);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('[AgniveerTable] Error fetching Agniveer data:', err);
      },
    });
  }

  // ── Pagination Controls ─────────────────────────────────────────

  goToNextPage(): void {
    if (
      this.pageNumber() < this.totalPages() ||
      (this.totalPages() <= this.pageNumber() && this.rawRecords().length >= this.recordPerPage())
    ) {
      this.pageNumber.update((p) => p + 1);
      this.fetchAgniveerData();
    }
  }

  goToPreviousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((p) => p - 1);
      this.fetchAgniveerData();
    }
  }

  goToFirstPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.set(1);
      this.fetchAgniveerData();
    }
  }

  goToLastPage(): void {
    if (this.pageNumber() < this.totalPages()) {
      this.pageNumber.set(this.totalPages());
      this.fetchAgniveerData();
    }
  }

  changePageSize(newSize: string | number): void {
    this.recordPerPage.set(Number(newSize));
    this.pageNumber.set(1);
    this.fetchAgniveerData();
  }

  setFilter(filter: 'all' | 'rehabilitated' | 'toBeRehab'): void {
    this.activeFilter.set(filter);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter },
      queryParamsHandling: 'merge',
    });
    setTimeout(() => {
      this.gridApi?.sizeColumnsToFit();
    }, 50);
  }

  onGridReady(params: GridReadyEvent<AgniveerTableItem>): void {
    this.gridApi = params.api;
    setTimeout(() => {
      this.gridApi?.sizeColumnsToFit();
    }, 100);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.gridApi?.sizeColumnsToFit();
  }
}
