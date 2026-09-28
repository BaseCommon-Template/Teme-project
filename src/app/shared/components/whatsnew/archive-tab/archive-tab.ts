import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationFromAPI } from '../../../../core/models/notification.model';
import { Entity } from '../../../../core/models/entity.model';

@Component({
  selector: 'app-archive-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archive-tab.html',
  styleUrl: './archive-tab.css',
})
export class ArchiveTabComponent {
  @Input() notifications: NotificationFromAPI[] = [];
  @Input() entities: Entity[] = [];
  @Input() loading = false;

  @Output() onSelect = new EventEmitter<string>();

  readonly showAll = signal<boolean>(false);

  archivedNotifications(): NotificationFromAPI[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.notifications.filter((n) => {
      if (!n.application_closing_date) return false;
      const closing = new Date(n.application_closing_date);
      closing.setHours(23, 59, 59, 999);
      return closing < today;
    });
  }

  displayedNotifications(): NotificationFromAPI[] {
    const archived = this.archivedNotifications();
    return this.showAll() ? archived : archived.slice(0, 5);
  }

  getEntityName(entityId: any): string {
    if (!entityId) return '—';
    const id = typeof entityId === 'string' ? entityId : entityId?._id;
    return this.entities.find((e) => e._id === id)?.entity_name || '—';
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

export { ArchiveTabComponent as ArchiveTab };
