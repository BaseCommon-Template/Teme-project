import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard/dashboard';
import { AuthService } from '../../services/auth';
import { ScheduleItem, ScheduleService } from '../../services/schedule/schedule';
import { JobNotificationService } from '../../services/notification/notification';
import { CryptoHelper } from '../../helpers/crypto-helper';
import { environment } from '../../../environments/environment';

export interface OpeningNotification {
  srNo: number;
  advtNo: string;
  organisationName: string;
  title?: string;
  id?: string;
  isVacancyAdded?: boolean;
  isVacancyFreezed?: boolean;
  round?: string | number | null;
  documentPath?: string;
  raw?: any;
}

export interface DashboardStats {
  entityCount: number;
  subEntityCount: number;
  agniveerCount: number;
  hitCount: number;
  agniveerSessionCount: number;
  departmentCount: number;
  rehabCount: number;
  toBeRehabCount: number;
  userCount: number;
  openingCount: number;
  currentOpeningCount: number;
  archivedOpeningCount: number;
  agniveerPartBCountFill: number;
  agniveerPartBCountNotFill: number;
  agniveerPartCCountFill: number;
  agniveerPreferenceDraftCount: number;
  agniveerPartCCountNotFill: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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
    hitCount: 0,
    agniveerSessionCount: 0,
    departmentCount: 0,
    rehabCount: 0,
    toBeRehabCount: 0,
    userCount: 0,
    openingCount: 0,
    currentOpeningCount: 0,
    archivedOpeningCount: 0,
    agniveerPartBCountFill: 0,
    agniveerPartBCountNotFill: 0,
    agniveerPartCCountFill: 0,
    agniveerPartCCountNotFill: 0,
    agniveerPreferenceDraftCount: 0,
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

            const hitCount = Number(raw.website_hit_count ?? raw.websiteHitCount ?? 0);

            const departmentCount = Number(
              raw.DepartmentSessionCount ?? raw.departmentSessionCount ?? 0,
            );

            const allAgniveersSession = Number(
              raw.AgniveerSessionCount ?? raw.agniveerSessionCount ?? 0,
            );

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

              const partBFill = Number(
                raw.Agniveer_partB_countfill ??
                  raw.Agniveer_partB_countFill ??
                  raw.agniveer_partB_countfill ??
                  raw.agniveer_partb_countfill ??
                  raw.Agniveer_partb_countfill ??
                  raw.Agniveer_partB_count_fill ??
                  raw.agniveer_partb_count_fill,
              );

              const partBNotFill = Number(
                raw.Agniveer_partB_countNotfill ??
                  raw.Agniveer_partB_countnotfill ??
                  raw.Agniveer_partB_countNotFill ??
                  raw.agniveer_partB_countNotfill ??
                  raw.agniveer_partb_countnotfill ??
                  raw.Agniveer_partb_countnotfill ??
                  raw.Agniveer_partB_count_notfill ??
                  raw.agniveer_partb_count_notfill,
              );

              const partCFill = Number(
                raw.Agniveer_partC_countfill ??
                  raw.Agniveer_partC_countFill ??
                  raw.agniveer_partC_countfill ??
                  raw.agniveer_partc_countfill ??
                  raw.Agniveer_partc_countfill ??
                  raw.Agniveer_partC_count_fill ??
                  raw.agniveer_partc_count_fill,
              );

              const agniveerPreferenceDraftCount = Number(
                raw.AgniveerPreferenceDraftCount ?? raw.agniveerPreferenceDraftCount ?? 0,
              );

              const partCNotFill = Number(
                raw.Agniveer_partC_countnotfill ??
                  raw.Agniveer_partC_countNotfill ??
                  raw.Agniveer_partC_countNotFill ??
                  raw.agniveer_partC_countnotfill ??
                  raw.agniveer_partc_countnotfill ??
                  raw.Agniveer_partc_countnotfill ??
                  raw.Agniveer_partC_count_notfill ??
                  raw.agniveer_partc_count_notfill,
              );

