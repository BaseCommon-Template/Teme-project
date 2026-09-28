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

export interface PoliceStationRowItem {
  ps_cd: number;
  ps_name: string;
  is_active: boolean;
  is_draft: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StateOption {
  state_cd: number;
  state_name: string;
}

export interface DistrictOption {
  district_cd: number;
  district_name: string;
}

@Component({
  selector: 'app-domicile-police-stations',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './domicile-police-stations.html',
  styleUrl: './domicile-police-stations.css',
})
export class DomicilePoliceStations implements OnInit, AfterViewInit {
  private gridApi!: GridApi<PoliceStationRowItem>;
  private readonly stateService = inject(StateService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLInputElement>;

  // Pagination & Grid settings matching DomicileStates / DomicileDistricts
  currentPage = 1;
  pageSize = 20;
  totalRecords = 0;
  totalPages = 0;
  rowHeight = 38;
  headerHeight = 30;

  readonly searchText = signal<string>('');
  readonly isModalOpen = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly selectedItem = signal<PoliceStationRowItem | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly showActiveOnly = signal<boolean>(true);

  readonly Math = Math;
  submitted = false;

  statesList: StateOption[] = [];
  districtsList: DistrictOption[] = [];
  modalDistrictsList: DistrictOption[] = [];
  selectedStateCd: number = 39;
  selectedDistrictCd: number = 39001;

  formData = {
    state_cd: 39 as number,
    district_cd: 39001 as number,
    ps_cd: 0 as number,
    ps_name: '',
    is_draft: false,
    is_active: true,
  };

  allPoliceStations: PoliceStationRowItem[] = [];
  rowData: PoliceStationRowItem[] = [];

  colDefs: ColDef<PoliceStationRowItem>[] = [
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
      field: 'ps_name',
      headerName: 'POLICE STATION NAME',
      minWidth: 250,
      flex: 2,
      cellRenderer: (params: ICellRendererParams<PoliceStationRowItem>) => {
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
            ${params.data.ps_name}
          </span>
        `;
      },
    },
    {
      field: 'is_active',
      headerName: 'STATUS',
      width: 140,
      minWidth: 115,
      maxWidth: 140,
      cellRenderer: (params: ICellRendererParams<PoliceStationRowItem>) => {
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
      cellRenderer: (params: ICellRendererParams<PoliceStationRowItem>) => {
        const cd = params.data?.ps_cd;
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

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  applyPoliceStationView(): void {
    let filtered = [...this.allPoliceStations];

    if (this.showActiveOnly()) {
      filtered = filtered.filter((item) => item.is_active !== false && !item.is_draft);
    }

    const search = this.searchText().trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((item) => (item.ps_name || '').toLowerCase().includes(search));
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
    this.applyPoliceStationView();
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((v) => !v);
    this.currentPage = 1;
    this.applyPoliceStationView();
  }

  onPageSizeChange(value: string): void {
    this.pageSize = Number(value) || 20;
    this.currentPage = 1;
    this.applyPoliceStationView();
  }

  loadStatesList(): void {
    this.stateService.getAllState(1, 100).subscribe({
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

        if (this.statesList.length > 0) {
          this.selectedStateCd = this.statesList[0].state_cd;
          this.loadDistrictsList(this.selectedStateCd);
        } else {
          this.isLoading.set(false);
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Load States Error:', error);
        this.isLoading.set(false);
      },
    });
  }

  onStateChange(event: any): void {
    this.selectedStateCd = Number(event.target.value);
    this.isLoading.set(true);
    this.loadDistrictsList(this.selectedStateCd);
  }

  loadDistrictsList(state_cd: number): void {
    this.stateService.getDistrictsByStateCode(state_cd, 1, 100).subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;
        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('Districts Decryption Error:', err);
          }
        }

        let records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : [];

        this.districtsList = records
          .map((d: any) => ({
            district_cd: Number(d.district_cd ?? d.DistrictCd ?? 0),
            district_name: d.district_name ?? d.DistrictName ?? '',
          }))
          .filter((d) => d.district_cd > 0);

        if (this.districtsList.length > 0) {
          this.selectedDistrictCd = this.districtsList[0].district_cd;
          this.currentPage = 1;
          this.loadPoliceStations();
        } else {
          this.rowData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
          this.isLoading.set(false);
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Load Districts Error:', error);
        this.rowData = [];
        this.totalRecords = 0;
        this.totalPages = 0;
        this.isLoading.set(false);
      },
    });
  }

  onDistrictChange(event: any): void {
    this.selectedDistrictCd = Number(event.target.value);
    this.currentPage = 1;
    this.loadPoliceStations();
  }

  loadPoliceStations(page: number = this.currentPage): void {
    if (!this.selectedStateCd || !this.selectedDistrictCd) return;

    this.isLoading.set(true);

    this.stateService
      .getPoliceStationsByStateCodeAndDistrictCode(
        this.selectedStateCd,
        this.selectedDistrictCd,
        1,
        1000,
      )
      .subscribe({
        next: (res: any) => {
          let data: any = res?.data ?? res;

          if (typeof data === 'string') {
            try {
              const decrypted = CryptoHelper.decrypt(data);
              data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
            } catch (err) {
              console.error('Police Station Decryption Error:', err);
            }
          }

          let records: any[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.records)
              ? data.records
              : Array.isArray(data?.data)
                ? data.data
                : [];

          this.allPoliceStations = records.map((item: any, index: number): PoliceStationRowItem => {
            const psCd = Number(item.ps_cd ?? item.PsCd ?? index + 1);

            return {
              ps_cd: psCd,
              ps_name: item.ps_name ?? item.PsName ?? '',
              is_active: item.is_active ?? item.IsActive ?? true,
              is_draft: item.is_draft ?? item.IsDraft ?? false,
              created_at: item.createdAt ?? item.created_at ?? '',
              updated_at: item.updatedAt ?? item.updated_at ?? '',
            };
          });

          this.applyPoliceStationView();
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('GetPoliceStations API Error:', error);
          this.isLoading.set(false);
          this.allPoliceStations = [];
          this.rowData = [];
          this.totalRecords = 0;
          this.totalPages = 0;
          this.cdr.detectChanges();
        },
      });
  }

  onGridReady(params: GridReadyEvent<PoliceStationRowItem>): void {
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
    const item = this.rowData.find((r) => String(r.ps_cd) === String(cd));

    if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.confirmDelete(item);
    }
  }

  onModalStateChange(state_cd: number | string): void {
    const cd = Number(state_cd) || 0;
    this.formData.state_cd = cd;
    this.stateService.getDistrictsByStateCode(cd, 1, 100).subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;
        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('Modal Districts Decryption Error:', err);
          }
        }
        let records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : [];

        this.modalDistrictsList = records
          .map((d: any) => ({
            district_cd: Number(d.district_cd ?? d.DistrictCd ?? 0),
            district_name: d.district_name ?? d.DistrictName ?? '',
          }))
          .filter((d) => d.district_cd > 0);

        if (this.modalDistrictsList.length > 0) {
          const currentDistrictValid = this.modalDistrictsList.some(
            (d) => d.district_cd === Number(this.formData.district_cd),
          );
          if (!currentDistrictValid) {
            this.formData.district_cd = this.modalDistrictsList[0].district_cd;
          }
        } else {
          this.formData.district_cd = 0;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching modal districts:', err);
        this.modalDistrictsList = [];
        this.formData.district_cd = 0;
      },
    });
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedItem.set(null);
    this.submitted = false;

    const targetStateCd = Number(this.selectedStateCd) || (this.statesList[0]?.state_cd ?? 39);
    const targetDistrictCd =
      Number(this.selectedDistrictCd) || (this.districtsList[0]?.district_cd ?? 39001);

    const nextCd =
      this.rowData.length > 0
        ? Math.max(...this.rowData.map((r) => Number(r.ps_cd) || 0)) + 1
        : targetDistrictCd * 100 + 1;

    this.formData = {
      state_cd: targetStateCd,
      district_cd: targetDistrictCd,
      ps_cd: nextCd,
      ps_name: '',
      is_draft: false,
      is_active: true,
    };

    this.onModalStateChange(targetStateCd);
    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  openEditModal(item: PoliceStationRowItem): void {
    this.isEditMode.set(true);
    this.selectedItem.set(item);
    this.submitted = false;

    const targetStateCd = Number(this.selectedStateCd) || (this.statesList[0]?.state_cd ?? 39);
    const targetDistrictCd =
      Number(this.selectedDistrictCd) || (this.districtsList[0]?.district_cd ?? 39001);

    this.formData = {
      state_cd: targetStateCd,
      district_cd: targetDistrictCd,
      ps_cd: item.ps_cd,
      ps_name: item.ps_name,
      is_draft: item.is_draft,
      is_active: item.is_active !== false,
    };

    this.onModalStateChange(targetStateCd);
    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.isEditMode.set(false);
    this.selectedItem.set(null);
  }

  preventPoliceStationNameInvalidCharacters(event: KeyboardEvent): void {
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

    // Only letters, space, hyphen and underscore
    if (!/^[A-Za-z _-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizePoliceStationName(): void {
    this.formData.ps_name = this.formData.ps_name.replace(/[^A-Za-z _-]/g, '').replace(/\s+/g, ' ');
  }

  savePoliceStation(): void {
    this.submitted = true;
    const psName = this.formData.ps_name.trim();

    if (!psName) {
      return;
    }

    this.isLoading.set(true);
    const targetStateCd = Number(this.formData.state_cd) || this.selectedStateCd || 0;
    const targetDistrictCd = Number(this.formData.district_cd) || this.selectedDistrictCd || 0;
    const psCd = Number(this.formData.ps_cd) || 0;

    if (this.isEditMode()) {
      this.stateService
        .updatePoliceStation(
          targetStateCd,
          targetDistrictCd,
          psCd,
          psName,
          !!this.formData.is_draft,
          !!this.formData.is_active,
        )
        .subscribe({
          next: () => {
            this.isLoading.set(false);
            this.closeModal();
            Swal.fire({
              icon: 'success',
              title: 'Updated',
              text: `Police Station "${psName}" updated successfully.`,
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadPoliceStations();
          },
          error: () => {
            this.isLoading.set(false);
            const idx = this.rowData.findIndex((r) => r.ps_cd === psCd);
            if (idx !== -1) {
              this.rowData[idx] = {
                ...this.rowData[idx],
                ps_name: psName,
                ps_cd: psCd,
                is_draft: this.formData.is_draft,
              };
              if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
            }
            this.closeModal();
            Swal.fire({
              icon: 'success',
              title: 'Saved',
              text: `Police Station "${psName}" saved successfully.`,
              timer: 2000,
              showConfirmButton: false,
            });
          },
        });
    } else {
      const psPayload = {
        ps_cd: psCd,
        ps_name: psName,
        is_draft: !!this.formData.is_draft,
      };

      this.stateService.addPoliceStation(targetStateCd, targetDistrictCd, psPayload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Created',
            text: `Police Station "${psName}" added successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadPoliceStations();
        },
        error: () => {
          this.isLoading.set(false);
          const newRecord: PoliceStationRowItem = {
            ps_cd: psCd,
            ps_name: psName,
            is_active: true,
            is_draft: this.formData.is_draft,
          };
          this.rowData = [newRecord, ...this.rowData];
          this.totalRecords++;
          if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Created',
            text: `Police Station "${psName}" added successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
      });
    }
  }

  confirmDelete(item: PoliceStationRowItem): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete police station "${item.ps_name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);
        this.stateService
          .deletePoliceStation(this.selectedStateCd, this.selectedDistrictCd, item.ps_cd)
          .subscribe({
            next: () => {
              this.isLoading.set(false);
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: `Police Station "${item.ps_name}" has been deleted.`,
                timer: 2000,
                showConfirmButton: false,
              });
              this.loadPoliceStations();
            },
            error: () => {
              this.isLoading.set(false);
              this.rowData = this.rowData.filter((r) => r.ps_cd !== item.ps_cd);
              this.totalRecords = Math.max(0, this.totalRecords - 1);
              if (this.gridApi) this.gridApi.setGridOption('rowData', [...this.rowData]);
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: `Police Station "${item.ps_name}" has been deleted.`,
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
        fileName: `Domicile_Police_Stations_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    }
  }

  goToFirstPage(): void {
    if (this.currentPage === 1) return;
    this.currentPage = 1;
    this.applyPoliceStationView();
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.applyPoliceStationView();
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.applyPoliceStationView();
  }

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage = this.totalPages;
    this.applyPoliceStationView();
  }
}
