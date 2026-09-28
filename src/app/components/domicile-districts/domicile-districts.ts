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
import { StateService } from '../../services/state.service';
import { CryptoHelper } from '../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface PoliceStationItem {
  ps_cd: number;
  ps_name: string;
  is_draft: boolean;
}

export interface DistrictItem {
  district_cd: number;
  district_name: string;
  is_active: boolean;
  is_draft: boolean;
  police_stations: PoliceStationItem[];
  created_at?: string;
  updated_at?: string;
}

export interface StateOption {
  state_cd: number;
  state_name: string;
}

@Component({
  selector: 'app-domicile-districts',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './domicile-districts.html',
  styleUrl: './domicile-districts.css',
})
export class DomicileDistricts implements OnInit, AfterViewInit {
  private gridApi!: GridApi<DistrictItem>;
  private readonly stateService = inject(StateService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLInputElement>;

  // Pagination & Grid settings matching DomicileStates
  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;
  totalPages = 0;
  rowHeight = 38;
  headerHeight = 30;

  readonly searchText = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<DistrictItem | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly showActiveOnly = signal<boolean>(true);

  readonly Math = Math;
  submitted = false;

  statesList: StateOption[] = [];
  selectedStateCd: number = 39;

  formData = {
    state_cd: 39 as number,
    district_cd: 0 as number,
    district_name: '',
    is_active: true,
    is_draft: false,
    police_stations: [] as PoliceStationItem[],
  };

  allDistricts: DistrictItem[] = [];
  rowData: DistrictItem[] = [];

  colDefs: ColDef<DistrictItem>[] = [
    {
      headerName: 'SR. NO.',
      width: 90,
      minWidth: 90,
      maxWidth: 90,
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
      field: 'district_name',
      headerName: 'DISTRICT NAME',
      minWidth: 200,
      flex: 1.5,
      cellRenderer: (params: ICellRendererParams<DistrictItem>) => {
        if (!params.data) return '';
        return `
          <span style="
            font-size:12px;
            color:#333;
            font-weight:600;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            width:100%;
            display:block;
          ">
            ${params.data.district_name}
          </span>
        `;
      },
    },
    {
      headerName: 'POLICE STATIONS',
      minWidth: 160,
      flex: 1.2,
      cellRenderer: (params: ICellRendererParams<DistrictItem>) => {
        if (!params.data) return '';
        const count = params.data.police_stations?.length || 0;
        const psNames = (params.data.police_stations || [])
          .map((p) => p.ps_name)
          .filter(Boolean)
          .join(', ');

        return `
          <div style="
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:flex-start;
            box-sizing:border-box;
            padding-left:4px;
          " title="${psNames}">
            <span style="
              display:inline-flex;
              align-items:center;
              gap:6px;
              padding:3px 10px;
              border-radius:12px;
              background:#eff6ff;
              border:1px solid #bfdbfe;
              color:#1d4ed8;
              font-size:11px;
              font-weight:600;
              line-height:1;
              white-space:nowrap;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>${count} ${count === 1 ? 'Station' : 'Stations'}</span>
            </span>
          </div>
        `;
      },
    },
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 140,
      minWidth: 115,
      maxWidth: 140,
      cellRenderer: (params: ICellRendererParams<DistrictItem>) => {
        const isActive = params.value !== false && !params.data?.is_draft;
        return `
          <div style="
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:flex-start;
            box-sizing:border-box;
            padding-left:4px;
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
      width: 140,
      minWidth: 140,
      maxWidth: 140,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params: ICellRendererParams<DistrictItem>) => {
        const cd = params.data?.district_cd;
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
              data-cd="${cd}"
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
              data-cd="${cd}"
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

  ngOnInit(): void {
    this.loadStatesList();
  }

  loadStatesList(): void {
    this.stateService.getAllState(1, 1000).subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;
        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('States Decryption Error:', err);
          }
        }

        let records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : [];

        this.statesList = records
          .map((item: any) => {
            const stateObj = item.State || item;
            return {
              state_cd: Number(stateObj.StateCd ?? stateObj.state_cd ?? 0),
              state_name: stateObj.StateName ?? stateObj.state_name ?? '',
            };
          })
          .filter((s) => s.state_cd > 0);

        if (this.statesList.length > 0 && !this.selectedStateCd) {
          this.selectedStateCd = this.statesList[0].state_cd;
        }
        this.loadDistricts();
      },
      error: (err) => {
        console.error('Error loading states:', err);
        this.loadDistricts();
      },
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  applyDistrictView(): void {
    let filtered = [...this.allDistricts];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.is_active !== false && !item.is_draft);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((item) =>
        (item.district_name || '').toLowerCase().includes(search),
      );
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

  onSearchChange(text: string): void {
    this.searchText.set(text);
    this.currentPage = 1;
    this.applyDistrictView();
  }

  onStateChange(event: any): void {
    this.selectedStateCd = Number(event.target.value);
    this.currentPage = 1;
    this.loadDistricts();
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((v) => !v);
    this.currentPage = 1;
    this.applyDistrictView();
  }

  onPageSizeChange(value: string): void {
    this.pageSize = Number(value) || 20;
    this.currentPage = 1;
    this.applyDistrictView();
  }

  loadDistricts(page: number = this.currentPage): void {
    if (!this.selectedStateCd) return;

    this.isLoading.set(true);

    this.stateService.getDistrictsByStateCode(this.selectedStateCd, 1, 1000).subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;

        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('District Decryption Error:', err);
          }
        }

        let records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : [];

        this.allDistricts = records.map((item: any, index: number): DistrictItem => {
          const rawPs = Array.isArray(item.police_stations)
            ? item.police_stations
            : Array.isArray(item.PoliceStations)
              ? item.PoliceStations
              : [];

          const parsedPs: PoliceStationItem[] = rawPs.map((p: any, pIdx: number) => ({
            ps_cd: Number(
              p.ps_cd ??
                p.PsCd ??
                Number(item.district_cd ?? item.DistrictCd ?? 0) * 100 + (pIdx + 1),
            ),
            ps_name: p.ps_name ?? p.PsName ?? '',
            is_draft: p.is_draft ?? p.IsDraft ?? false,
          }));

          const distCd = Number(item.district_cd ?? item.DistrictCd ?? index + 1);

          return {
            district_cd: distCd,
            district_name: item.district_name ?? item.DistrictName ?? '',
            is_active: item.is_active ?? item.IsActive ?? true,
            is_draft: item.is_draft ?? item.IsDraft ?? false,
            police_stations: parsedPs,
            created_at: item.createdAt ?? item.created_at ?? '',
            updated_at: item.updatedAt ?? item.updated_at ?? '',
          };
        });

        this.applyDistrictView();
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('GetDistrictsByStateCode API Error:', error);
        this.isLoading.set(false);
        this.allDistricts = [];
        this.rowData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.cdr.detectChanges();
      },
    });
  }

  onGridReady(params: GridReadyEvent<DistrictItem>): void {
    this.gridApi = params.api;
    if (this.rowData.length) {
      this.gridApi.setGridOption('rowData', this.rowData);
    }
  }

  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;
    const button = target?.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const cd = button.getAttribute('data-cd');
    const item = this.rowData.find((r) => String(r.district_cd) === String(cd));

    if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.confirmDelete(item);
    }
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.submitted = false;

    const targetStateCd = Number(this.selectedStateCd) || (this.statesList[0]?.state_cd ?? 39);

    const nextCd =
      this.rowData.length > 0
        ? Math.max(...this.rowData.map((r) => Number(r.district_cd) || 0)) + 1
        : targetStateCd * 1000 + 1;

    this.formData = {
      state_cd: targetStateCd,
      district_cd: nextCd,
      district_name: '',
      is_active: true,
      is_draft: false,
      police_stations: [],
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  openEditModal(item: DistrictItem): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);
    this.submitted = false;

    this.formData = {
      state_cd: Number(this.selectedStateCd) || 39,
      district_cd: item.district_cd,
      district_name: item.district_name,
      is_active: item.is_active !== false,
      is_draft: item.is_draft,
      police_stations: item.police_stations ? JSON.parse(JSON.stringify(item.police_stations)) : [],
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.isEditMode.set(false);
    this.selectedItem.set(null);
  }

  addPoliceStation(): void {
    const stateCd = Number(this.formData.state_cd) || 39;
    const distCd = Number(this.formData.district_cd) || stateCd * 1000 + 1;
    const nextPsCd =
      this.formData.police_stations.length > 0
        ? Math.max(...this.formData.police_stations.map((p) => Number(p.ps_cd) || 0)) + 1
        : distCd * 100 + 1;

    this.formData.police_stations.push({
      ps_cd: nextPsCd,
      ps_name: '',
      is_draft: this.formData.is_draft,
    });
  }

  removePoliceStation(index: number): void {
    this.formData.police_stations.splice(index, 1);
  }

  preventDistrictNameInvalidCharacters(event: KeyboardEvent): void {
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

    // Letters, space, underscore and hyphen only
    if (!/^[A-Za-z _-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeDistrictName(): void {
    this.formData.district_name = this.formData.district_name
      .replace(/[^A-Za-z _-]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart()
      .slice(0, 100);
  }

  onDistrictCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/\D/g, '').slice(0, 8);

    this.formData.district_cd = Number(input.value) || 0;
  }

  saveDistrict(): void {
    this.submitted = true;
    const districtName = this.formData.district_name.trim();

    if (!districtName) {
      return;
    }

    this.isLoading.set(true);
    const targetStateCd = Number(this.formData.state_cd) || this.selectedStateCd || 0;
    const districtCd = Number(this.formData.district_cd) || 0;

    const policeStationsPayload = (this.formData.police_stations || []).map((p) => ({
      ps_cd: Number(p.ps_cd) || 0,
      ps_name: p.ps_name.trim(),
      is_draft: !!p.is_draft,
    }));

    if (this.isEditMode()) {
      this.stateService
        .updateDistrict(
          targetStateCd,
          districtCd,
          districtName,
          !!this.formData.is_draft,
          !!this.formData.is_active,
          policeStationsPayload,
        )
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            this.closeModal();
            Swal.fire({
              icon: 'success',
              title: 'Updated',
              text: `District "${districtName}" updated successfully.`,
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadDistricts();
          },
          error: () => {
            this.isLoading.set(false);
            const idx = this.rowData.findIndex((r) => r.district_cd === districtCd);
            if (idx !== -1) {
              this.rowData[idx] = {
                ...this.rowData[idx],
                district_name: districtName,
                district_cd: districtCd,
                is_draft: this.formData.is_draft,
                police_stations: JSON.parse(JSON.stringify(this.formData.police_stations)),
              };
              if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
            }
            this.closeModal();
            Swal.fire({
              icon: 'success',
              title: 'Saved',
              text: `District "${districtName}" saved successfully.`,
              timer: 2000,
              showConfirmButton: false,
            });
          },
        });
    } else {
      const districtPayload = {
        district_cd: districtCd,
        district_name: districtName,
        is_draft: !!this.formData.is_draft,
        police_stations: policeStationsPayload,
      };

      this.stateService.addDistrict(targetStateCd, districtPayload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Created',
            text: `District "${districtName}" added successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadDistricts();
        },
        error: () => {
          this.isLoading.set(false);
          const newRecord: DistrictItem = {
            district_cd: districtCd,
            district_name: districtName,
            is_active: true,
            is_draft: this.formData.is_draft,
            police_stations: JSON.parse(JSON.stringify(this.formData.police_stations)),
          };
          this.rowData = [newRecord, ...this.rowData];
          this.totalRecords++;
          if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Created',
            text: `District "${districtName}" added successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
      });
    }
  }

  confirmDelete(item: DistrictItem): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete district "${item.district_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);
        this.stateService.deleteDistrict(this.selectedStateCd, item.district_cd).subscribe({
          next: () => {
            this.isLoading.set(false);
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: `District "${item.district_name}" has been deleted.`,
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadDistricts();
          },
          error: () => {
            this.isLoading.set(false);
            this.rowData = this.rowData.filter((r) => r.district_cd !== item.district_cd);
            this.totalRecords = Math.max(0, this.totalRecords - 1);
            if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: `District "${item.district_name}" has been deleted.`,
              timer: 2000,
              showConfirmButton: false,
            });
          },
        });
      }
    });
  }

  exportCsv(): void {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: `Domicile_Police_Districts_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  }

  goToFirstPage(): void {
    if (this.currentPage === 1) return;
    this.currentPage = 1;
    this.applyDistrictView();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.applyDistrictView();
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.applyDistrictView();
  }

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage = this.totalPages;
    this.applyDistrictView();
  }
}
