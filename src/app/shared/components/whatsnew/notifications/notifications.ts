import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationFromAPI } from '../../../../core/models/notification.model';
import { Entity } from '../../../../core/models/entity.model';
import { JobApplicationService } from '../../../../core/services/job-application';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-notification-tab, app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class NotificationTabComponent implements OnInit {
  @Input() notifications: NotificationFromAPI[] = [];
  @Input() entities: Entity[] = [];
  @Input() loading = false;
  @Input() isActionVisible = true;

  @Output() onSelect = new EventEmitter<string>();

  private readonly jobAppService = inject(JobApplicationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly showAll = signal<boolean>(false);
  readonly appliedNotificationIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    if (this.isAgniveer()) {
      this.jobAppService.getMyJobApplications().subscribe({
        next: (res) => {
          const ids = new Set<string>();
          res.applications?.forEach((app) => {
            const notifId = typeof app.notification_id === 'string' ? app.notification_id : app.notification_id?._id;
            if (notifId) ids.add(notifId);
          });
          this.appliedNotificationIds.set(ids);
        },
      });
    }
  }

  isAgniveer(): boolean {
    if (typeof window === 'undefined') return false;
    const role = sessionStorage.getItem('role_name') || '';
    return role.toLowerCase().includes('agniveer');
  }

  activeNotifications(): NotificationFromAPI[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.notifications.filter((n) => {
      if (!n.application_closing_date) return true;
      const closing = new Date(n.application_closing_date);
      closing.setHours(23, 59, 59, 999);
      return closing >= today;
    });
  }

  displayedNotifications(): NotificationFromAPI[] {
    const active = this.activeNotifications();
    return this.showAll() ? active : active.slice(0, 5);
  }

  getEntityName(entityId: any): string {
    if (!entityId) return 'MHA';
    const id = typeof entityId === 'string' ? entityId : entityId?._id;
    return this.entities.find((e) => e._id === id)?.entity_name || 'Ministry of Home Affairs';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  applyJob(notificationId: string): void {
    this.router.navigate([`/dashboard/notifications/apply-job/${notificationId}`]);
  }
}

export { NotificationTabComponent as Notifications };
