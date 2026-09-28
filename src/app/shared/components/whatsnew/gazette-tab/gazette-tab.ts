import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GazetteItem } from '../../../../core/models/gazette.model';

@Component({
  selector: 'app-gazette-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gazette-tab.html',
  styleUrl: './gazette-tab.css',
})
export class GazetteTabComponent {
  @Input() gazetteItems: GazetteItem[] = [];

  readonly showAll = signal<boolean>(false);

  displayedItems(): GazetteItem[] {
    return this.showAll() ? this.gazetteItems : this.gazetteItems.slice(0, 5);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}

export { GazetteTabComponent as GazetteTab };
