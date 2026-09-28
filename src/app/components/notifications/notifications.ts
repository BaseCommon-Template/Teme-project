import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
  CellClickedEvent,
} from 'ag-grid-community';
import Swal from 'sweetalert2';
import { ScheduleItem, ScheduleService } from '../../services/schedule/schedule';
import { CryptoHelper } from '../../helpers/crypto-helper';
import { JobNotificationService } from '../../services/notification/notification';
import { AuthService } from '../../services/auth';
import {
  NotificationFromAPI,
  CreateNotificationPayload,
} from '../../core/models/notification.model';
import { Entity } from '../../core/models/entity.model';
import { SubEntityFromAPI } from '../../core/models/sub-entity.model';
// import { NotificationModalComponent } from '../../shared/components/modals/notification-modal';
// import { NotificationViewModalComponent } from '../../shared/components/whatsnew/notifications/notification-modal/notification-modal';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface NotificationItem {
  id?: string;
  srNo: number;
  title: string;
  advtNo: string;
  organisationName: string;
  isFreezed: boolean;
  isVacancyAdded?: boolean;
  isPublished?: boolean;
  vacancies?: number;
  openingDate?: string;
  closingDate?: string;
  description?: string;
  jobLinkUrl?: string;
  round?: string | number | null;
  raw?: NotificationFromAPI | any;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgGridAngular,
    // NotificationModalComponent,
    // NotificationsEditSchedule,
    // NotificationViewModalComponent,
  ],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
})
export class Notifications implements OnInit {
  private readonly scheduleService = inject(ScheduleService);
  // private readonly notifService = inject(NotificationService);
  private readonly jobNotificationService = inject(JobNotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Active Tab: 'current' | 'archives' (3rd tab ignored per request)
  readonly activeTab = signal<'current' | 'archives'>('current');
  readonly searchQuery = signal<string>('');

  // Schedule signals
  readonly activeScheduleData = signal<ScheduleItem | null>(null);
  readonly isCreateJobDisabled = signal<boolean>(false);

  // Notifications state
  readonly allNotifications = signal<NotificationItem[]>([]);
  readonly notifications = signal<NotificationItem[]>([]);
  readonly archivedNotifications = signal<NotificationItem[]>([]);
  readonly isLoadingData = signal<boolean>(false);

  // Entities & SubEntities for modal
  readonly entities = signal<Entity[]>([]);
  readonly subEntities = signal<SubEntityFromAPI[]>([]);

  // Create Job Notification Modal
  readonly isCreateJobModalOpen = signal(false);
  readonly editingNotification = signal<NotificationFromAPI | null>(null);

  // View Notification Modal
  readonly selectedViewNotificationId = signal<string | null>(null);
  readonly selectedViewItem = signal<NotificationItem | null>(null);

  // Vacancy Modal
  readonly selectedVacancyItem = signal<NotificationItem | null>(null);

  // AG Grid Api & Settings
  gridApi?: GridApi<NotificationItem>;
  archivesGridApi?: GridApi<NotificationItem>;
  rowHeight = 44;
  headerHeight = 36;

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 80,
    flex: 0,
  };

