import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard/dashboard';
import { AuthService } from '../../services/auth';
import { ScheduleItem, ScheduleService } from '../../services/schedule/schedule';
import { JobNotificationService } from '../../services/notification/notification';
import { CryptoHelper } from '../../helpers/crypto-helper';

export interface OpeningNotification {
  srNo: number;
  advtNo: string;
  organisationName: string;
  title?: string;
  id?: string;
  round?: string | number | null;
  raw?: any;
}

export interface DashboardStats {
  entityCount: number;
  subEntityCount: number;
  agniveerCount: number;
  rehabCount: number;
  toBeRehabCount: number;
  userCount: number;
  openingCount: number;
  currentOpeningCount: number;
  archivedOpeningCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly jobNotificationService = inject(JobNotificationService);
  private readonly authService = inject(AuthService);

  readonly activeTab = signal<'openings' | 'archives' | 'gazette'>('openings');
  readonly activeScheduleData = signal<ScheduleItem | null>(null);

  readonly currentOpenings = signal<OpeningNotification[]>([]);
  readonly archivedOpenings = signal<OpeningNotification[]>([]);
  readonly gazetteNotifications = signal<OpeningNotification[]>([]);

  readonly notifications = computed(() => {
    const tab = this.activeTab();
    if (tab === 'openings') {
      return this.currentOpenings();
    } else if (tab === 'archives') {
      return this.archivedOpenings();
    } else {
      return this.gazetteNotifications();
    }
  });

  readonly stats = signal<DashboardStats>({
    entityCount: 0,
    subEntityCount: 0,
    agniveerCount: 0,
    rehabCount: 0,
    toBeRehabCount: 0,
    userCount: 0,
    openingCount: 0,
    currentOpeningCount: 0,
    archivedOpeningCount: 0,
  });

  readonly isAgniveerUser = computed(() => {
    // Make this computed reactive when role changes
    this.authService.authVersion();

    const roleId = this.authService.getRoleId();

    return Number(roleId) === 11;
  });

  ngOnInit(): void {
    // 1. Fetch Dashboard Stats Count
    this.fetchDashboardCounts();

    // 2. Fetch Schedule first, then Job Notifications
    this.loadScheduleAndNotifications();
  }

