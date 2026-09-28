import { AfterViewInit, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { CryptoHelper } from '../../../helpers/crypto-helper';
import { DashboardService } from '../../../services/dashboard/dashboard';

type DashboardTableType = 'hit' | 'department' | 'agniveer';

interface DashboardTableRecord {
  [key: string]: any;
}

@Component({
  selector: 'app-dashboard-table',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AgGridAngular],
  templateUrl: './dashboard-table.html',
  styleUrl: './dashboard-table.css',
})
export class DashboardTable implements OnInit, AfterViewInit {
  /* ============================================================
     TABLE TYPE
  ============================================================ */

  readonly tableType = signal<DashboardTableType>('hit');

  readonly tableTitle = signal<string>('Hit Count');

  readonly tableDescription = signal<string>('');

  /* ============================================================
     TABLE DATA
  ============================================================ */

  readonly rowData = signal<DashboardTableRecord[]>([]);

  readonly isLoading = signal<boolean>(false);

  readonly searchQuery = signal<string>('');

  /* ============================================================
     PAGINATION
  ============================================================ */

  readonly pageNumber = signal<number>(1);

  readonly recordPerPage = signal<number>(20);

  readonly totalRecords = signal<number>(0);

  readonly totalPages = signal<number>(1);

  readonly Math = Math;

  /* ============================================================
     AG GRID
  ============================================================ */

  private gridApi!: GridApi;

  colDefs: ColDef[] = [];

  readonly defaultColDef: ColDef = {
    sortable: true,
    filter: false,
    resizable: true,
    flex: 1,
    minWidth: 120,
  };

  readonly rowHeight = 38;

  readonly headerHeight = 30;

