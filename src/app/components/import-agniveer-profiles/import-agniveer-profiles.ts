import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import * as XLSX from 'xlsx';

import { Router } from '@angular/router';
import { ImportService } from '../../services/import/import';
import { AuthService } from '../../services/auth';
import { HistoryRecord } from '../../services/interfaces/import.model';
import { ImportProfileModalComponent, UploadCompletionData } from './import-modal/import-modal';
import { LogsModalComponent } from './logs-modal/logs-modal';
import { MeritModalComponent } from './merit-modal/merit-modal';
import { CryptoHelper } from '../../helpers/crypto-helper';

// Register AG Grid Community modules
ModuleRegistry.registerModules([AllCommunityModule]);

export interface ImportLogItem {
  serviceId: string;
  candidateName: string;
  branch: string;
  category?: string;
  status: 'INSERTED' | 'UPDATED' | 'FAILED' | 'SKIPPED' | 'DUPLICATE' | string;
  message: string;
  affectedField?: string;
  timestamp: string;
}

export interface ImportBatchItem {
  id: number | string;
  dateTime: string;
  rawDate?: string;
  fileName: string;
  fileSize: string;
  recordCount: number;
  profileName: string;
  branch: string;
  pass: number;
  fail: number;
  skip: number;
  status: 'Success' | 'Partial' | 'Failed';
  logs: ImportLogItem[];
}

@Component({
  selector: 'app-import-agniveer-profiles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    ImportProfileModalComponent,
    LogsModalComponent,
    MeritModalComponent,
  ],
  templateUrl: './import-agniveer-profiles.html',
  styleUrl: './import-agniveer-profiles.css',
})
export class ImportAgniveerProfiles implements OnInit {
  private readonly router = inject(Router);
  private readonly importService: ImportService = inject(ImportService);
  private readonly authService = inject(AuthService);

  private gridApi!: GridApi<any>;

  // =====================================================
  // SIGNALS & STATE (Dynamic, loaded from backend)
  // =====================================================
  readonly searchText = signal<string>('');
  readonly Math = Math;

  readonly activeStatusFilter = signal<'ALL' | 'SUCCESS' | 'PARTIAL' | 'FAILED'>('ALL');
  readonly isLoading = signal<boolean>(false);

  // Pagination state (Matching role-management & schedule-management)
  currentPage = 1;
  pageSize = 10;
  totalRecords = 0;
  totalPages = 1;

  // Modals state
  readonly isUploadModalOpen = signal<boolean>(false);
  readonly isMeritModalOpen = signal<boolean>(false);
  readonly isLogsModalOpen = signal<boolean>(false);
  readonly selectedBatch = signal<any | null>(null);

  // Dynamic Ingestion Dataset
  allBatches: any[] = [];
  filteredBatches: any[] = [];
  paginatedBatches: any[] = [];

  // =====================================================
  // SUMMARY KPI COMPUTEDS
  // =====================================================
  readonly totalUploads = computed(() => this.allBatches.length);
  readonly totalPassRecords = computed(() =>
    this.allBatches.reduce((acc, curr) => acc + (curr.ValidCount || 0), 0),
  );
  readonly totalFailRecords = computed(() =>
    this.allBatches.reduce((acc, curr) => acc + (curr.InvalidCount || 0), 0),
  );
  readonly successRate = computed(() => {
    const pass = this.totalPassRecords();
    const total = pass + this.totalFailRecords();
    return total > 0 ? Math.round((pass / total) * 100) : 0;
  });

  // =====================================================
  // AG GRID COLUMN DEFINITIONS (Matching role-management & schedule-management)
  // =====================================================
  colDefs: ColDef[] = [
    // 1. SR NO
    {
      headerName: 'SR. NO.',
      valueGetter: (params) => {
        return params.node ? (params.node.rowIndex ?? 0) + 1 : '';
      },
      width: 80,
      minWidth: 70,
      maxWidth: 90,
      sortable: false,
      filter: false,
      resizable: false,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: "'Poppins', sans-serif",
        color: '#333',
      },
    },