              this.stats.update((s) => ({
                ...s,
                agniveerCount: allAgniveers,
                rehabCount: rehab,
                toBeRehabCount: toBeRehab >= 0 ? toBeRehab : 0,
                subEntityCount: orgTypeCount,
                entityCount: orgCount,
                agniveerSessionCount: allAgniveersSession,
                hitCount,
                departmentCount,
                openingCount: jobNotifCount,
                currentOpeningCount: jobNotifCount,
                agniveerPartBCountFill: partBFill,
                agniveerPartBCountNotFill: partBNotFill,
                agniveerPartCCountFill: partCFill,
                agniveerPartCCountNotFill: partCNotFill,
                agniveerPreferenceDraftCount: agniveerPreferenceDraftCount,
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

  openAgniveerTable(filter: string, count?: number, draftSave?: number, part?: string): void {
    if (count !== undefined && count <= 0) {
      return;
    }
    const queryParams: any = { filter };
    if (draftSave !== undefined && draftSave !== null) {
      queryParams.draft_save = draftSave;
    }
    if (part) {
      queryParams.part = part;
    }
    this.router.navigate(['/dashboard/agniveers'], {
      queryParams,
    });
  }

  openDashboardTable(type: 'hit' | 'department' | 'agniveer', count?: number): void {
    if (count !== undefined && count <= 0) {
      return;
    }

    this.router.navigate(['/dashboard/dashboard-table'], {
      queryParams: {
        type,
      },
    });
  }

  openHitCountTable(): void {
    this.router.navigate(['/dashboard/hit-count'], {
      queryParams: {
        type: 'hit',
      },
    });
  }

  openDepartmentTable(): void {
    this.router.navigate(['/dashboard/hit-count'], {
      queryParams: {
        type: 'department',
      },
    });
  }

  openAgniveerListTable(): void {
    this.router.navigate(['/dashboard/hit-count'], {
      queryParams: {
        type: 'agniveer',
      },
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

    const publishedItems = list.filter((item: any) => {
      const isPublished = this.isItemPublished(item);

      const isVacancyFreezed =
        item.is_vacancy_freezed === true ||
        item.is_vacancy_freezed === 1 ||
        item.is_vacancy_freezed === '1' ||
        item.is_vacancy_freezed === 'true';

      return isPublished || isVacancyFreezed;
    });
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

      const documentPath =
        item.notification_document_filepath ||
        item.NotificationDocumentFilePath ||
        item.attachment_path ||
        item.AttachmentPath ||
        item.notification_document ||
        item.NotificationDocument ||
        item.document_url ||
        item.DocumentUrl ||
        item.file_path ||
        item.FilePath ||
        '';

      const mappedItem: OpeningNotification = {
        srNo: 0,
        id: item.id || item.job_notification_id || item.autoid || item.schedule_autoid,
        advtNo: item.advertisement_number || item.advt_no || item.AdvtNo || item.advtNo || 'N/A',
        organisationName: item.organisation_type || item.organization || item.OrganisationName,
        title: item.title || item.notification_title || item.job_title || item.JobTitle,
        isVacancyAdded: item.is_vacancy_added,

        isVacancyFreezed: item.is_vacancy_freezed,
        round: itemRound,
        documentPath,
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

  viewDocument(documentPath: string): void {
    if (!documentPath) {
      return;
    }

    let fullUrl = documentPath;

    if (!documentPath.startsWith('http://') && !documentPath.startsWith('https://')) {
      const base = environment.apiUrl.replace(/\/api\/?$/, '/');

      fullUrl = base + (documentPath.startsWith('/') ? documentPath.slice(1) : documentPath);
    }

    window.open(fullUrl, '_blank');
  }

  setActiveTab(tab: 'openings' | 'archives' | 'gazette'): void {
    this.activeTab.set(tab);
  }
}