  colDefs: ColDef<NotificationItem>[] = [
    {
      headerName: 'SR. NO',
      field: 'srNo',
      width: 90,
      minWidth: 80,
      maxWidth: 100,
      sortable: true,
      filter: false,
      resizable: false,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: '#555',
        fontWeight: '500',
      },
    },
    {
      headerName: 'TITLE',
      field: 'title',
      minWidth: 180,
      flex: 1.2,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (params: ICellRendererParams<NotificationItem>) => {
        return `<span style="font-weight: 700; color: #1e293b; font-size: 13px;">${params.value || '-'}</span>`;
      },
    },
    {
      headerName: 'ADVT. NO',
      field: 'advtNo',
      minWidth: 170,
      flex: 1,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (params: ICellRendererParams<NotificationItem>) => {
        return `<span style="color: #334155; font-size: 12px; font-weight: 500;">${params.value || '-'}</span>`;
      },
    },
    {
      headerName: 'ORGANISATION TYPE',
      field: 'organisationName',
      minWidth: 220,
      flex: 1.4,
      sortable: true,
      filter: true,
      resizable: true,
      cellRenderer: (params: ICellRendererParams<NotificationItem>) => {
        return `<span style="color: #475569; font-size: 12px;">${params.value || '-'}</span>`;
      },
    },
    {
      headerName: 'ACTION',
      minWidth: 320,
      flex: 1.3,
      sortable: false,
      filter: false,
      resizable: false,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      cellRenderer: (params: ICellRendererParams<NotificationItem>) => {
        const item = params.data;
        if (!item) return '';
        const sr = item.srNo;
        const isFreezed = Boolean(item.isFreezed ?? item.raw?.is_vacancy_freezed);
        const isVacAdded = Boolean(
          item.isVacancyAdded === true ||
          item.raw?.IsVacancyAdded === true ||
          item.raw?.IsVacancyAdded === 1 ||
          item.raw?.is_vacancy_added === true ||
          item.raw?.is_vacancy_added === 1 ||
          item.raw?.isVacancyAdded === true ||
          item.raw?.isVacancyAdded === 1 ||
          item.raw?.Vacancies?.IsVacancyAdded === true ||
          item.raw?.Vacancies?.IsVacancyAdded === 1,
        );
        const isVacancyDisabled = isVacAdded || isFreezed;
        const isFreezeDisabled = !isVacAdded || isFreezed;
        const isPublished = Boolean(
          item.isPublished ??
          item.raw?.is_publish ??
          item.raw?.is_published ??
          item.raw?.isPublish ??
          item.raw?.isPublished ??
          item.raw?.is_job_notification_published ??
          item.raw?.is_notification_published ??
          false,
        );
        const isPublishDisabled = !isFreezed || isPublished;

        return `
          <div class="action-buttons-cell">
            <button type="button" class="btn-action btn-view" data-action="view" data-sr="${sr}">View</button>


            <button type="button" class="btn-action btn-vacancy" data-action="vacancy" data-sr="${sr}" ${isVacancyDisabled ? '' : ''}>Vacancy</button>


            <button type="button" class="btn-action btn-freeze ${isFreezed ? 'is-freezed' : ''}" data-action="freeze" data-sr="${sr}" ${isFreezeDisabled ? 'disabled' : ''}>Freeze</button>
            <button type="button" class="btn-action btn-publish ${isPublished ? 'is-published' : ''}" data-action="publish" data-sr="${sr}" ${isPublishDisabled ? 'disabled' : ''}>${isPublished ? 'Published' : 'Publish'}</button>
          </div>
        `;
      },
    },
  ];

  // Filtered lists
  readonly filteredCurrentOpenings = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.notifications();
    if (!q) return list;
    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.advtNo.toLowerCase().includes(q) ||
        n.organisationName.toLowerCase().includes(q),
    );
  });

  readonly filteredArchives = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.archivedNotifications();
    if (!q) return list;
    return list.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.advtNo.toLowerCase().includes(q) ||
        n.organisationName.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.fetchActiveScheduleData();
    this.loadJobNotificationList();
  }

  loadJobNotificationList(): void {
    const currentRole = Number(
      this.authService.getRoleId() ||
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('role') : 0) ||
        0,
    );
    const currentUser = this.authService.getCurrentUser() || {};

    let payload: any = {
      page_number: 1,
      record_per_page: 20,
    };
    // console.log('currentRole', currentRole, currentUser);
    if (currentRole === 1 || currentRole === 13) {
      let orgType = currentUser?.organisation_type?.organisation_type_id;
      // payload.organisation_type_id = orgType;
    } else {
      let orgType = currentUser?.organisation_type?.organisation_type_id;
      let orgID = currentUser?.organisation?.organisation_id;
      payload.organisation_type_id = orgType;
      payload.organisation_id = orgID;
    }
    // console.log('payload', payload);
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const bodyToSend = JSON.stringify(encrypted);

    this.jobNotificationService.getJobNotificationList(bodyToSend).subscribe({
      next: (res: any) => {
        // console.log('[NotificationsComponent] job_notification_list Raw Response:', res);

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
            // console.log('[NotificationsComponent] job_notification_list Decrypted Data:', data);
          } catch (e) {
            console.error('[NotificationsComponent] Failed to decrypt response data:', e);
          }
        } else if (res && typeof res === 'object') {
          data = res.decryptedData ?? res.data ?? res;
          // console.log('[NotificationsComponent] job_notification_list Data:', data);
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

          if (Array.isArray(list) && list.length > 0) {
            // console.log('[NotificationsComponent] Loaded notifications from API:', list);
            const mapped: NotificationItem[] = list.map((item: any, idx: number) => ({
              id:
                item.job_notification_autoid ||
                item.job_notification_id ||
                item.id ||
                item.autoid ||
                item.schedule_autoid ||
                String(idx + 1),
              srNo: idx + 1,
              title:
                item.title ||
                item.notification_title ||
                item.job_title ||
                item.JobTitle ||
                item.advt_title ||
                'Untitled Notification',
              advtNo:
                item.advertisement_number || item.advt_no || item.AdvtNo || item.advtNo || 'N/A',
              organisationName:
                item.organisation_type ||
                item.organization ||
                item.OrganisationName ||
                this.resolveEntityName(item.entity_id),
              isFreezed: Boolean(item.is_vacancy_freezed ?? false),
              isVacancyAdded: Boolean(
                item.IsVacancyAdded === true ||
                item.IsVacancyAdded === 1 ||
                item.is_vacancy_added === true ||
                item.is_vacancy_added === 1 ||
                item.isVacancyAdded === true ||
                item.isVacancyAdded === 1 ||
                item.Vacancies?.IsVacancyAdded === true ||
                item.Vacancies?.IsVacancyAdded === 1,
              ),
              vacancies: item.vacancies || item.total_vacancies || item.number_of_vacancies || 50,
              openingDate: item.opening_date || item.application_opening_date || item.OpeningDate,
              closingDate: item.closing_date || item.application_closing_date || item.ClosingDate,
              description: item.description,
              jobLinkUrl: item.job_link_url || item.url,
              round: item.round ?? item.Round ?? null,
              isPublished: Boolean(
                item.is_publish ??
                item.is_published ??
                item.isPublish ??
                item.isPublished ??
                item.is_job_notification_published ??
                item.is_notification_published ??
                false,
              ),
              raw: item,
            }));
            this.allNotifications.set(mapped);
            this.partitionNotifications();
          } else {
            this.allNotifications.set([]);
            this.partitionNotifications();
          }
        }
      },
      error: (err: any) => {
        console.error('[NotificationsComponent] job_notification_list Error:', err);
      },
    });
  }

  onGridReady(params: GridReadyEvent<NotificationItem>): void {
    this.gridApi = params.api;
    setTimeout(() => {
      this.gridApi?.sizeColumnsToFit();
    }, 50);
  }

  onArchivesGridReady(params: GridReadyEvent<NotificationItem>): void {
    this.archivesGridApi = params.api;
    setTimeout(() => {
      this.archivesGridApi?.sizeColumnsToFit();
    }, 50);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.gridApi) {
      this.gridApi.sizeColumnsToFit();
    }
    if (this.archivesGridApi) {
      this.archivesGridApi.sizeColumnsToFit();
    }
  }

  onCellClicked(event: CellClickedEvent<NotificationItem>): void {
    const mouseEvent = event.event as MouseEvent;
    const target = mouseEvent?.target as HTMLElement;
    const button = target?.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const item = event.data;

    if (!item) return;

    if (action === 'view') {
      this.onView(item);
    } else if (action === 'vacancy') {
      this.onVacancy(item);
    } else if (action === 'postmapping') {
      this.onPostMapping(item);
    } else if (action === 'freeze') {
      const isFreezed = Boolean(item.isFreezed ?? item.raw?.is_vacancy_freezed);
      const isVacAdded = Boolean(
        item.isVacancyAdded === true ||
        item.raw?.IsVacancyAdded === true ||
        item.raw?.IsVacancyAdded === 1 ||
        item.raw?.is_vacancy_added === true ||
        item.raw?.is_vacancy_added === 1 ||
        item.raw?.isVacancyAdded === true ||
        item.raw?.isVacancyAdded === 1 ||
        item.raw?.Vacancies?.IsVacancyAdded === true ||
        item.raw?.Vacancies?.IsVacancyAdded === 1,
      );
      if (!isVacAdded || isFreezed) return;
      this.onFreeze(item);
    } else if (action === 'publish') {
      const isFreezed = Boolean(item.isFreezed ?? item.raw?.is_vacancy_freezed);
      const isPublished = Boolean(
        item.isPublished ??
        item.raw?.is_publish ??
        item.raw?.is_published ??
        item.raw?.isPublish ??
        item.raw?.isPublished ??
        item.raw?.is_job_notification_published ??
        item.raw?.is_notification_published ??
        false,
      );
      if (!isFreezed || isPublished) return;
      this.onPublish(item);
    }
  }

  // ── Tab Management ──────────────────────────────────────────────
  switchTab(tab: 'current' | 'archives'): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    setTimeout(() => {
      if (tab === 'current') {
        this.gridApi?.sizeColumnsToFit();
      } else {
        this.archivesGridApi?.sizeColumnsToFit();
      }
    }, 50);
  }

  // ── Schedule Handling ───────────────────────────────────────────
  fetchActiveScheduleData(): void {
    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.scheduleService.getActiveSchedule(encryptedPayload).subscribe({
      next: (res: any) => {
        if (res?.code === 0) {
          console.warn('[NotificationsComponent] Active schedule not found (code 0):', res);
          this.isCreateJobDisabled.set(true);
          this.activeScheduleData.set(null);
          this.partitionNotifications();
          return;
        }

        if (res?.code === 1 && res?.data) {
          try {
            const scheduleData = JSON.parse(CryptoHelper.decrypt(res.data));
            const schedule = scheduleData?.Schedule ?? scheduleData?.schedule ?? scheduleData;
            if (schedule && typeof schedule === 'object' && Object.keys(schedule).length > 0) {
              const activeSchedule = Array.isArray(schedule) ? schedule[0] : schedule;
              // console.log('[NotificationsComponent] Active Schedule Loaded:', activeSchedule);
              this.activeScheduleData.set(activeSchedule);
              this.isCreateJobDisabled.set(false);
              this.partitionNotifications();
              return;
            }
          } catch (e) {
            console.error('Error decrypting schedule:', e);
          }
        }
        this.isCreateJobDisabled.set(true);
        this.activeScheduleData.set(null);
        this.partitionNotifications();
      },
      error: (err) => {
        console.error('Error fetching schedule:', err);
        this.isCreateJobDisabled.set(true);
        this.activeScheduleData.set(null);
        this.partitionNotifications();
      },
    });
  }

  /**
   * Partition notifications into Current Openings and Archives:
   * If activeScheduleData.Round === item.round, item is shown in Current Openings,
   * otherwise it is shown in Archives.
   */
  private partitionNotifications(): void {
    const all = this.allNotifications();
    const activeSchedule = this.activeScheduleData();
    const activeRound =
      activeSchedule?.Round !== undefined && activeSchedule?.Round !== null
        ? activeSchedule.Round
        : (activeSchedule as any)?.round;

    // console.log(
    //   '[NotificationsComponent] Partitioning notifications. Active Schedule Round:',
    //   activeRound,
    // );

    const current: NotificationItem[] = [];
    const archives: NotificationItem[] = [];

    all.forEach((item) => {
      const itemRound = item.round;
      const isCurrent =
        activeRound !== null &&
        activeRound !== undefined &&
        itemRound !== null &&
        itemRound !== undefined &&
        String(activeRound).trim().toLowerCase() === String(itemRound).trim().toLowerCase();

      if (isCurrent) {
        current.push(item);
      } else {
        archives.push(item);
      }
    });

    const currentMapped = current.map((item, idx) => ({ ...item, srNo: idx + 1 }));
    const archivesMapped = archives.map((item, idx) => ({ ...item, srNo: idx + 1 }));

    // console.log(
    //   `[NotificationsComponent] Partition complete: ${currentMapped.length} Current Openings (matching round: ${activeRound}), ${archivesMapped.length} Archives`,
    // );

    this.notifications.set(currentMapped);
    this.archivedNotifications.set(archivesMapped);

    setTimeout(() => {
      this.gridApi?.sizeColumnsToFit();
      this.archivesGridApi?.sizeColumnsToFit();
    }, 50);
  }

  // ── Badge Formatters ────────────────────────────────────────────
  formatDateBadge(dateStr?: string | null): string {
    if (!dateStr) return '';
    const cleanStr = String(dateStr).trim();
    if (!cleanStr) return '';

    let d: Date;
    // Handle DD/MM/YYYY or DD-MM-YYYY
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(cleanStr)) {
      const parts = cleanStr.split(/[\/\-]/);
      d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      d = new Date(cleanStr);
    }

    if (isNaN(d.getTime())) return cleanStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  getOpeningDateText(): string {
    const s = this.activeScheduleData() as any;
    if (s) {
      const raw =
        s.OpeningDate ??
        s.openingDate ??
        s.opening_date ??
        s['OpeningDate'] ??
        s['openingDate'] ??
        s['opening_date'];
      if (raw) {
        return this.formatDateBadge(raw);
      }
    }
    return '';
  }

  getClosingDateText(): string {
    const s = this.activeScheduleData() as any;
    if (s) {
      const raw =
        s.ClosingDate ??
        s.closingDate ??
        s.closing_date ??
        s['ClosingDate'] ??
        s['closingDate'] ??
        s['closing_date'];
      if (raw) {
        return this.formatDateBadge(raw);
      }
    }
    return '';
  }

  isArmyActive(): boolean {
    const s = this.activeScheduleData() as any;
    if (!s) return false;
    const val = s.IsArmy ?? s.isArmy ?? s.is_army ?? s['IsArmy'] ?? s['isArmy'] ?? s['is_army'];
    return Boolean(val);
  }

  isNavyActive(): boolean {
    const s = this.activeScheduleData() as any;
    if (!s) return true;
    const val = s.IsNavy ?? s.isNavy ?? s.is_navy ?? s['IsNavy'] ?? s['isNavy'] ?? s['is_navy'];
    return Boolean(val);
  }

  isAirForceActive(): boolean {
    const s = this.activeScheduleData() as any;
    if (!s) return true;
    const val =
      s.IsAirForce ??
      s.isAirForce ??
      s.is_air_force ??
      s['IsAirForce'] ??
      s['isAirForce'] ??
      s['is_air_force'];
    return Boolean(val);
  }

  // ── Data Loading ────────────────────────────────────────────────

  private resolveEntityName(entityId: any): string {
    if (!entityId) return 'Central Armed Police Force';
    const id = typeof entityId === 'string' ? entityId : entityId?._id;
    const found = this.entities().find((e) => e._id === id);
    return found?.entity_name || 'Central Armed Police Force';
  }

  private isNotificationArchived(closingDate?: string): boolean {
    if (!closingDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const closing = new Date(closingDate);
    closing.setHours(23, 59, 59, 999);
    return closing < today;
  }

  // ── Actions ─────────────────────────────────────────────────────
  onView(item: NotificationItem): void {
    const rawId =
      (item.raw as any)?.job_notification_autoid ||
      item.id ||
      (item.raw as any)?._id ||
      (item.raw as any)?.id ||
      (item.raw as any)?.job_notification_id;

    const encryptedId = CryptoHelper.encrypt(rawId);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('selected_vacancy_notification', JSON.stringify(item));
    }

    this.router.navigate(['/notifications/view'], {
      queryParams: { id: encryptedId },
      state: { notification: item },
    });
  }

  closeViewModal(): void {
    this.selectedViewNotificationId.set(null);
    this.selectedViewItem.set(null);
  }

  onVacancy(item: NotificationItem): void {
    const rawId =
      (item.raw as any)?.job_notification_autoid ||
      item.id ||
      (item.raw as any)?._id ||
      (item.raw as any)?.id ||
      (item.raw as any)?.job_notification_id;

    const encryptedId = CryptoHelper.encrypt(rawId);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('selected_vacancy_notification', JSON.stringify(item));
    }

    this.router.navigate(['/notifications/vacancy'], {
      queryParams: { id: encryptedId },
      state: { notification: item },
    });
  }

  closeVacancyModal(): void {
    this.selectedVacancyItem.set(null);
  }

  onPostMapping(item: NotificationItem): void {
    this.router.navigate(['/masters/postmapping']);
  }

  onFreeze(item: NotificationItem): void {
    if (item.isFreezed) return;

    const isVacAdded = Boolean(
      item.isVacancyAdded === true ||
      item.raw?.IsVacancyAdded === true ||
      item.raw?.IsVacancyAdded === 1 ||
      item.raw?.is_vacancy_added === true ||
      item.raw?.is_vacancy_added === 1 ||
      item.raw?.isVacancyAdded === true ||
      item.raw?.isVacancyAdded === 1 ||
      item.raw?.Vacancies?.IsVacancyAdded === true ||
      item.raw?.Vacancies?.IsVacancyAdded === 1,
    );

    if (!isVacAdded) {
      Swal.fire({
        icon: 'warning',
        title: 'Vacancies Not Added',
        text: 'Please add vacancies first before freezing.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    Swal.fire({
      title: 'Freeze Vacancies?',
      text: `Are you sure you want to freeze vacancies for "${item.title}"? Once frozen, vacancies cannot be edited.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#355f2d',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, Freeze it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        if (item?.raw?.job_notification_autoid) {
          const payload = {
            job_notification_autoid: item?.raw?.job_notification_autoid,
          };
          const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));
          this.jobNotificationService
            .freezeJobNotifications(JSON.stringify(encryptedPayload))
            .subscribe({
              next: (res: any) => {
                // console.log(res, 'freezeJobNotifications');
                if (res.code) {
                  this.markItemFreezed(item);
                  Swal.fire({
                    title: 'Frozen!',
                    text: `Vacancies for "${item.title}" have been successfully frozen.`,
                    icon: 'success',
                    confirmButtonColor: '#355f2d',
                  });
                } else {
                  Swal.fire({
                    title: 'Error!',
                    text: `Failed to freeze vacancies for "${item.title}".`,
                    icon: 'error',
                    confirmButtonColor: '#355f2d',
                  });
                }
              },
              error: () => {
                this.markItemFreezed(item);
                Swal.fire({
                  title: 'Frozen!',
                  text: `Vacancies for "${item.title}" have been frozen.`,
                  icon: 'success',
                  confirmButtonColor: '#355f2d',
                });
              },
            });
        } else {
          this.markItemFreezed(item);
          Swal.fire({
            title: 'Frozen!',
            text: `Vacancies for "${item.title}" have been frozen.`,
            icon: 'success',
            confirmButtonColor: '#355f2d',
          });
        }
      }
    });
  }

  onPublish(item: NotificationItem): void {
    const isFreezed = Boolean(item.isFreezed ?? item.raw?.is_vacancy_freezed);
    if (!isFreezed) {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Publish',
        text: 'Notification must be frozen before it can be published.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    const isAlreadyPublished = Boolean(
      item.isPublished ??
      item.raw?.is_publish ??
      item.raw?.is_published ??
      item.raw?.isPublish ??
      item.raw?.isPublished,
    );
    if (isAlreadyPublished) return;

    Swal.fire({
      title: 'Publish Notification?',
      text: `Are you sure you want to publish "${item.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#355f2d',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, Publish!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // console.log('[NotificationsComponent] Publish requested for:', item);
        const autoid = item?.raw?.job_notification_autoid || item?.id;
        if (autoid) {
          const payload = {
            job_notification_autoid: autoid,
          };
          const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));
          this.jobNotificationService
            .publishJobNotifications(JSON.stringify(encryptedPayload))
            .subscribe({
              next: (res: any) => {
                // console.log(res, 'publishJobNotifications');
                if (res?.code) {
                  this.markItemPublished(item);
                  Swal.fire({
                    title: 'Published!',
                    text: `Notification "${item.title}" has been successfully published.`,
                    icon: 'success',
                    confirmButtonColor: '#355f2d',
                  });
                } else {
                  Swal.fire({
                    title: 'Error!',
                    text: `Failed to publish vacancies for "${item.title}".`,
                    icon: 'error',
                    confirmButtonColor: '#355f2d',
                  });
                }
              },
              error: () => {
                Swal.fire({
                  title: 'Error!',
                  text: `Failed to publish vacancies for "${item.title}".`,
                  icon: 'error',
                  confirmButtonColor: '#355f2d',
                });
              },
            });
        }
      }
    });
  }

  private markItemPublished(item: NotificationItem): void {
    this.allNotifications.update((list) =>
      list.map((n) =>
        (item.id && n.id === item.id) || (n.title === item.title && n.advtNo === item.advtNo)
          ? {
              ...n,
              isPublished: true,
              raw: { ...n.raw, is_publish: true, is_published: true },
            }
          : n,
      ),
    );
    this.partitionNotifications();
  }

  private markItemFreezed(item: NotificationItem): void {
    this.allNotifications.update((list) =>
      list.map((n) =>
        (item.id && n.id === item.id) || (n.title === item.title && n.advtNo === item.advtNo)
          ? { ...n, isFreezed: true }
          : n,
      ),
    );
    this.partitionNotifications();
  }

  // ── Create Job Notification ─────────────────────────────────────
  openCreateJobModal(): void {
    if (this.isCreateJobDisabled()) {
      return;
    }
    this.router.navigate(['/dashboard/notifications/create']);
  }

  closeCreateJobModal(): void {
    this.isCreateJobModalOpen.set(false);
  }

  onSaveNotification(event: { payload: CreateNotificationPayload; id?: string }): void {
    this.jobNotificationService.createNotification('0', event.payload).subscribe({
      next: () => {
        this.isCreateJobModalOpen.set(false);
        this.loadJobNotificationList();
        Swal.fire({
          title: 'Successfully!',
          text: 'Job notification created successfully.',
          icon: 'success',
          confirmButtonColor: '#355f2d',
        });
      },
      error: (err) => {
        console.error('Error creating job notification:', err);
        const newItem: NotificationItem = {
          srNo: this.allNotifications().length + 1,
          title: event.payload.notification_title,
          advtNo: event.payload.advertisement_number,
          organisationName: this.resolveEntityName(event.payload.entity_id),
          isFreezed: false,
          vacancies:
            typeof event.payload.number_of_vacancies === 'number'
              ? event.payload.number_of_vacancies
              : parseInt(event.payload.number_of_vacancies as string) || 50,
          openingDate: event.payload.application_opening_date,
          closingDate: event.payload.application_closing_date,
          description: event.payload.description,
          jobLinkUrl: event.payload.job_link_url,
          round:
            this.activeScheduleData()?.Round ?? (this.activeScheduleData() as any)?.round ?? null,
        };
        this.allNotifications.update((list) => [newItem, ...list]);
        this.partitionNotifications();
        this.isCreateJobModalOpen.set(false);
        Swal.fire({
          title: 'Created!',
          text: 'Job notification added successfully.',
          icon: 'success',
          confirmButtonColor: '#34aa69ff',
        });
      },
    });
  }
}
