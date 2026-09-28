import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  CellClickedEvent,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from 'ag-grid-community';
import { ScheduleService, ScheduleItem } from '../../services/schedule/schedule';
import { CryptoHelper } from '../../helpers/crypto-helper';
import { ScheduleEdit, ScheduleData } from './schedule-edit/schedule-edit';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface ScheduleRow {
  srNo?: number;
  id?: string | number;
  schedule_autoid?: number;
  ScheduleAutoId?: number;
  Schedule_AutoId?: number;
  openingDate?: string;
  closingDate?: string;
  opening_date?: string;
  closing_date?: string;
  OpeningDate?: string;
  ClosingDate?: string;
  isArmy?: boolean;
  isNavy?: boolean;
  isAirForce?: boolean;
  is_army?: boolean;
  is_navy?: boolean;
  is_air_force?: boolean;
  IsArmy?: boolean;
  IsNavy?: boolean;
  IsAirForce?: boolean;
  active?: boolean;
  isActive?: boolean;
  IsActive?: boolean;
  Active?: boolean;
  notification_open_for_all_state?: boolean | null;
  notificationOpenForAllState?: boolean;
  createdAt?: string;
  created_at?: string;
  CreatedAt?: string;
  updatedAt?: string;
  updated_at?: string;
  UpdatedAt?: string;
  profileEditOpeningDate?: string;
  profileEditClosingDate?: string;
  profileedit_opening_date?: string;
  profileedit_closing_date?: string;
  ProfileEditOpeningDate?: string;
  ProfileEditClosingDate?: string;
  open_part_b?: boolean;
  open_part_c?: boolean;
  round?: number | string;
  Round?: number | string;
  [key: string]: any;
}

function formatDisplayDate(val: any): string {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = d.getDate();
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(val);
  }
}

@Component({
  selector: 'app-schedule-management',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, ScheduleEdit],
  templateUrl: './schedule-management.html',
  styleUrl: './schedule-management.css',
})
export class ScheduleManagement implements OnInit {
  private readonly scheduleService = inject(ScheduleService);
  private gridApi!: GridApi<ScheduleRow>;

  readonly Math = Math;
  readonly isLoading = signal(false);
  readonly isModalOpen = signal(false);
  readonly selectedSchedule = signal<ScheduleItem | null>(null);
  readonly hasActiveSchedule = signal<boolean>(false);

  // Exact row and header heights from role-management
  rowHeight = 38;
  headerHeight = 30;

  // Pagination state matching role-management
  pageSize = 10;
  currentPage = 1;
  totalRecords = 0;
  totalPages = 1;

