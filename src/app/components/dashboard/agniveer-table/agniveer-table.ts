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
  CellClickedEvent,
} from 'ag-grid-community';
import { DashboardService } from '../../../services/dashboard/dashboard';
import { CryptoHelper } from '../../../helpers/crypto-helper';
import { CommonService } from '../../../services/common-service';
import { Myprofile } from '../../../services/myprofile/myprofile';
import { JobNotificationService } from '../../../services/notification/notification';
import Swal from 'sweetalert2';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface AgniveerTableItem {
  srNo?: number;
  agniveer_autoid?: number | string;
  Agniveer_Id_No: string;
  Name: string;
  Gender: string;
  Email_ID: string;
  agniveer_force_type_id: number | string;
  agniveer_force_type: string;
  category?: string;
  state?: string;
  rcategory?: string;
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
  private readonly commonService = inject(CommonService);
  private readonly myProfile = inject(Myprofile);
  private readonly notificationService = inject(JobNotificationService);

  readonly activeFilter = signal<string>('all');
  readonly draftSave = signal<number | null>(null);
  readonly selectedPart = signal<string | null>(null);
  readonly tableTitle = signal<string>('Agniveer Candidates');
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<string>('');
  readonly selectedState = signal<string>('');
  readonly selectedRCategory = signal<string>('');
  readonly categorySearch = signal<string>('');
  readonly stateSearch = signal<string>('');
  readonly rcategorySearch = signal<string>('');

  readonly openDropdown = signal<'category' | 'state' | 'rcategory' | null>(null);

  readonly categoryList = signal<any[]>([]);
  readonly stateList = signal<any[]>([]);
  readonly rcategoryList = signal<any[]>([]);
  readonly rawRecords = signal<AgniveerTableItem[]>([]);
  readonly isInitialLoading = signal<boolean>(true);
  readonly isLoading = signal<boolean>(false);
  readonly selectedFilterType = signal<'' | 'category' | 'state' | 'rcategory'>('');

  readonly selectedFilterValue = signal<string>('');

  readonly filterMasterList = signal<any[]>([]);

  // Pagination Signals
  readonly pageNumber = signal<number>(1);
  readonly recordPerPage = signal<number>(20);
  readonly totalRecords = signal<number>(0);
  readonly totalPages = signal<number>(1);

  readonly Math = Math;

  readonly filteredCategoryList = computed(() => {
    const search = this.categorySearch().trim().toLowerCase();

    if (!search) {
      return this.categoryList();
    }

    return this.categoryList().filter((item: any) =>
      String(item.name ?? item.category ?? item.Category ?? item.category_name ?? '')
        .toLowerCase()
        .includes(search),
    );
  });

  readonly filteredStateList = computed(() => {
    const search = this.stateSearch().trim().toLowerCase();

    if (!search) {
      return this.stateList();
    }

    return this.stateList().filter((item: any) =>
      String(item.name ?? item.StateName ?? item.state_name ?? item.stateName ?? item.state ?? '')
        .toLowerCase()
        .includes(search),
    );
  });

  readonly filteredRCategoryList = computed(() => {
    const search = this.rcategorySearch().trim().toLowerCase();

    if (!search) {
      return this.rcategoryList();
    }

    return this.rcategoryList().filter((item: any) =>
      String(
        item.name ??
          item.reservation_category ??
          item.reservationCategory ??
          item.rcategory ??
          item.category ??
          item.category_name ??
          '',
      )
        .toLowerCase()
        .includes(search),
    );
  });

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
      headerName: 'DOMICILE STATE/UT',
      field: 'state',
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
      headerName: 'CENTRAL RESERVATION CATEGORY',
      field: 'category',
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
      headerName: 'STATE RESERVATION CATEGORY',
      field: 'rcategory',
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
    // {
    //   headerName: 'ACTION',
    //   width: 105,
    //   minWidth: 95,
    //   maxWidth: 125,
    //   sortable: false,
    //   filter: false,
    //   resizable: false,
    //   cellStyle: {
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //   },
    //   cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
    //     return `
    //       <div class="action-cell">
    //         <button
    //           type="button"
    //           class="action-view-btn"
    //           data-action="view"
    //           title="View Candidate Profile"
    //         >
    //           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    //             <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"></path>
    //             <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
    //           </svg>
    //           <span>View</span>
    //         </button>
    //       </div>
    //     `;
    //   },
    // },
    // {
    //   headerName: 'GENDER',
    //   field: 'Gender',
    //   minWidth: 100,
    //   flex: 0.8,
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
    // {
    //   headerName: 'FORCE TYPE',
    //   field: 'agniveer_force_type',
    //   minWidth: 140,
    //   flex: 1,
    //   sortable: true,
    //   filter: true,
    //   resizable: true,
    //   cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
    //     return `
    //       <span class="user-text" style="color: #1267e8; font-weight: 600;">
    //         ${params.value || '-'}
    //       </span>
    //     `;
    //   },
    // },
    // {
    //   headerName: 'REHABILITATED',
    //   field: 'rehabilitated',
    //   minWidth: 140,
    //   flex: 0.9,
    //   sortable: true,
    //   filter: true,
    //   resizable: true,
    //   cellRenderer: (params: ICellRendererParams<AgniveerTableItem>) => {
    //     const active = params.value === true;
    //     return `
    //       <div class="status-cell">
    //         <span class="user-status-pill ${active ? 'active' : 'inactive'}">
    //           <span class="status-dot"></span>
    //           <span>${active ? 'Yes' : 'No'}</span>
    //         </span>
    //       </div>
    //     `;
    //   },
    // },
  ];

  get displayedColDefs(): ColDef<AgniveerTableItem>[] {
    const isPartBNotFilled = this.activeFilter() === 'partB_not_filled';

    if (!isPartBNotFilled) {
      return this.colDefs;
    }

    return this.colDefs.filter(
      (col) => col.field !== 'category' && col.field !== 'state' && col.field !== 'rcategory',
    );
  }

  readonly filteredRecords = computed(() => {
    const list = this.rawRecords();
    const filter = this.activeFilter();

    let filtered = list;
    if (filter === 'rehabilitated') {
      filtered = list.filter((item) => Boolean(item.rehabilitated));
    } else if (filter === 'toBeRehab') {
      filtered = list.filter((item) => !Boolean(item.rehabilitated));
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

  toggleDropdown(type: 'category' | 'state' | 'rcategory'): void {
    if (this.openDropdown() === type) {
      this.openDropdown.set(null);
      return;
    }

    this.openDropdown.set(type);
  }

  selectCategory(value: string): void {
    this.selectedCategory.set(value);
    this.pageNumber.set(1);

    this.categorySearch.set('');
    this.openDropdown.set(null);

    this.fetchAgniveerData();
  }

  selectState(value: string): void {
    this.selectedState.set(value);
    this.pageNumber.set(1);

    this.stateSearch.set('');
    this.openDropdown.set(null);

    this.fetchAgniveerData();
  }

  selectRCategory(value: string): void {
    this.selectedRCategory.set(value);
    this.pageNumber.set(1);

    this.rcategorySearch.set('');
    this.openDropdown.set(null);

    this.fetchAgniveerData();
  }

  readonly selectedCategoryName = computed(() => {
    const id = this.selectedCategory();

    if (!id) {
      return '';
    }

    const item = this.categoryList().find(
      (x: any) => String(x.id ?? x.autocategory_id ?? x.category_id ?? x.categoryId) === String(id),
    );

    return (
      item?.name ??
      item?.category ??
      item?.Category ??
      item?.category_name ??
      item?.CategoryName ??
      ''
    );
  });

  readonly selectedStateName = computed(() => {
    const id = this.selectedState();

    if (!id) {
      return '';
    }

    const item = this.stateList().find(
      (x: any) => String(x.id ?? x.StateCd ?? x.state_cd ?? x.stateId ?? x.state_id) === String(id),
    );

    return (
      item?.name ?? item?.StateName ?? item?.state_name ?? item?.stateName ?? item?.state ?? ''
    );
  });

  readonly selectedRCategoryName = computed(() => {
    const id = this.selectedRCategory();

    if (!id) {
      return '';
    }

    const item = this.rcategoryList().find(
      (x: any) =>
        String(
          x.id ??
            x.reservation_category_id ??
            x.reservationCategoryId ??
            x.rcategory_id ??
            x.rcategoryId,
        ) === String(id),
    );

    return (
      item?.name ??
      item?.reservation_category ??
      item?.reservationCategory ??
      item?.rcategory ??
      item?.category ??
      item?.category_name ??
      ''
    );
  });

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value);
    this.pageNumber.set(1);
    this.fetchAgniveerData();
  }

  onStateChange(value: string): void {
    this.selectedState.set(value);
    this.pageNumber.set(1);
    this.fetchAgniveerData();
  }

  onRCategoryChange(value: string): void {
    this.selectedRCategory.set(value);
    this.pageNumber.set(1);
    this.fetchAgniveerData();
  }

  ngOnInit(): void {
    // Read query parameters (e.g. ?filter=partB_filled&draft_save=1&part=B)
    this.route.queryParams.subscribe((params) => {
      const f = params['filter'] || 'all';
      this.activeFilter.set(f);

      if (
        params['draft_save'] !== undefined &&
        params['draft_save'] !== null &&
        params['draft_save'] !== ''
      ) {
        this.draftSave.set(Number(params['draft_save']));
      } else {
        this.draftSave.set(null);
      }

      const part = params['part'] || null;
      this.selectedPart.set(part);

      // Determine page title based on filter & draft_save & part
      if (f === 'partB_filled' || (part === 'B' && this.draftSave() === 1)) {
        this.tableTitle.set('Agniveer Candidates - Part B Filled');
      } else if (f === 'partB_not_filled' || (part === 'B' && this.draftSave() === 0)) {
        this.tableTitle.set('Agniveer Candidates - Part B Not Filled');
      } else if (f === 'partC_filled' || (part === 'C' && this.draftSave() === 1)) {
        this.tableTitle.set('Agniveer Candidates - Part C Filled');
      } else if (f === 'partC_not_filled' || (part === 'C' && this.draftSave() === 0)) {
        this.tableTitle.set('Agniveer Candidates - Part C Not Filled');
      } else if (f === 'rehabilitated') {
        this.tableTitle.set('Agniveer Candidates - Rehabilitated');
      } else if (f === 'toBeRehab') {
        this.tableTitle.set('Agniveer Candidates - To Be Rehabilitated');
      } else {
        this.tableTitle.set('Agniveer Candidates');
      }

      // this.loadCategoryMaster();
      // this.loadStateMaster();
      // this.loadRCategoryMaster();

      this.fetchAgniveerData();
    });
  }

  onSearchClick(): void {
    this.pageNumber.set(1);
    this.fetchAgniveerData();
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.pageNumber.set(1);
    this.fetchAgniveerData();
  }

  fetchAgniveerData(): void {
    this.isLoading.set(true);
    let param: any = {
      page_number: this.pageNumber(),
      record_per_page: this.recordPerPage(),
      category_id: this.selectedCategory() ? Number(this.selectedCategory()) : null,

      state_id: this.selectedState() ? Number(this.selectedState()) : null,

      rcategory_id: this.selectedRCategory() ? Number(this.selectedRCategory()) : null,
    };

    if (this.selectedPart() === 'C' && this.draftSave() === 1) {
      this.fetchPartCSubmitted();
      return;
    }

    const q = this.searchQuery().trim();
    if (q) {
      param.searchKey = q;
    }

    if (this.draftSave() !== null) {
      param.draft_save = this.draftSave();
    }

    const payload = JSON.stringify(param);
    const encryptedPayload = CryptoHelper.encrypt(payload);

    this.dashboardService.getAgniveerData(JSON.stringify(encryptedPayload)).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res && res.code === 1 && res.data) {
          let resData: any = CryptoHelper.decrypt(res.data);
          try {
            resData = JSON.parse(resData);

            // console.log('===== PARSED RESPONSE =====');
            // console.log('PARSED DATA:', resData);
          } catch {
            // Already parsed
          }
          // console.log('[AgniveerTable] Fetched page:', resData);

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
          const mapped: AgniveerTableItem[] = records.map((r: any, idx: number) => {
            const candidates = [
              r.agniveer_autoid,
              r.AgniveerAutoId,
              r.Agniveer_Auto_Id,
              r.Agniveer_autoid,
              r.userautoId,
              r.user_autoid,
              r.UserAutoId,
              r.autoid,
              r.AutoId,
              r.id,
              r.Id,
            ];
            let autoId: number | undefined = undefined;
            for (const c of candidates) {
              if (c !== undefined && c !== null && c !== '' && !isNaN(Number(c)) && Number(c) > 0) {
                autoId = Number(c);
                break;
              }
            }

            return {
              srNo: startIdx + idx + 1,
              agniveer_autoid: autoId,
              Agniveer_Id_No:
                r.Agniveer_Id_No ||
                r.agniveer_id_no ||
                (typeof r.id === 'string' ? r.id : '') ||
                '',
              Name: r.Name || r.name || r.candidate_name || '',
              Gender: r.Gender || r.gender || '',
              Email_ID: r.Email_ID || r.email_id || r.email || '',
              agniveer_force_type_id: r.agniveer_force_type_id ?? '',
              agniveer_force_type: r.agniveer_force_type || r.force_type,
              rehabilitated: Boolean(r.rehabilitated),
              category: r.category || '',
              state: r.state || '',
              rcategory: r.rcategory || '',
              raw: r,
            };
          });

          this.rawRecords.set(mapped);
          this.isInitialLoading.set(false);
          setTimeout(() => this.gridApi?.sizeColumnsToFit(), 50);
        } else {
          // this.isInitialLoading.set(false);
          this.router.navigate(['/']);
        }
      },
      error: (err: any) => {
        this.isLoading.set(false);
        // this.isInitialLoading.set(false);
        this.router.navigate(['/']);
      },
    });
  }

  fetchPartCSubmitted(): void {
    this.isLoading.set(true);

    const payload = {
      page_number: this.pageNumber(),
      record_per_page: this.recordPerPage(),
      searchKey: this.searchQuery().trim() || undefined,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    this.dashboardService.getAllPreferences(JSON.stringify(encryptedPayload)).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);

        if (res && (res.code === 1 || res.code === '1') && res.data) {
          try {
            let decryptedData: any = res?.data ?? res;

            if (typeof decryptedData === 'string') {
              decryptedData = CryptoHelper.decrypt(decryptedData);
            }

            const data =
              typeof decryptedData === 'string' ? JSON.parse(decryptedData) : decryptedData;

            const records = Array.isArray(data)
              ? data
              : data?.AgniveerPreferences ||
                data?.Table ||
                data?.table ||
                data?.records ||
                data?.Records ||
                data?.data ||
                [];

            const total = Number(data?.total_records ?? data?.total ?? records.length);

            const totalPages = Number(
              (data?.total_pages ?? Math.ceil(total / this.recordPerPage())) || 1,
            );

            this.totalRecords.set(total);
            this.totalPages.set(totalPages);

            const startIdx = (this.pageNumber() - 1) * this.recordPerPage();

            const mapped: AgniveerTableItem[] = records.map((r: any, idx: number) => ({
              srNo: startIdx + idx + 1,

              agniveer_autoid: r.agniveer_autoid ?? r.AgniveerAutoId ?? r.agniveer_id ?? r.id,

              Agniveer_Id_No:
                r.AgniveerIdNo ??
                r.Agniveer_Id_No ??
                r.agniveer_id_no ??
                r.AgniveerId ??
                r.agniveer_id ??
                '',

              Name: r.Name ?? r.name ?? r.candidate_name ?? '',

              Gender: r.Gender ?? r.gender ?? '',

              Email_ID: r.Email_ID ?? r.email_id ?? r.email ?? '',

              agniveer_force_type_id: r.agniveer_force_type_id ?? r.force_type_id ?? '',

              agniveer_force_type: r.agniveer_force_type ?? r.force_type ?? '',

              rehabilitated: Boolean(r.rehabilitated),

              category: r.Category ?? r.category ?? '',

              state: r.State ?? r.state ?? '',

              rcategory: r.RCategory ?? r.rcategory ?? '',

              raw: r,
            }));

            this.rawRecords.set(mapped);
            this.isInitialLoading.set(false);

            setTimeout(() => {
              this.gridApi?.sizeColumnsToFit();
            }, 50);
          } catch (error) {
            // this.isInitialLoading.set(false);
            this.router.navigate(['/']);
          }
        } else {
          // this.isInitialLoading.set(false);
          this.router.navigate(['/']);
        }
      },

      error: (err: any) => {
        this.isLoading.set(false);
        // this.isInitialLoading.set(false);
        this.router.navigate(['/']);
      },
    });
  }

  // ── Cell Click & View Action ─────────────────────────────────────

  onCellClicked(event: CellClickedEvent<AgniveerTableItem>): void {
    const target = event.event?.target as HTMLElement | null;
    const btn = target?.closest('button[data-action="view"]');
    if (!btn) return;

    const item = event.data;
    if (!item) return;

    this.viewCandidateProfile(item);
  }

  viewCandidateProfile(item: AgniveerTableItem): void {
    const r = item.raw || {};
    const candidates = [
      item.agniveer_autoid,
      r.agniveer_autoid,
      r.AgniveerAutoId,
      r.Agniveer_Auto_Id,
      r.Agniveer_autoid,
      r.userautoId,
      r.user_autoid,
      r.UserAutoId,
      r.autoid,
      r.AutoId,
      r.id,
      r.Id,
    ];
    // console.log(r, 'rs');

    let autoId: number | undefined = undefined;
    for (const c of candidates) {
      if (c !== undefined && c !== null && c !== '' && !isNaN(Number(c)) && Number(c) > 0) {
        autoId = Number(c);
        break;
      }
    }

    const idNo = item.Agniveer_Id_No || r.Agniveer_Id_No || r.agniveer_id_no || '';

    if (autoId !== undefined) {
      sessionStorage.setItem('view_agniveer_autoid', String(autoId));
    } else {
      sessionStorage.removeItem('view_agniveer_autoid');
    }
    if (idNo) {
      sessionStorage.setItem('view_agniveer_id_no', String(idNo));
    }

    const targetId = autoId !== undefined ? String(autoId) : idNo;
    const queryParams: any = {};
    if (targetId) {
      queryParams.id = CryptoHelper.encrypt(targetId);
    }
    if (this.selectedPart()) {
      queryParams.part = this.selectedPart();
    }

    this.router.navigate(['/viewprofile'], {
      queryParams,
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

  setFilter(filter: string): void {
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

  @HostListener('window:resize')
  onWindowResize(): void {
    this.gridApi?.sizeColumnsToFit();
  }
}