    // 2. DATE / TIME
    {
      field: 'CreatedAt',
      headerName: 'DATE / TIME',
      minWidth: 170,
      flex: 1.1,
      filter: 'agTextColumnFilter',
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) return '—';
        const formatted = new Date(params.value).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `
          <div class="flex items-center gap-2" style="font-family:'Poppins',sans-serif;">
            <span class="text-xs font-semibold text-slate-700 tracking-tight">${formatted}</span>
          </div>
        `;
      },
    },

    // 3. FILE
    {
      field: 'Attachment',
      headerName: 'FILE',
      minWidth: 240,
      flex: 1.5,
      filter: 'agTextColumnFilter',
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.data) return '';
        const data = params.data;
        const fileName = data.Attachment ? data.Attachment.split('/').pop() : 'Attachment';
        return `
          <div class="flex flex-col justify-center py-0.5" style="font-family:'Poppins',sans-serif;line-height:1.25;">
            <div class="flex items-center gap-1.5 font-bold text-[#1C4587] hover:underline cursor-pointer text-xs">
              <svg class="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span class="truncate" title="${fileName}">${fileName}</span>
            </div>
            <div class="text-[11px] text-slate-400 font-medium mt-0.5">
              <span>${data.TotalCount ?? 0} records</span>
              <span class="mx-1 text-slate-300">|</span>
              <span>${data.AttachmentType || '—'}</span>
            </div>
          </div>
        `;
      },
    },

    // 4. PROFILE
    {
      field: 'EmailId',
      headerName: 'PROFILE',
      minWidth: 220,
      flex: 1.3,
      filter: 'agTextColumnFilter',
      cellRenderer: (params: ICellRendererParams) => {
        const val = params.data?.EmailId || params.data?.AgniveerForceType || '—';
        const initials =
          val
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'AD';
        return `
          <div class="flex items-center gap-2" style="font-family:'Poppins',sans-serif;">
            <div class="w-6 h-6 rounded-full bg-blue-100 text-[#1C4587] flex items-center justify-center font-bold text-[10px] shrink-0">
              ${initials}
            </div>
            <span class="text-xs font-semibold text-slate-700 truncate" title="${val}">
              ${val}
            </span>
          </div>
        `;
      },
    },

    // 5. TOTAL COUNT
    {
      field: 'TotalCount',
      headerName: 'TOTAL COUNT',
      width: 120,
      minWidth: 100,
      maxWidth: 130,
      filter: 'agNumberColumnFilter',
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
      },
      cellRenderer: (params: ICellRendererParams) => {
        const val = params.value ?? params.data?.TotalCount ?? 0;
        return `
          <span class="font-bold text-xs text-slate-700" style="font-family:'Poppins',sans-serif;">
            ${val}
          </span>
        `;
      },
    },

    // 6. PASS
    {
      field: 'ValidCount',
      headerName: 'PASS',
      width: 95,
      minWidth: 85,
      maxWidth: 110,
      filter: 'agNumberColumnFilter',
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
      },
      cellRenderer: (params: any) => {
        const val = params.data?.InsertedCount ?? 0;
        return `
          <span class="font-bold text-xs text-emerald-600" style="font-family:'Poppins',sans-serif;">
            ${val}
          </span>
        `;
      },
    },

    // 7. FAIL
    {
      field: 'InvalidCount',
      headerName: 'FAIL',
      width: 95,
      minWidth: 85,
      maxWidth: 110,
      filter: 'agNumberColumnFilter',
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
      },
      cellRenderer: (params: any) => {
        const val = params?.data?.InvalidCount ?? 0;
        return `
          <span class="font-bold text-xs ${val > 0 ? 'text-rose-600' : 'text-slate-400'}" style="font-family:'Poppins',sans-serif;">
            ${val}
          </span>
        `;
      },
    },

    // 8. SKIP
    {
      field: 'DuplicateCount',
      headerName: 'SKIP',
      width: 95,
      minWidth: 85,
      maxWidth: 110,
      filter: 'agNumberColumnFilter',
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', sans-serif",
      },
      cellRenderer: (params: any) => {
        const val = params?.data?.DuplicateCount ?? 0;
        return `
          <span class="font-bold text-xs ${val > 0 ? 'text-amber-600' : 'text-slate-400'}" style="font-family:'Poppins',sans-serif;">
            ${val}
          </span>
        `;
      },
    },

    // 9. STATUS
    {
      field: 'Process',
      headerName: 'STATUS',
      width: 140,
      minWidth: 130,
      maxWidth: 160,
      filter: 'agTextColumnFilter',
      cellRenderer: (params: ICellRendererParams) => {
        const fail = params.data?.InvalidCount ?? 0;
        const pass = params.data?.ValidCount ?? 0;
        let status = 'Success';
        let statusClass = 'active';

        if (fail > 0 && pass > 0) {
          status = 'Partial';
          statusClass = 'partial';
        } else if (fail > 0 && pass === 0) {
          status = 'Failed';
          statusClass = 'inactive';
        }

        return `
          <div class="status-cell" style="font-family:'Poppins',sans-serif;">
            <span class="user-status-pill ${statusClass}">
              <span class="status-dot"></span>
              <span>${status}</span>
            </span>
          </div>
        `;
      },
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 90,
  };

  rowHeight = 42;
  headerHeight = 30;

  // =====================================================
  // LIFECYCLE
  // =====================================================
  ngOnInit(): void {
    this.loadBackendHistory();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.applyFilters();
  }

  // =====================================================
  // BACKEND INTEGRATION (Live API: /AgniveerUpload/GetAllAttachment)
  // =====================================================
  loadBackendHistory(): void {
    this.isLoading.set(true);
    this.importService.getAllAttachments().subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res.code === 1) {
          const resData = CryptoHelper.decrypt(res.data);
          // console.log(JSON.parse(resData), 'resdata');

          this.allBatches = JSON.parse(resData) || [];
          this.applyFilters();
        } else {
          this.allBatches = [];
          this.applyFilters();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.allBatches = [];
        this.applyFilters();
      },
    });
  }

  // =====================================================
  // FILTERING & SEARCH
  // =====================================================
  onSearchChange(text: string): void {
    this.searchText.set(text);
    if (this.gridApi) {
      this.gridApi.setGridOption('quickFilterText', text);
    }
  }

  setStatusFilter(filter: 'ALL' | 'SUCCESS' | 'PARTIAL' | 'FAILED'): void {
    this.activeStatusFilter.set(filter);
    this.applyFilters();
  }

  onPageSizeChange(newSize: any): void {
    const value =
      typeof newSize === 'object' && newSize?.target
        ? Number(newSize.target.value)
        : Number(newSize);
    this.pageSize = value || 10;
    this.currentPage = 1;
    this.applyPagination();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyPagination();
  }

  private applyPagination(): void {
    this.totalRecords = this.filteredBatches.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedBatches = this.filteredBatches.slice(startIndex, endIndex);

    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.paginatedBatches);
      this.gridApi.sizeColumnsToFit();
    }
  }

  private applyFilters(): void {
    const filter = this.activeStatusFilter();
    let result = [...this.allBatches];

    if (filter === 'SUCCESS') {
      result = result.filter((b) => (b.InvalidCount ?? 0) === 0);
    } else if (filter === 'PARTIAL') {
      result = result.filter((b) => (b.InvalidCount ?? 0) > 0 && (b.ValidCount ?? 0) > 0);
    } else if (filter === 'FAILED') {
      result = result.filter((b) => (b.InvalidCount ?? 0) > 0 && (b.ValidCount ?? 0) === 0);
    }

    const search = this.searchText()?.trim()?.toLowerCase();
    if (search) {
      result = result.filter((b) => {
        const file = (b.Attachment || '').toLowerCase();
        const profile = (b.EmailId || b.AgniveerForceType || '').toLowerCase();
        return file.includes(search) || profile.includes(search);
      });
    }

    this.filteredBatches = result;
    this.currentPage = 1;
    this.applyPagination();
  }

  // =====================================================
  // GRID CELL ACTIONS
  // =====================================================
  onCellClicked(event: any): void {
    const target = event.event?.target as HTMLElement;
    const button = target?.closest('.view-log-btn');

    if (button) {
      const id = button.getAttribute('data-id');
      const batch = this.allBatches.find((b) => String(b.Id || b.AttachmentAutoId) === String(id));
      if (batch) {
        this.openLogsModal(batch);
      }
    }
  }

  openLogsModal(batch: any): void {
    this.selectedBatch.set(batch);
    this.isLogsModalOpen.set(true);
  }

  closeLogsModal(): void {
    this.isLogsModalOpen.set(false);
    this.selectedBatch.set(null);
  }

  // =====================================================
  // UPLOAD WIZARD MODAL HANDLERS
  // =====================================================
  openUploadModal(): void {
    this.isUploadModalOpen.set(true);
  }

  closeUploadModal(): void {
    this.isUploadModalOpen.set(false);
  }

  onUploadSuccess(data: UploadCompletionData): void {
    // Reload live dataset from backend API
    this.loadBackendHistory();
  }

  // =====================================================
  // MERIT LIST MODAL HANDLERS
  // =====================================================
  openMeritModal(): void {
    this.isMeritModalOpen.set(true);
  }

  closeMeritModal(): void {
    this.isMeritModalOpen.set(false);
  }

  onMeritUploadSuccess(data: any): void {
    this.loadBackendHistory();
  }

  // =====================================================
  // SAMPLE TEMPLATE DOWNLOAD
  // =====================================================
  //   downloadSampleXml(): void {
  //     const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
  // <AgniveerBatch xmlns="http://agniveer.gov.in/schema/v1" branch="ARMY" version="1.0">
  //   <Header>
  //     <BatchId>BATCH-ARMY-2026-001</BatchId>
  //     <GeneratedDate>2026-08-30T10:00:00Z</GeneratedDate>
  //     <OfficerCode>AD-OFFICER-01</OfficerCode>
  //     <TotalRecords>2</TotalRecords>
  //   </Header>
  //   <Records>
  //     <AgniveerProfile>
  //       <ServiceId>AGN-AR-2026-10001</ServiceId>
  //       <FullName>Rajesh Singh</FullName>
  //       <Gender>Male</Gender>
  //       <DateOfBirth>2002-05-14</DateOfBirth>
  //       <AadhaarRef>XXXX-XXXX-9876</AadhaarRef>
  //       <Branch>ARMY</Branch>
  //       <TradeCategory>General Duty (GD)</TradeCategory>
  //       <EnrollmentDate>2022-09-01</EnrollmentDate>
  //       <DischargeDate>2026-08-31</DischargeDate>
  //       <CharacterRating>Exemplary</CharacterRating>
  //       <DomicileState>Punjab</DomicileState>
  //       <DomicileDistrict>Amritsar</DomicileDistrict>
  //     </AgniveerProfile>
  //     <AgniveerProfile>
  //       <ServiceId>AGN-AR-2026-10002</ServiceId>
  //       <FullName>Amit Patel</FullName>
  //       <Gender>Male</Gender>
  //       <DateOfBirth>2003-02-19</DateOfBirth>
  //       <AadhaarRef>XXXX-XXXX-4321</AadhaarRef>
  //       <Branch>ARMY</Branch>
  //       <TradeCategory>Technical (Tech)</TradeCategory>
  //       <EnrollmentDate>2022-09-01</EnrollmentDate>
  //       <DischargeDate>2026-08-31</DischargeDate>
  //       <CharacterRating>Very Good</CharacterRating>
  //       <DomicileState>Gujarat</DomicileState>
  //       <DomicileDistrict>Ahmedabad</DomicileDistrict>
  //     </AgniveerProfile>
  //   </Records>
  // </AgniveerBatch>`;

  //     const blob = new Blob([sampleXml], { type: 'text/xml' });
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = 'Agniveer_Import_Template.xml';
  //     a.click();
  //     window.URL.revokeObjectURL(url);

  //     Swal.fire({
  //       icon: 'success',
  //       title: 'Template Downloaded',
  //       text: 'Sample Agniveer XML schema template has been downloaded.',
  //       timer: 1600,
  //       showConfirmButton: false,
  //     });
  //   }

  // =====================================================
  // EXPORT TO EXCEL
  // =====================================================
  // exportToExcel(): void {
  //   if (this.filteredBatches.length === 0) {
  //     Swal.fire('No Data', 'There is no import history data to export.', 'info');
  //     return;
  //   }

  //   const exportData = this.filteredBatches.map((b, i) => ({
  //     'Sr No': i + 1,
  //     'Date / Time': b.CreatedAt || '—',
  //     'File Name': b.Attachment ? b.Attachment.split('/').pop() : '—',
  //     'File Size': b.AttachmentType || '—',
  //     'Total Records': b.TotalCount || 0,
  //     'Uploaded By': b.EmailId || b.AgniveerForceType || '—',
  //     Branch: b.AgniveerForceType || '—',
  //     'Pass Records': b.ValidCount || 0,
  //     'Fail Records': b.InvalidCount || 0,
  //     'Skip Records': b.DuplicateCount || 0,
  //     Status:
  //       (b.InvalidCount ?? 0) > 0 ? ((b.ValidCount ?? 0) > 0 ? 'Partial' : 'Failed') : 'Success',
  //   }));

  //   const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  //   const workbook: XLSX.WorkBook = {
  //     Sheets: { 'Import History': worksheet },
  //     SheetNames: ['Import History'],
  //   };

  //   XLSX.writeFile(
  //     workbook,
  //     `Agniveer_Import_History_${new Date().toISOString().slice(0, 10)}.xlsx`,
  //   );

  //   Swal.fire({
  //     icon: 'success',
  //     title: 'Exported Successfully',
  //     text: 'Import history data has been exported to Excel.',
  //     timer: 1800,
  //     showConfirmButton: false,
  //   });
  // }
}
