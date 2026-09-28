import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImportService } from '../../../services/import/import';
import { HistoryRecord } from '../../../services/interfaces/import.model';

@Component({
  selector: 'app-import-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './import-history.html',
  styleUrl: './import-history.css',
})
export class ImportHistoryComponent implements OnInit {
  private readonly importService: ImportService = inject(ImportService);

  readonly history = signal<HistoryRecord[]>([]);
  readonly loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.importService.getImportHistory().subscribe({
      next: (res: HistoryRecord[]) => {
        this.history.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  countFailed(item: HistoryRecord): number {
    if (typeof item.failed === 'number') return item.failed;
    if (Array.isArray(item.failed)) return item.failed.length;
    return item.skipped || 0;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