  fetchDashboardCounts(): void {
    this.dashboardService.getDashboardData().subscribe({
      next: (res: any) => {
        // console.log('Dashboard Count API Response:', res);
        if (res && res.code === 1 && res.data) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            let data = typeof dec === 'string' ? JSON.parse(dec) : dec;
            if (typeof data === 'string') {
              data = JSON.parse(data);
            }
            // console.log('Dashboard Count API Decrypted Response:', data);

            const raw = Array.isArray(data)
              ? data[0]
              : data?.Table && Array.isArray(data.Table)
                ? data.Table[0]
                : (data?.data ?? data);

            if (raw && typeof raw === 'object') {
              const allAgniveers = Number(
                raw.all_agniveers_count ??
                  raw.AllAgniveersCount ??
                  raw.allAgniveersCount ??
                  raw.total_agniveers_count ??
                  raw.total_agniveers ??
                  this.stats().agniveerCount,
              );

              const rehab = Number(
                raw.rehabilitated_agniveers_count ??
                  raw.RehabilitatedAgniveersCount ??
                  raw.rehabilitatedAgniveersCount ??
                  raw.rehab_count ??
                  this.stats().rehabCount,
              );

              const orgTypeCount = Number(
                raw.organisation_type_count ??
                  raw.OrganisationTypeCount ??
                  raw.organisationTypeCount ??
                  raw.sub_entity_count ??
                  this.stats().subEntityCount,
              );

              const orgCount = Number(
                raw.organisation_count ??
                  raw.OrganisationCount ??
                  raw.organisationCount ??
                  raw.entity_count ??
                  this.stats().entityCount,
              );

              const jobNotifCount = Number(
                raw.job_notification_count ??
                  raw.JobNotificationCount ??
                  raw.jobNotificationCount ??
                  raw.opening_count ??
                  this.stats().openingCount,
              );

              const toBeRehab = allAgniveers - rehab;

              this.stats.update((s) => ({
                ...s,
                agniveerCount: allAgniveers,
                rehabCount: rehab,
                toBeRehabCount: toBeRehab >= 0 ? toBeRehab : 0,
                subEntityCount: orgTypeCount,
                entityCount: orgCount,
                openingCount: jobNotifCount,
                currentOpeningCount: jobNotifCount,
              }));
            }
          } catch (e) {
            console.error('Error decrypting dashboard count data:', e);
          }
        }
      },
      error: (err: any) => {
        console.error('Dashboard Count API Error:', err);
      },
    });
  }

  openAgniveerTable(filter: 'all' | 'rehabilitated' | 'toBeRehab'): void {
    this.router.navigate(['/dashboard/agniveers'], {
      queryParams: { filter },
    });
  }

  openOrganizationTypeTable(filter: 'types' | 'organisations' | 'openings'): void {
    this.router.navigate(['/dashboard/organization-types'], {
      queryParams: { filter },
    });
  }

  /**
   * First calls Schedule API to obtain active schedule and round,
   * and subsequently calls Job Notifications API.
   */
  loadScheduleAndNotifications(): void {
    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    // 1. Call Schedule API first
    this.scheduleService.getActiveSchedule(encryptedPayload).subscribe({
      next: (scheduleRes: any) => {
        let activeSchedule: any = null;
        if (scheduleRes?.code === 1 && scheduleRes?.data) {
          try {
            const scheduleData = JSON.parse(CryptoHelper.decrypt(scheduleRes.data));
            const schedule = scheduleData?.Schedule ?? scheduleData?.schedule ?? scheduleData;
            if (schedule && typeof schedule === 'object' && Object.keys(schedule).length > 0) {
              activeSchedule = Array.isArray(schedule) ? schedule[0] : schedule;
              this.activeScheduleData.set(activeSchedule);
              // console.log('[DashboardComponent] Active Schedule Loaded:', activeSchedule);
            }
          } catch (e) {
            console.error('[DashboardComponent] Error decrypting schedule:', e);
          }
        }

        // 2. Then call Job Notification List API
        this.loadJobNotifications(activeSchedule);
      },
      error: (err: any) => {
        console.error('[DashboardComponent] Error fetching schedule:', err);
        // Call Job Notifications API even if schedule fails
        this.loadJobNotifications(null);
      },
    });
  }

  loadJobNotifications(activeSchedule: any): void {
    const payload = {
      page_number: 1,
      record_per_page: 50,
    };
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const bodyToSend = JSON.stringify(encrypted);

    this.jobNotificationService.getJobNotificationList(bodyToSend).subscribe({
      next: (res: any) => {
        // console.log('[DashboardComponent] job_notification_list Raw Response:', res);

        let data: any = null;
        const cipher = typeof res === 'string' ? res : res?.data;
        if (cipher && typeof cipher === 'string') {
          try {
            const decryptedString = CryptoHelper.decrypt(cipher);
            try {
              data = JSON.parse(decryptedString);
            } catch {
              data = decryptedString;
            }
            // console.log('[DashboardComponent] job_notification_list Decrypted Data:', data);
          } catch (e) {
            console.error('[DashboardComponent] Failed to decrypt notification data:', e);
          }
        } else if (res && typeof res === 'object') {
          data = res.decryptedData ?? res.data ?? res;
        }

        if (data) {
          const list = Array.isArray(data)
            ? data
            : data?.list ||
              data?.records ||
              data?.JobNotifications ||
              data?.job_notifications ||
              data?.JobNotificationList ||
              data?.data;

          if (Array.isArray(list)) {
            this.partitionNotifications(list, activeSchedule);
          }
        }
      },
      error: (err: any) => {
        console.error('[DashboardComponent] Error fetching job notifications:', err);
      },
    });
  }

  private isItemPublished(item: any): boolean {
    const val =
      item.is_publish ??
      item.is_published ??
      item.isPublish ??
      item.isPublished ??
      item.is_notification_published ??
      item.is_job_notification_published;

    return val === true || val === 1 || val === '1' || val === 'true' || val === 'True';
  }

  private partitionNotifications(list: any[], activeSchedule: any): void {
    const activeRound =
      activeSchedule?.Round !== undefined && activeSchedule?.Round !== null
        ? activeSchedule.Round
        : activeSchedule?.round;

    // console.log('[DashboardComponent] Active Schedule Round:', activeRound);

    const currentList: OpeningNotification[] = [];
    const archivedList: OpeningNotification[] = [];

    // Filter only items where is_publish is true
    const publishedItems = list.filter((item: any) => this.isItemPublished(item));
    // console.log(
    //   `[DashboardComponent] Filtered ${publishedItems.length} published items from total ${list.length} notifications`,
    // );

    publishedItems.forEach((item: any) => {
      const itemRound = item.round ?? item.Round;
      const isCurrent =
        activeRound !== null &&
        activeRound !== undefined &&
        itemRound !== null &&
        itemRound !== undefined &&
        String(activeRound).trim().toLowerCase() === String(itemRound).trim().toLowerCase();

      const mappedItem: OpeningNotification = {
        srNo: 0,
        id: item.id || item.job_notification_id || item.autoid || item.schedule_autoid,
        advtNo: item.advertisement_number || item.advt_no || item.AdvtNo || item.advtNo || 'N/A',
        organisationName: item.organisation_name || item.organization || item.OrganisationName,
        title: item.title || item.notification_title || item.job_title || item.JobTitle,
        round: itemRound,
        raw: item,
      };

      if (isCurrent) {
        currentList.push(mappedItem);
      } else {
        archivedList.push(mappedItem);
      }
    });

    const currentMapped = currentList.map((item, idx) => ({ ...item, srNo: idx + 1 }));
    const archivedMapped = archivedList.map((item, idx) => ({ ...item, srNo: idx + 1 }));

    // console.log(
    //   `[DashboardComponent] Partition Complete: ${currentMapped.length} Current Openings, ${archivedMapped.length} Archives`,
    // );

    this.currentOpenings.set(currentMapped);
    this.archivedOpenings.set(archivedMapped);

    this.stats.update((s) => ({
      ...s,
      currentOpeningCount: currentMapped.length,
      archivedOpeningCount: archivedMapped.length,
    }));
  }

  setActiveTab(tab: 'openings' | 'archives' | 'gazette'): void {
    this.activeTab.set(tab);
  }
}