  allSchedules: ScheduleRow[] = [];
  rowData: ScheduleRow[] = [];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 90,
  };

  colDefs: ColDef<ScheduleRow>[] = [
    {
      headerName: 'SR. NO.',
      width: 80,
      minWidth: 70,
      maxWidth: 90,
      sortable: false,
      filter: false,
      resizable: false,
      valueGetter: (params) => {
        return (params.node?.rowIndex ?? 0) + 1 + (this.currentPage - 1) * this.pageSize;
      },
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#333',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'OPENING DATE',
      field: 'openingDate',
      flex: 1,
      minWidth: 150,
      filter: 'agTextColumnFilter',
      valueGetter: (params) => {
        const val =
          params.data?.openingDate ?? params.data?.opening_date ?? params.data?.OpeningDate;
        return formatDisplayDate(val);
      },
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#222',
        fontWeight: '500',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'CLOSING DATE',
      field: 'closingDate',
      flex: 1,
      minWidth: 150,
      filter: 'agTextColumnFilter',
      valueGetter: (params) => {
        const val =
          params.data?.closingDate ?? params.data?.closing_date ?? params.data?.ClosingDate;
        return formatDisplayDate(val);
      },
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#222',
        fontWeight: '500',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'FORCES',
      flex: 1.2,
      minWidth: 230,
      sortable: false,
      filter: 'agTextColumnFilter',
      filterValueGetter: (params) => {
        const d = params.data || {};
        const isTrue = (v: any) => v === true || v === 'true' || v === 1 || v === '1';
        const forces: string[] = [];
        if (isTrue(d.isArmy ?? d.is_army ?? d.IsArmy)) forces.push('Army');
        if (isTrue(d.isNavy ?? d.is_navy ?? d.IsNavy)) forces.push('Navy');
        if (isTrue(d.isAirForce ?? d.is_air_force ?? d.IsAirForce)) forces.push('Air Force');
        return forces.join(' ');
      },
      cellRenderer: (params: ICellRendererParams<ScheduleRow>) => {
        const d = params.data || {};
        const isTrue = (v: any) => v === true || v === 'true' || v === 1 || v === '1';
        const isArmy = isTrue(d.isArmy ?? d.is_army ?? d.IsArmy);
        const isNavy = isTrue(d.isNavy ?? d.is_navy ?? d.IsNavy);
        const isAirForce = isTrue(d.isAirForce ?? d.is_air_force ?? d.IsAirForce);

        const badge = (label: string) => `<span style="
          display:inline-flex;
          align-items:center;
          padding:2px 8px;
          border-radius:12px;
          font-size:11px;
          font-weight:600;
          background-color:#ecfdf5;
          color:#059669;
          border:1px solid #86efac;
          line-height:1;
          font-family:'Poppins',sans-serif;
        ">${label}</span>`;

        const badges: string[] = [];
        if (isArmy) badges.push(badge('Army'));
        if (isNavy) badges.push(badge('Navy'));
        if (isAirForce) badges.push(badge('Air Force'));

        if (badges.length === 0) {
          return `<span style="color:#94a3b8;font-size:12px;font-family:'Poppins',sans-serif;">-</span>`;
        }

        return `
          <div style="display:flex;align-items:center;gap:6px;height:100%;font-family:'Poppins',sans-serif;">
            ${badges.join('')}
          </div>
        `;
      },
    },
    {
      headerName: 'STATUS',
      minWidth: 140,
      width: 140,
      sortable: true,
      filter: 'agTextColumnFilter',
      filterValueGetter: (params) => {
        const d = params.data || {};
        const active = Boolean(d.active ?? d.isActive ?? d.IsActive ?? d.Active ?? false);
        return active ? 'Active' : 'Inactive';
      },
      cellRenderer: (params: ICellRendererParams<ScheduleRow>) => {
        const d = params.data || {};
        const active = Boolean(d.active ?? d.isActive ?? d.IsActive ?? d.Active ?? false);

        return `
          <div class="status-cell" style="font-family:'Poppins',sans-serif;">
            <span class="user-status-pill ${active ? 'active' : 'inactive'}">
              <span class="status-dot"></span>
              <span>${active ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
        `;
      },
    },
    {
      headerName: 'CREATED AT',
      field: 'createdAt',
      flex: 1,
      minWidth: 150,
      filter: 'agTextColumnFilter',
      valueGetter: (params) => {
        const val = params.data?.createdAt ?? params.data?.created_at ?? params.data?.CreatedAt;
        return formatDisplayDate(val);
      },
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#555',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'ACTIONS',
      width: 95,
      minWidth: 90,
      maxWidth: 105,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params: ICellRendererParams<ScheduleRow>) => {
        const d = params.data || {};
        // const isActive = Boolean(d.active ?? d.isActive ?? d.IsActive ?? d.Active ?? false);

        // if (!isActive) {
        //   return `
        //     <div class="action-buttons" style="font-family:'Poppins',sans-serif;display:flex;align-items:center;justify-content:center;height:100%;color:#94a3b8;font-size:13px;">
        //       <span>-</span>
        //     </div>
        //   `;
        // }

        return `
          <div class="action-buttons" style="font-family:'Poppins',sans-serif;">
            <button
              type="button"
              class="action-edit"
              data-action="edit"
              title="Edit Schedule"
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

  ngOnInit(): void {
    this.loadSchedules();
  }

  onGridReady(params: GridReadyEvent<ScheduleRow>): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onCellClicked(params: CellClickedEvent): void {
    const target = params.event?.target as HTMLElement;
    const editBtn = target?.closest('[data-action="edit"]');
    if (editBtn && params.data) {
      this.openEditModal(params.data);
      // const d = params.data;
      // const isActive = Boolean(d.active ?? d.isActive ?? d.IsActive ?? d.Active ?? false);
      // if (isActive) {
      // }
    }
  }

  openCreateModal(): void {
    // if (this.hasActiveSchedule()) {
    //   return;
    // }
    this.selectedSchedule.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(row: ScheduleRow): void {
    this.selectedSchedule.set(row as ScheduleItem);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onScheduleUpdated(data: ScheduleData): void {
    this.loadSchedules();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = Number(newSize);
    this.currentPage = 1;
    this.loadSchedules(this.currentPage, this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || (this.totalPages > 0 && page > this.totalPages)) return;
    this.currentPage = page;
    this.loadSchedules(this.currentPage, this.pageSize);
  }

  loadSchedules(page: number = this.currentPage, size: number = this.pageSize): void {
    this.isLoading.set(true);
    this.currentPage = page;
    this.pageSize = size;

    const payload = {
      page_number: this.currentPage,
      record_per_page: this.pageSize,
    };
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.scheduleService.getScheuleList(encryptedPayload).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        let list: ScheduleRow[] = [];

        if (res?.code === 1 && res?.data) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const data = typeof dec === 'string' ? JSON.parse(dec) : dec;
            const schedule = data?.records;

            if (Array.isArray(schedule)) {
              list = schedule.map((item, idx) =>
                this.mapToRow(item, (this.currentPage - 1) * this.pageSize + idx + 1),
              );
            } else if (
              schedule &&
              typeof schedule === 'object' &&
              Object.keys(schedule).length > 0
            ) {
              list = [this.mapToRow(schedule, (this.currentPage - 1) * this.pageSize + 1)];
            }

            const total =
              data?.total_records ??
              data?.total_record ??
              data?.totalRecords ??
              data?.totalCount ??
              data?.total;

            if (total !== null && total !== undefined) {
              this.totalRecords = Number(total);
            } else if (data?.total_pages) {
              this.totalRecords = Number(data.total_pages) * this.pageSize;
            } else {
              this.totalRecords = Math.max(
                this.totalRecords,
                (this.currentPage - 1) * this.pageSize + list.length,
              );
            }

            this.totalPages =
              this.totalRecords > 0
                ? Math.ceil(this.totalRecords / this.pageSize)
                : Number(data?.total_pages ?? 1);
          } catch (e) {
            console.error('Error decrypting schedule:', e);
          }
        }

        this.rowData = list;
        this.allSchedules = list;
        this.hasActiveSchedule.set(
          this.rowData.some((s) =>
            Boolean(s.active ?? s.isActive ?? s.IsActive ?? s.Active ?? false),
          ),
        );

        if (this.gridApi) {
          this.gridApi.setGridOption('rowData', this.rowData);
          this.gridApi.sizeColumnsToFit();
        }
      },
      error: (err) => {
        console.warn('Could not fetch schedules:', err);
        this.isLoading.set(false);
      },
    });
  }

  private mapToRow(item: any, srNo: number): ScheduleRow {
    return {
      ...item,
      srNo,
      id: item.Id ?? item.id ?? item.schedule_autoid ?? item.ScheduleAutoId ?? srNo,
      schedule_autoid: item.schedule_autoid ?? item.ScheduleAutoId ?? item.Id ?? item.id,
      ScheduleAutoId: item.ScheduleAutoId ?? item.schedule_autoid ?? item.Id ?? item.id,
      openingDate: item.OpeningDate ?? item.openingDate ?? item.opening_date,
      closingDate: item.ClosingDate ?? item.closingDate ?? item.closing_date,
      isArmy: Boolean(item.IsArmy ?? item.isArmy ?? item.is_army),
      isNavy: Boolean(item.IsNavy ?? item.isNavy ?? item.is_navy),
      isAirForce: Boolean(item.IsAirForce ?? item.isAirForce ?? item.is_air_force),
      active: Boolean(item.Active ?? item.active ?? item.IsActive ?? item.isActive),
      notification_open_for_all_state:
        item.notification_open_for_all_state ??
        item.notificationOpenForAllState ??
        item.NotificationOpenForAllState ??
        false,

      notificationOpenForAllState:
        item.notification_open_for_all_state ??
        item.notificationOpenForAllState ??
        item.NotificationOpenForAllState ??
        false,
      createdAt:
        item.CreatedAt ?? item.createdAt ?? item.created_at ?? item.UpdatedAt ?? item.updatedAt,
      profileEditOpeningDate:
        item.ProfileEditOpeningDate ?? item.profileEditOpeningDate ?? item.profileedit_opening_date,
      profileEditClosingDate:
        item.ProfileEditClosingDate ?? item.profileEditClosingDate ?? item.profileedit_closing_date,
      round: item.Round ?? item.round,
      OpenPartB: item.OpenPartB ?? item.open_part_b ?? item.openPartB,
      open_part_b: item.open_part_b ?? item.OpenPartB ?? item.openPartB,
      OpenPartC: item.OpenPartC ?? item.open_part_c ?? item.openPartC,
      open_part_c: item.open_part_c ?? item.OpenPartC ?? item.openPartC,
    };
  }
}