  /* ============================================================
     CONSTRUCTOR
  ============================================================ */

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute,
  ) {}

  /* ============================================================
     INIT
  ============================================================ */

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      const type = params['type'] as DashboardTableType;

      if (type === 'hit' || type === 'department' || type === 'agniveer') {
        this.setTableType(type);
      } else {
        this.setTableType('hit');
      }

      this.pageNumber.set(1);

      this.fetchDashboardList();
    });
  }

  ngAfterViewInit(): void {}

  /* ============================================================
     SET TABLE TYPE
  ============================================================ */

  setTableType(type: DashboardTableType): void {
    this.tableType.set(type);

    switch (type) {
      case 'hit':
        this.tableTitle.set('Hit Count');
        this.tableDescription.set('Hit Count Details');
        break;

      case 'department':
        this.tableTitle.set('Department');
        this.tableDescription.set('Department Details');
        break;

      case 'agniveer':
        this.tableTitle.set('Agniveer');
        this.tableDescription.set('Agniveer Candidates');
        break;

      default:
        this.tableTitle.set('Hit Count');
        this.tableDescription.set('Hit Count Details');
        break;
    }

    this.setColumnDefinitions();
  }

  /* ============================================================
     COLUMN DEFINITIONS
  ============================================================ */

  setColumnDefinitions(): void {
    const type = this.tableType();

    /* ------------------------------------------------------------
       HIT COUNT
    ------------------------------------------------------------ */

    if (type === 'hit') {
      this.colDefs = [
        {
          headerName: 'SR NO',
          width: 90,
          minWidth: 90,
          maxWidth: 90,
          sortable: false,
          valueGetter: (params) =>
            (this.pageNumber() - 1) * this.recordPerPage() + (params.node?.rowIndex ?? 0) + 1,
        },
        {
          headerName: 'DATE',
          field: 'hit_date',
          minWidth: 150,
          valueFormatter: (params) => {
            if (!params.value) return '';

            const date = new Date(params.value);

            if (isNaN(date.getTime())) return '';

            return date.toLocaleDateString('en-GB');
          },
        },
        {
          headerName: 'IP Address',
          field: 'ip',
          minWidth: 200,
        },
        // {
        //   headerName: 'HIT COUNT',
        //   field: 'hit_count',
        //   minWidth: 130,
        // },
        // {
        //   headerName: 'LAST HIT',
        //   field: 'last_hit',
        //   minWidth: 180,
        // },
      ];

      return;
    }

    /* ------------------------------------------------------------
       DEPARTMENT
    ------------------------------------------------------------ */

    if (type === 'department') {
      this.colDefs = [
        {
          headerName: 'SR NO',
          width: 90,
          minWidth: 90,
          maxWidth: 90,
          sortable: false,
          valueGetter: (params) =>
            (this.pageNumber() - 1) * this.recordPerPage() + (params.node?.rowIndex ?? 0) + 1,
        },
        {
          headerName: 'USER ID',
          field: 'userid',
          minWidth: 250,
        },
        // {
        //   headerName: 'DEPARTMENT NAME',
        //   field: 'department_name',
        //   minWidth: 220,
        // },
        // {
        //   headerName: 'TOTAL COUNT',
        //   field: 'total_count',
        //   minWidth: 140,
        // },
        // {
        //   headerName: 'STATUS',
        //   field: 'status',
        //   minWidth: 120,
        // },
      ];

      return;
    }

    /* ------------------------------------------------------------
       AGNIVEER
    ------------------------------------------------------------ */

    if (type === 'agniveer') {
      this.colDefs = [
        {
          headerName: 'SR NO',
          width: 90,
          minWidth: 90,
          maxWidth: 90,
          sortable: false,
          valueGetter: (params) =>
            (this.pageNumber() - 1) * this.recordPerPage() + (params.node?.rowIndex ?? 0) + 1,
        },
        {
          headerName: 'USER ID',
          field: 'userid',
          minWidth: 250,
        },
        // {
        //   headerName: 'CANDIDATE NAME',
        //   field: 'Name',
        //   minWidth: 200,
        // },
        // {
        //   headerName: 'GENDER',
        //   field: 'Gender',
        //   minWidth: 110,
        // },
        // {
        //   headerName: 'EMAIL',
        //   field: 'Email_ID',
        //   minWidth: 220,
        // },
        // {
        //   headerName: 'FORCE TYPE',
        //   field: 'agniveer_force_type',
        //   minWidth: 160,
        // },
      ];
    }
  }

  /* ============================================================
     GRID READY
  ============================================================ */

  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
  }

  /* ============================================================
     FETCH DASHBOARD LIST
  ============================================================ */

  fetchDashboardList(): void {
    this.isLoading.set(true);

    const payload: any = {};

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    const body = JSON.stringify(encryptedPayload);

    let apiCall;

    switch (this.tableType()) {
      case 'hit':
        apiCall = this.dashboardService.getWebsiteHitListing(body);
        break;

      case 'department':
        apiCall = this.dashboardService.getDepartmentSessionListing(body);
        break;

      case 'agniveer':
        apiCall = this.dashboardService.getAgniveerSessionListing(body);
        break;

      default:
        this.isLoading.set(false);
        return;
    }

    apiCall.subscribe({
      next: (res: any) => {
        // console.log('====================================');
        // console.log(`[DashboardTable] ${this.tableType()} RAW RESPONSE:`, res);
        // console.log('====================================');

        this.handleDashboardResponse(res);
      },

      error: (error: any) => {
        this.rowData.set([]);
        this.totalRecords.set(0);
        this.totalPages.set(1);
        this.isLoading.set(false);
      },
    });
  }

  /* ============================================================
     HANDLE API RESPONSE
  ============================================================ */

  private handleDashboardResponse(res: any): void {
    try {
      if (!res?.data) {
        this.rowData.set([]);
        this.totalRecords.set(0);
        this.totalPages.set(1);
        return;
      }

      const decryptedData = CryptoHelper.decrypt(res.data);
      // console.log('====================================');
      // console.log(`[DashboardTable] ${this.tableType()} DECRYPTED RESPONSE:`, decryptedData);
      // console.log('====================================');

      let parsedData: any;

      try {
        parsedData = JSON.parse(decryptedData);

        // console.log(`[DashboardTable] ${this.tableType()} PARSED RESPONSE:`, parsedData);
      } catch {
        parsedData = decryptedData;

        // console.log(`[DashboardTable] ${this.tableType()} RESPONSE IS NOT JSON:`, parsedData);
      }

      /*
       * ----------------------------------------------------------
       * RECORDS
       * ----------------------------------------------------------
       *
       * Backend different names use kar sakta hai:
       *
       * records
       * data
       * result
       *
       * Isliye currently flexible rakha hai.
       */

      const records =
        parsedData?.records ??
        parsedData?.data ??
        parsedData?.result ??
        (Array.isArray(parsedData) ? parsedData : []);

      // console.log('====================================');
      // console.log(`[DashboardTable] ${this.tableType()} RECORDS:`, records);
      // console.log(
      //   `[DashboardTable] ${this.tableType()} RECORD COUNT:`,
      //   Array.isArray(records) ? records.length : 0,
      // );

      // if (Array.isArray(records) && records.length > 0) {
      //   console.log(`[DashboardTable] ${this.tableType()} FIRST RECORD:`, records[0]);

      //   console.log(
      //     `[DashboardTable] ${this.tableType()} FIRST RECORD KEYS:`,
      //     Object.keys(records[0]),
      //   );
      // }

      // console.log('====================================');

      /*
       * ----------------------------------------------------------
       * TOTAL RECORDS
       * ----------------------------------------------------------
       */

      let total = 0;

      /*
       * AGNIVEER
       *
       * IMPORTANT:
       * Is table ka count dashboard ke overall
       * agniveerCount se nahi liya ja raha.
       *
       * Priority:
       *
       * 1. session_count
       * 2. agniveer_count
       * 3. total_records
       * 4. totalRecords
       * 5. total
       * 6. records.length
       */

      if (this.tableType() === 'agniveer') {
        total = Number(
          parsedData?.session_count ??
            parsedData?.agniveer_count ??
            parsedData?.total_records ??
            parsedData?.totalRecords ??
            parsedData?.total ??
            (Array.isArray(records) ? records.length : 0),
        );
      } else {
        total = Number(
          parsedData?.total_records ??
            parsedData?.totalRecords ??
            parsedData?.total ??
            (Array.isArray(records) ? records.length : 0),
        );
      }

      /*
       * Safety
       */
      if (!Number.isFinite(total) || total < 0) {
        total = 0;
      }

      /*
       * ----------------------------------------------------------
       * TOTAL PAGES
       * ----------------------------------------------------------
       */

      let totalPages = Number(parsedData?.total_pages ?? parsedData?.totalPages ?? 0);

      if (!Number.isFinite(totalPages) || totalPages <= 0) {
        totalPages = total > 0 ? Math.ceil(total / this.recordPerPage()) : 1;
      }

      /*
       * ----------------------------------------------------------
       * SET DATA
       * ----------------------------------------------------------
       */

      this.rowData.set(Array.isArray(records) ? records : []);

      this.totalRecords.set(total);

      this.totalPages.set(totalPages > 0 ? totalPages : 1);
    } catch (error) {
      this.rowData.set([]);
      this.totalRecords.set(0);
      this.totalPages.set(1);
    } finally {
      this.isLoading.set(false);
    }
  }

  /* ============================================================
     SEARCH
  ============================================================ */

  onSearchClick(): void {
    this.pageNumber.set(1);

    this.fetchDashboardList();
  }

  clearSearch(): void {
    this.searchQuery.set('');

    this.pageNumber.set(1);

    this.fetchDashboardList();
  }

  /* ============================================================
     PAGE SIZE
  ============================================================ */

  changePageSize(value: string | number): void {
    const pageSize = Number(value);

    if (!pageSize || pageSize <= 0) {
      return;
    }

    this.recordPerPage.set(pageSize);

    this.pageNumber.set(1);

    this.fetchDashboardList();
  }

  /* ============================================================
     FIRST PAGE
  ============================================================ */

  goToFirstPage(): void {
    if (this.pageNumber() <= 1) {
      return;
    }

    this.pageNumber.set(1);

    this.fetchDashboardList();
  }

  /* ============================================================
     PREVIOUS PAGE
  ============================================================ */

  goToPreviousPage(): void {
    if (this.pageNumber() <= 1) {
      return;
    }

    this.pageNumber.update((page) => page - 1);

    this.fetchDashboardList();
  }

  /* ============================================================
     NEXT PAGE
  ============================================================ */

  goToNextPage(): void {
    if (this.pageNumber() >= this.totalPages()) {
      return;
    }

    this.pageNumber.update((page) => page + 1);

    this.fetchDashboardList();
  }

  /* ============================================================
     LAST PAGE
  ============================================================ */

  goToLastPage(): void {
    const lastPage = this.totalPages();

    if (lastPage <= 0 || this.pageNumber() >= lastPage) {
      return;
    }

    this.pageNumber.set(lastPage);

    this.fetchDashboardList();
  }

  /* ============================================================
     BACK TO DASHBOARD
  ============================================================ */

  goBackToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
