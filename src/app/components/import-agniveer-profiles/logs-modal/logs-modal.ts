import { Component, EventEmitter, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import { ImportBatchItem, ImportLogItem } from '../import-agniveer-profiles';

@Component({
  selector: 'app-logs-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs-modal.html',
  styleUrl: './logs-modal.css',
})
export class LogsModalComponent {
  @Input() isOpen = false;
  @Input() batch: ImportBatchItem | null = null;
  @Output() close = new EventEmitter<void>();

  readonly logSearchText = signal<string>('');
  readonly logStatusFilter = signal<'ALL' | 'INSERTED' | 'UPDATED' | 'FAILED' | 'SKIPPED' | 'DUPLICATE' | string>('ALL');

  readonly filteredLogs = computed(() => {
    const b = this.batch;
    if (!b || !b.logs) return [];

    const search = this.logSearchText().toLowerCase().trim();
    const filter = this.logStatusFilter();

    return b.logs.filter((log) => {
      const matchesSearch =
        !search ||
        log.serviceId.toLowerCase().includes(search) ||
        log.candidateName.toLowerCase().includes(search) ||
        log.message.toLowerCase().includes(search) ||
        (log.affectedField && log.affectedField.toLowerCase().includes(search));

      const matchesFilter = filter === 'ALL' || log.status === filter;

      return matchesSearch && matchesFilter;
    });
  });

  onClose(): void {
    this.logSearchText.set('');
    this.logStatusFilter.set('ALL');
    this.close.emit();
  }

  exportBatchLogs(): void {
    const b = this.batch;
    if (!b || !b.logs || b.logs.length === 0) {
      Swal.fire('No Logs', 'No log items available to export for this batch.', 'info');
      return;
    }

    const logData = b.logs.map((l, i) => ({
      'Log ID': i + 1,
      'Service ID': l.serviceId,
      'Candidate Name': l.candidateName,
      Branch: l.branch,
      Status: l.status,
      'Audit Message': l.message,
      'Affected Field': l.affectedField || '—',
      Timestamp: l.timestamp,
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(logData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Audit Logs': worksheet },
      SheetNames: ['Audit Logs'],
    };

    XLSX.writeFile(workbook, `Agniveer_Logs_${b.fileName.replace(/\s+/g, '_')}.xlsx`);
  }
}
