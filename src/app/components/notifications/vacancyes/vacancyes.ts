import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { CryptoHelper } from '../../../helpers/crypto-helper';
import { JobNotificationService } from '../../../services/notification/notification';
import { ScheduleService } from '../../../services/schedule/schedule';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface VacancyRow {
  srNo: number;
  sub_vacancies_autoid?: number;
  organization: string;
  organisation_name: string;
  organisation_id: number;
  force: string;
  agniveer_force_type: string;
  agniveer_force_autoid: number;
  gender: string;
  gender_code: string;
  category: 'UR' | 'OBC' | 'SC' | 'ST' | 'EWS' | string;
  category_name: string;
  autocategory_id: number;
  vacancies: number;
  postAutoId?: string | number;
  postName?: string;
  organisationId?: number;
}

export interface OrganizationVacancyGroup {
  id: number;
  organizationName: string;
  isExpanded: boolean;
  gridApi?: GridApi<VacancyRow>;
  rows: VacancyRow[];
}

@Component({
  selector: 'app-vacancyes',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './vacancyes.html',
  styleUrl: './vacancyes.css',
})
export class Vacancyes implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobNotificationService = inject(JobNotificationService);
  private readonly scheduleService = inject(ScheduleService);

  readonly decryptedNotificationId = signal<string>('');
  readonly jobNotificationAutoId = signal<number>(0);
  readonly vacanciesAutoId = signal<number>(0);
  readonly advertisementNo = signal<string>('');
  readonly notificationTitle = signal<string>('');
  readonly searchFilter = signal<string>('');
  readonly isVacancyAdded = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly isSavingDraft = signal<boolean>(false);
  readonly loadedCategories = signal<string[]>([]);
  readonly loadedCategoryObjects = signal<
    Array<{ autocategory_id: number; category_name: string }>
  >([]);
  readonly loadedOrganisations = signal<any[]>([]);
  readonly loadedForces = signal<string[]>([]);
  readonly loadedForceObjects = signal<
    Array<{ agniveer_force_autoid: number; agniveer_force_type: string }>
  >([]);
  readonly loadedVacancyDetails = signal<any[]>([]);
  readonly activeScheduleRound = signal<number | string | null>(null);

  readonly organizationGroups = signal<OrganizationVacancyGroup[]>([]);
  private readonly orgCategoriesMap = new Map<
    number | string,
    Array<{ autocategory_id: number; category_name: string }>
  >();

  // AG Grid Configuration
  rowHeight = 40;
  headerHeight = 32;

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 90,
  };

  colDefs: ColDef<VacancyRow>[] = [
    {
      headerName: 'SR. NO.',
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
        color: '#475569',
        fontWeight: '600',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'ORGANIZATION',
      field: 'organization',
      minWidth: 200,
      flex: 1.4,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#1e293b',
        fontWeight: '500',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'FORCE',
      field: 'force',
      minWidth: 150,
      flex: 1.1,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#334155',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'GENDER',
      field: 'gender',
      minWidth: 110,
      flex: 0.9,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#334155',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'CATEGORY',
      field: 'category',
      minWidth: 120,
      flex: 1,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      cellRenderer: (params: ICellRendererParams<VacancyRow>) => {
        const cat = String(params.value || '')
          .toUpperCase()
          .trim();
        let bg = '#f1f5f9';
        let text = '#334155';
        let border = '#cbd5e1';

        if (cat === 'UR') {
          bg = '#f1f5f9';
          text = '#334155';
          border = '#cbd5e1';
        } else if (cat === 'OBC') {
          bg = '#fffbeb';
          text = '#d97706';
          border = '#fde68a';
        } else if (cat === 'SC') {
          bg = '#eff6ff';
          text = '#2563eb';
          border = '#bfdbfe';
        } else if (cat === 'ST') {
          bg = '#f0fdf4';
          text = '#16a34a';
          border = '#bbf7d0';
        } else if (cat === 'EWS') {
          bg = '#faf5ff';
          text = '#9333ea';
          border = '#e9d5ff';
        }

        return `
          <span style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 3px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.2;
            background: ${bg};
            color: ${text};
            border: 1px solid ${border};
            font-family: 'Poppins', sans-serif;
            letter-spacing: 0.5px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          ">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      headerName: 'VACANCIES',
      field: 'vacancies',
      minWidth: 140,
      flex: 1,
      sortable: false,
      filter: false,
      resizable: false,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      cellRenderer: (params: ICellRendererParams<VacancyRow>) => {
        const val = Math.max(0, Number(params.value ?? 0) || 0);
        const sr = params.data?.srNo;
        const isDisabled = this.isVacancyAdded();
        const disabledAttr = isDisabled ? 'disabled' : '';
        const inputStyles = isDisabled
          ? 'background: #f8fafc; color: #64748b; cursor: not-allowed; border: 1px solid #e2e8f0;'
          : 'background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1;';
        return `
          <input
            type="number"
            min="0"
            step="1"
            ${disabledAttr}
            onkeydown="if(['-', '+', 'e', 'E'].includes(event.key)) { event.preventDefault(); }"
            oninput="if(this.value < 0) this.value = '0';"
            value="${val}"
            data-sr="${sr}"
            class="vacancy-number-input"
            style="
              width: 85px;
              height: 28px;
              text-align: center;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 600;
              outline: none;
              font-family: 'Poppins', sans-serif;
              box-shadow: 0 1px 2px rgba(0,0,0,0.04);
              ${inputStyles}
            "
          />
        `;
      },
    },
  ];

  ngOnInit(): void {
    const decryptedId = this.extractAndDecryptId();
    this.loadNotificationDetails();
    this.loadNotificationDetailsById(decryptedId);
    this.loadSchedules();
    this.loadVacanciesById();
  }

  private extractAndDecryptId(): string {
    let encrypted = this.route.snapshot.queryParams['id'];

    if (!encrypted) {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      if (search && search.startsWith('?')) {
        const raw = search.substring(1);
        if (raw.startsWith('id=')) {
          encrypted = raw.substring(3);
        } else if (raw.startsWith('vacancy=')) {
          encrypted = raw.substring(8);
        } else {
          encrypted = raw.split('&')[0];
        }
      }
    }

    if (!encrypted) {
      const keys = Object.keys(this.route.snapshot.queryParams);
      if (keys.length > 0) {
        encrypted = this.route.snapshot.queryParams[keys[0]] || keys[0];
      }
    }

    if (!encrypted) {
      encrypted = this.route.snapshot.params['id'];
    }

    if (encrypted) {
      try {
        const cleanCipher = decodeURIComponent(encrypted).replace(/ /g, '+');
        const decryptedId = CryptoHelper.decrypt(cleanCipher);
        this.decryptedNotificationId.set(decryptedId);
        // console.log(decryptedId, 'jobnotifix');

        const num = Number(decryptedId);
        if (!isNaN(num) && num > 0) {
          this.jobNotificationAutoId.set(num);
        }

        return decryptedId;
      } catch (err) {
        console.error('[VacancyesComponent] Failed to decrypt notification ID:', err);
      }
    } else {
      console.warn('[VacancyesComponent] No encrypted ID provided in URL');
    }

    return '';
  }

  private loadNotificationDetails(): void {
    const stateNotif = history.state?.notification;
    if (stateNotif) {
      this.applyNotificationInfo(stateNotif);
      return;
    }

    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('selected_vacancy_notification');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.applyNotificationInfo(parsed);
          return;
        } catch {}
      }
    }
  }

  private setVacancyAdded(status: boolean): void {
    this.isVacancyAdded.set(status);
    if (status) {
      const groups = this.organizationGroups();
      for (const group of groups) {
        if (group.gridApi) {
          group.gridApi.redrawRows();
        }
      }
    }
  }

  private applyNotificationInfo(notif: any): void {
    if (
      notif.advtNo ||
      notif.advertisement_number ||
      notif.AdvertisementNumber ||
      notif.advertisementNo
    ) {
      this.advertisementNo.set(
        notif.advtNo ||
          notif.advertisement_number ||
          notif.AdvertisementNumber ||
          notif.advertisementNo,
      );
    }
    if (notif.title || notif.notification_title || notif.NotificationTitle) {
      this.notificationTitle.set(
        notif.title || notif.notification_title || notif.NotificationTitle,
      );
    }
    const autoId = Number(
      notif.job_notification_autoid ??
        notif.JobNotificationAutoId ??
        notif.jobNotificationAutoId ??
        notif.autoid ??
        notif.AutoId ??
        notif.id,
    );
    if (!isNaN(autoId) && autoId > 0) {
      this.jobNotificationAutoId.set(autoId);
    }
    const vacAutoId = Number(notif.vacancies_autoid ?? notif.VacanciesAutoId ?? 0);
    if (!isNaN(vacAutoId) && vacAutoId > 0) {
      this.vacanciesAutoId.set(vacAutoId);
    }
    const roundVal = notif.round ?? notif.Round ?? notif.schedule_round ?? notif.ScheduleRound;
    if (roundVal !== undefined && roundVal !== null) {
      this.activeScheduleRound.set(roundVal);
    }
    const isVacAdded = Boolean(notif.IsVacancyAdded === true);
    if (isVacAdded) {
      this.setVacancyAdded(true);
    }
  }

  private loadCategoriesAndBuildTable(stateId: number = 0, org?: any): void {
    const payload = { StateCd: stateId };
    // console.log(payload, 'payload');
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);
    this.jobNotificationService.GetReservationCategories(encryptedPayload).subscribe({
      next: (res: any) => {
        let data: any = res;

        const cipher = typeof res === 'string' ? res : res?.data;
        if (cipher && typeof cipher === 'string') {
          try {
            const dec = CryptoHelper.decrypt(cipher);
            data = typeof dec === 'string' ? JSON.parse(dec) : dec;
          } catch {
            data = cipher;
          }
        }
        // console.log(data, 'loadCategoriesAndBuildTable');

        const rawList: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.Category)
                ? data.Category
                : Array.isArray(data?.Categories)
                  ? data.Categories
                  : Array.isArray(data?.categories)
                    ? data.categories
                    : Array.isArray(data?.ReservationCategories)
                      ? data.ReservationCategories
                      : Array.isArray(data?.Table)
                        ? data.Table
                        : [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          const categoryObjects = rawList
            .filter((item: any) => item?.is_active !== false && item?.IsActive !== false)
            .map((item: any, idx: number) => {
              const rawId = Number(
                item?.AutoCategoryId ??
                  item?.autoCategoryId ??
                  item?.autocategory_id ??
                  item?.autocategoryId ??
                  item?.CategoryId ??
                  item?.categoryId ??
                  item?.category_id ??
                  item?.id ??
                  item?.Id ??
                  item?.reservation_category_id ??
                  item?.ReservationCategoryId ??
                  0,
              );
              const name = String(
                item?.CategoryName ??
                  item?.categoryName ??
                  item?.Category ??
                  item?.category ??
                  item?.category_name ??
                  item?.reservation_category ??
                  item?.reservation_category_name ??
                  item?.ReservationCategoryName ??
                  item?.name ??
                  item?.Name ??
                  '',
              ).trim();
              return {
                autocategory_id: !isNaN(rawId) && rawId > 0 ? rawId : idx + 1,
                category_name: name,
              };
            })
            .filter((c) => c.category_name);

          if (org) {
            const orgId = Number(org?.OrganisationId ?? org?.organisation_id ?? org?.id ?? 0);
            if (orgId > 0) {
              this.orgCategoriesMap.set(orgId, categoryObjects);
            }
            const orgName = String(
              org?.OrganisationName ?? org?.organisation_name ?? org?.name ?? '',
            ).trim();
            if (orgName) {
              this.orgCategoriesMap.set(orgName, categoryObjects);
            }
          }

          if (this.loadedCategoryObjects().length === 0) {
            this.loadedCategoryObjects.set(categoryObjects);
            this.loadedCategories.set(categoryObjects.map((c) => c.category_name));
          } else {
            const currentObjs = [...this.loadedCategoryObjects()];
            for (const cat of categoryObjects) {
              if (
                !currentObjs.some(
                  (c) =>
                    c.autocategory_id === cat.autocategory_id ||
                    c.category_name.toLowerCase() === cat.category_name.toLowerCase(),
                )
              ) {
                currentObjs.push(cat);
              }
            }
            this.loadedCategoryObjects.set(currentObjs);
            this.loadedCategories.set(currentObjs.map((c) => c.category_name));
          }
        }

        this.buildVacancyRows();
      },
      error: (err) => {
        console.error('[VacancyesComponent] Failed to load categories from API:', err);
      },
    });
  }

  private loadNotificationDetailsById(notificationId?: any): void {
    const rawId = notificationId || this.decryptedNotificationId();
    const num = Number(rawId);
    const autoid = !isNaN(num) && num > 0 ? num : rawId;

    if (!autoid) {
      console.warn(
        '[VacancyesComponent] No valid notification ID found for loadNotificationDetailsById',
      );
      return;
    }

    const payload = {
      job_notification_autoid: autoid,
    };
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);
    this.jobNotificationService.getJobNotificationById(encryptedPayload).subscribe({
      next: (res: any) => {
        if (res?.code || res?.data) {
          let dec: any = null;
          try {
            const rawDecrypted = CryptoHelper.decrypt(res?.data);
            dec = typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
            // console.log(dec, 'dec');
          } catch (e) {
            console.error('[VacancyesComponent] Error parsing decrypted data:', e);
            dec = res?.data;
          }

          // console.log(dec, 'dec');

          const notif = dec?.JobNotification || dec?.jobNotification || dec;
          if (notif) {
            this.applyNotificationInfo(notif);

            const rawOrgs = notif.Organisations || notif.organisations;
            if (Array.isArray(rawOrgs) && rawOrgs.length > 0) {
              this.loadedOrganisations.set(rawOrgs);
              rawOrgs.forEach((org: any) => {
                const stateIdVal =
                  org?.HqStateId ??
                  org?.hq_state_id ??
                  org?.hqStateId ??
                  org?.StateId ??
                  org?.state_id;
                const stateId =
                  stateIdVal !== null &&
                  stateIdVal !== undefined &&
                  stateIdVal !== '' &&
                  !isNaN(Number(stateIdVal))
                    ? Number(stateIdVal)
                    : 0;
                this.loadCategoriesAndBuildTable(stateId, org);
              });
            } else {
              this.buildVacancyRows();
            }
          }
        }
      },
      error: (err) => {
        console.error(
          '[VacancyesComponent] Failed to load notification details by id from API:',
          err,
        );
      },
    });
  }

  loadSchedules(): void {
    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.scheduleService.getActiveSchedule(encryptedPayload).subscribe({
      next: (res: any) => {
        let forces: Array<{ agniveer_force_autoid: number; agniveer_force_type: string }> = [];

        if (res?.code) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const data = typeof dec === 'string' ? JSON.parse(dec) : dec;
            // console.log(data, 'getActiveSchedule data');
            const schedule =
              data?.Schedule ?? data?.schedule ?? data?.Table ?? data?.Schedules ?? data;
            const activeItem = Array.isArray(schedule) ? schedule[0] : schedule;
            const roundVal =
              activeItem?.Round ??
              activeItem?.round ??
              activeItem?.ScheduleRound ??
              activeItem?.schedule_round ??
              data?.Round ??
              data?.round ??
              null;
            if (roundVal !== undefined && roundVal !== null) {
              this.activeScheduleRound.set(roundVal);
            }
            forces = this.extractForcesFromSchedule(data);
            // console.log(forces, 'extracted forces');
          } catch (e) {
            console.error('Error decrypting schedule:', e);
          }
        }

        if (forces.length > 0) {
          this.loadedForceObjects.set(forces);
          this.loadedForces.set(forces.map((f) => f.agniveer_force_type));
          this.buildVacancyRows();
        }
      },
      error: (err) => {
        console.warn('Could not fetch active schedule:', err);
      },
    });
  }
  loadVacanciesById(): void {
    const notifId = this.jobNotificationAutoId() || Number(this.extractAndDecryptId());
    if (!notifId) {
      console.warn('[VacancyesComponent] No job_notification_autoid found for loadVacanciesById');
      return;
    }

    const payload = {
      job_notification_autoid: notifId,
    };
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.jobNotificationService.GetvacanciesbyJobNotificationAutoid(encryptedPayload).subscribe({
      next: (res: any) => {
        if (res?.code) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const parsed = typeof dec === 'string' ? JSON.parse(dec) : dec;
            const vacanciesData = parsed?.Vacancies ?? parsed?.vacancies ?? parsed;
            // console.log(vacanciesData, 'GetvacanciesbyJobNotificationAutoid');

            if (vacanciesData) {
              const isVacAdded = Boolean(vacanciesData.IsVacancyAdded === true);
              if (isVacAdded) {
                this.setVacancyAdded(true);
              }

              const vacAutoId = Number(
                vacanciesData.VacanciesAutoId ?? vacanciesData.vacancies_autoid ?? 0,
              );
              if (vacAutoId > 0) {
                this.vacanciesAutoId.set(vacAutoId);
              }

              const advt = vacanciesData.AdvertisementNumber ?? vacanciesData.advertisement_number;
              if (advt && !this.advertisementNo()) {
                this.advertisementNo.set(advt);
              }

              const details = vacanciesData.VacancyDetails ?? vacanciesData.vacancy_details ?? [];
              if (Array.isArray(details) && details.length > 0) {
                this.loadedVacancyDetails.set(details);
                this.applyLoadedVacancyDetailsToGroups();
              }
            }
          } catch (e) {
            console.error('Error decrypting vacancies:', e);
          }
        }
      },
      error: (err) => {
        console.warn('Could not fetch vacancies by id:', err);
      },
    });
  }

  private applyLoadedVacancyDetailsToGroups(): void {
    const details = this.loadedVacancyDetails();
    if (!details || details.length === 0) return;

    const groups = this.organizationGroups();
    if (!groups || groups.length === 0) return;

    let hasChanges = false;
    const usedDetailIndices = new Set<number>();

    for (const group of groups) {
      for (const row of group.rows) {
        const matchResult = this.findMatchingVacancyDetail(
          row.organisation_id,
          row.organisation_name,
          row.agniveer_force_autoid,
          row.agniveer_force_type,
          row.gender,
          row.gender_code,
          row.autocategory_id,
          row.category_name,
          row.postAutoId,
          usedDetailIndices,
        );

        if (matchResult) {
          const { detail: match, index } = matchResult;
          usedDetailIndices.add(index);

          const vacNum = Number(match.NoOfVacancies ?? match.no_of_vacancies ?? 0);
          const subId = Number(match.SubVacanciesAutoId ?? match.sub_vacancies_autoid ?? 0);
          row.vacancies = vacNum;
          if (subId > 0) {
            row.sub_vacancies_autoid = subId;
          }
          hasChanges = true;
        }
      }

      if (group.gridApi) {
        group.gridApi.setGridOption('rowData', [...group.rows]);
      }
    }

    if (hasChanges) {
      this.organizationGroups.set([...groups]);
    }
  }

  private findMatchingVacancyDetail(
    orgId: number,
    orgName: string,
    forceAutoid: number,
    forceType: string,
    gender: string,
    genderCode: string,
    catId: number,
    catName: string,
    postAutoId?: string | number,
    usedIndices?: Set<number>,
  ): { detail: any; index: number } | null {
    const details = this.loadedVacancyDetails();
    if (!details || details.length === 0) return null;

    const norm = (s: any) =>
      String(s ?? '')
        .trim()
        .toUpperCase();

    const cleanOrg = (s: any) =>
      norm(s)
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const rOrgClean = cleanOrg(orgName);
    const rOrgName = norm(orgName);
    const rForceName = norm(forceType);
    const rGCode = norm(genderCode || (gender ? gender[0] : ''));
    const rCatName = norm(catName);

    const matchesForce = (d: any) => {
      const dForceId = Number(d.AgniveerForceAutoId ?? d.agniveer_force_autoid ?? 0);
      const dForceName = norm(d.AgniveerForceType ?? d.agniveer_force_type ?? d.Force ?? d.force);
      return (
        (dForceId > 0 && dForceId === forceAutoid) ||
        (dForceName &&
          (dForceName === rForceName ||
            rForceName.includes(dForceName) ||
            dForceName.includes(rForceName)))
      );
    };

    const matchesGender = (d: any) => {
      const dGCode = norm(
        d.GenderCode ??
          d.gender_code ??
          (d.Gender ? d.Gender[0] : '') ??
          (d.gender ? d.gender[0] : ''),
      );
      return Boolean(dGCode && rGCode && (dGCode === rGCode || dGCode[0] === rGCode[0]));
    };

    const matchesCategory = (d: any) => {
      const dCatId = Number(d.AutoCategoryId ?? d.autocategory_id ?? 0);
      const dCatName = norm(d.CategoryName ?? d.category_name);
      return (dCatId > 0 && dCatId === catId) || (dCatName && dCatName === rCatName);
    };

    const matchesPost = (d: any) => {
      if (postAutoId && (d.PostAutoId || d.post_autoid)) {
        const dPostId = String(d.PostAutoId ?? d.post_autoid);
        if (dPostId !== String(postAutoId)) return false;
      }
      return true;
    };

    const getDetailOrgId = (d: any) =>
      Number(
        d.OrganisationId ??
          d.organisation_id ??
          d.organisationId ??
          d.OrganisationID ??
          d.OrganizationId ??
          d.organization_id ??
          d.OrgId ??
          d.org_id ??
          0,
      );

    const getDetailOrgName = (d: any) =>
      norm(
        d.OrganisationName ??
          d.organisation_name ??
          d.organisationName ??
          d.OrganizationName ??
          d.organization_name,
      );

    // Pass 1: Strict Organisation Match (ID match if both > 0; else clean/exact name match)
    for (let i = 0; i < details.length; i++) {
      if (usedIndices && usedIndices.has(i)) continue;
      const d = details[i];

      const dOrgId = getDetailOrgId(d);
      const dOrgName = getDetailOrgName(d);
      const dOrgClean = cleanOrg(dOrgName);

      let orgMatch = false;
      if (dOrgId > 0 && orgId > 0) {
        orgMatch = dOrgId === orgId;
      } else if (dOrgName && rOrgName) {
        orgMatch = dOrgName === rOrgName || (dOrgClean.length > 0 && dOrgClean === rOrgClean);
      }

      if (orgMatch && matchesForce(d) && matchesGender(d) && matchesCategory(d) && matchesPost(d)) {
        return { detail: d, index: i };
      }
    }

    // Pass 2: Name similarity match (only if IDs don't conflict)
    for (let i = 0; i < details.length; i++) {
      if (usedIndices && usedIndices.has(i)) continue;
      const d = details[i];

      const dOrgId = getDetailOrgId(d);
      if (dOrgId > 0 && orgId > 0 && dOrgId !== orgId) continue;

      const dOrgName = getDetailOrgName(d);
      const dOrgClean = cleanOrg(dOrgName);

      let orgMatch = false;
      if (dOrgName && rOrgName) {
        orgMatch =
          dOrgName === rOrgName ||
          (dOrgClean.length > 3 &&
            (rOrgClean.includes(dOrgClean) || dOrgClean.includes(rOrgClean)));
      }

      if (orgMatch && matchesForce(d) && matchesGender(d) && matchesCategory(d) && matchesPost(d)) {
        return { detail: d, index: i };
      }
    }

    // Pass 3: Fallback (if org name in database is generic/blank, IDs do not conflict)
    for (let i = 0; i < details.length; i++) {
      if (usedIndices && usedIndices.has(i)) continue;
      const d = details[i];

      const dOrgId = getDetailOrgId(d);
      if (dOrgId > 0 && orgId > 0 && dOrgId !== orgId) continue;

      if (matchesForce(d) && matchesGender(d) && matchesCategory(d) && matchesPost(d)) {
        return { detail: d, index: i };
      }
    }

    return null;
  }
  private extractForcesFromSchedule(
    data: any,
  ): Array<{ agniveer_force_autoid: number; agniveer_force_type: string }> {
    const seen = new Set<string>();
    const forces: Array<{ agniveer_force_autoid: number; agniveer_force_type: string }> = [];

    const addForce = (name: any, autoid?: any) => {
      if (!name) return;
      const str = typeof name === 'string' ? name.trim() : String(name).trim();
      if (!str) return;

      const upper = str.toUpperCase();
      if (!seen.has(upper)) {
        seen.add(upper);

        let resolvedId = Number(autoid);
        if (!resolvedId || isNaN(resolvedId)) {
          if (upper.includes('ARMY')) resolvedId = 1;
          else if (upper.includes('NAVY')) resolvedId = 2;
          else if (upper.includes('AIR')) resolvedId = 3;
          else resolvedId = forces.length + 1;
        }

        forces.push({
          agniveer_force_autoid: resolvedId,
          agniveer_force_type: str,
        });
      }
    };

    const processItem = (item: any) => {
      if (!item || typeof item !== 'object') return;

      const arr =
        item.Forces ??
        item.forces ??
        item.ForceList ??
        item.force_list ??
        item.Branches ??
        item.branches ??
        item.records ??
        item.Records;

      if (Array.isArray(arr)) {
        arr.forEach((f: any) => {
          if (typeof f === 'string') {
            addForce(f);
          } else if (f && typeof f === 'object') {
            const n =
              f.forceName ||
              f.force_name ||
              f.ForceName ||
              f.name ||
              f.Name ||
              f.force ||
              f.Force ||
              f.branch ||
              f.Branch ||
              f.title ||
              f.Title ||
              f.agniveer_force_type;
            const id = f.agniveer_force_autoid || f.force_autoid || f.id || f.Id;
            if (n) addForce(n, id);
          }
        });
      }

      const single =
        item.force_name ||
        item.forceName ||
        item.ForceName ||
        item.Force ||
        item.force ||
        item.Branch ||
        item.branch ||
        item.agniveer_force_type;
      if (typeof single === 'string' && single.trim()) {
        const id = item.agniveer_force_autoid || item.force_autoid || item.id || item.Id;
        addForce(single, id);
      }

      const isArmy = Boolean(item.IsArmy ?? item.isArmy ?? item.is_army);
      const isNavy = Boolean(item.IsNavy ?? item.isNavy ?? item.is_navy);
      const isAirForce = Boolean(item.IsAirForce ?? item.isAirForce ?? item.is_air_force);

      if (isArmy) {
        addForce('Indian Army', item.army_autoid || 1);
      }
      if (isNavy) {
        addForce('Indian Navy', item.navy_autoid || 2);
      }
      if (isAirForce) {
        addForce('Indian Air Force', item.air_force_autoid || 3);
      }

      Object.keys(item).forEach((key) => {
        const val = item[key];
        if (val === true || val === 1 || val === 'true') {
          const lowerKey = key.toLowerCase();
          if (
            (lowerKey.startsWith('is_') || lowerKey.startsWith('is')) &&
            !['isarmy', 'is_army', 'isnavy', 'is_navy', 'isairforce', 'is_air_force'].includes(
              lowerKey,
            )
          ) {
            const rawName = key.replace(/^is_?/i, '');
            const formatted = rawName
              .replace(/_/g, ' ')
              .replace(/([a-z])([A-Z])/g, '$1 $2')
              .replace(/\b\w/g, (c) => c.toUpperCase())
              .trim();

            if (
              ['army', 'navy', 'air force', 'airforce'].some((f) =>
                formatted.toLowerCase().includes(f),
              )
            ) {
              addForce(
                formatted === 'Airforce'
                  ? 'Indian Air Force'
                  : formatted.startsWith('Indian')
                    ? formatted
                    : `Indian ${formatted}`,
              );
            }
          }
        }
      });
    };

    const topArr =
      data?.Forces ??
      data?.forces ??
      data?.ForceList ??
      data?.force_list ??
      data?.records ??
      data?.Records;
    if (Array.isArray(topArr)) {
      topArr.forEach((f: any) => {
        if (typeof f === 'string') addForce(f);
        else if (f && typeof f === 'object') {
          const n =
            f.forceName || f.force_name || f.name || f.force || f.branch || f.agniveer_force_type;
          const id = f.agniveer_force_autoid || f.force_autoid || f.id || f.Id;
          if (n) addForce(n, id);
        }
      });
    }

    const schedule = data?.Schedule ?? data?.schedule ?? data?.Table ?? data?.Schedules ?? data;

    if (Array.isArray(schedule)) {
      schedule.forEach((s) => processItem(s));
    } else if (schedule && typeof schedule === 'object') {
      processItem(schedule);
    }

    return forces;
  }

  private buildVacancyRows(): void {
    const orgs = this.loadedOrganisations();
    const categories = this.loadedCategoryObjects();
    const forces = this.loadedForceObjects();
    const genders = [
      { gender: 'Male', gender_code: 'M' },
      { gender: 'Female', gender_code: 'F' },
    ];

    if (
      !orgs ||
      orgs.length === 0 ||
      ((!categories || categories.length === 0) && this.orgCategoriesMap.size === 0) ||
      !forces ||
      forces.length === 0
    ) {
      return;
    }

    const currentGroups = this.organizationGroups();
    const newGroups: OrganizationVacancyGroup[] = [];
    const usedDetailIndices = new Set<number>();

    orgs.forEach((org: any, orgIdx: number) => {
      const orgId = Number(org.OrganisationId ?? org.organisation_id ?? org.id ?? orgIdx + 1);
      const orgName = String(
        org.OrganisationName ?? org.organisation_name ?? org.name ?? '',
      ).trim();
      const shortName = String(org.ShortName ?? org.short_name ?? '').trim();
      const displayName =
        shortName && !orgName.toLowerCase().includes(shortName.toLowerCase())
          ? `${orgName} (${shortName})`
          : orgName;

      const posts: any[] = Array.isArray(org.Posts)
        ? org.Posts
        : Array.isArray(org.posts)
          ? org.posts
          : [];

      const rows: VacancyRow[] = [];
      let sr = 1;

      const existingGroup = currentGroups.find(
        (g) =>
          g.id === orgId || g.organizationName === displayName || g.organizationName === orgName,
      );

      const orgCategories =
        this.orgCategoriesMap.get(orgId) || this.orgCategoriesMap.get(orgName) || categories;

      if (!orgCategories || orgCategories.length === 0) {
        if (existingGroup) {
          newGroups.push(existingGroup);
        }
        return;
      }

      for (const force of forces) {
        if (posts.length > 0) {
          for (const post of posts) {
            const postName = String(post.PostName ?? post.post_name ?? post.postName ?? '').trim();
            const postAutoId = post.PostAutoId ?? post.post_autoid ?? post.postAutoId ?? '';

            for (const g of genders) {
              for (const cat of orgCategories) {
                const existingRow = existingGroup?.rows?.find(
                  (r) =>
                    (r.agniveer_force_autoid === force.agniveer_force_autoid ||
                      r.agniveer_force_type.toUpperCase() ===
                        force.agniveer_force_type.toUpperCase() ||
                      r.force.toUpperCase() === force.agniveer_force_type.toUpperCase()) &&
                    (postAutoId ? r.postAutoId === postAutoId : r.postName === postName) &&
                    (r.gender === g.gender || r.gender_code === g.gender_code) &&
                    (r.autocategory_id === cat.autocategory_id ||
                      r.category_name.toUpperCase() === cat.category_name.toUpperCase() ||
                      r.category.toUpperCase() === cat.category_name.toUpperCase()),
                );

                const matchResult = this.findMatchingVacancyDetail(
                  orgId,
                  orgName,
                  force.agniveer_force_autoid,
                  force.agniveer_force_type,
                  g.gender,
                  g.gender_code,
                  cat.autocategory_id,
                  cat.category_name,
                  postAutoId,
                  usedDetailIndices,
                );

                if (matchResult) {
                  usedDetailIndices.add(matchResult.index);
                }

                const matchingDetail = matchResult?.detail;
                const detailVacancies = matchingDetail
                  ? Number(matchingDetail.NoOfVacancies ?? matchingDetail.no_of_vacancies ?? 0)
                  : undefined;
                const existingVacancies = existingRow ? existingRow.vacancies : undefined;
                const initialVacancies =
                  existingVacancies !== undefined && existingVacancies > 0
                    ? existingVacancies
                    : detailVacancies !== undefined
                      ? detailVacancies
                      : 0;

                const detailSubId = Number(
                  matchingDetail?.SubVacanciesAutoId ?? matchingDetail?.sub_vacancies_autoid ?? 0,
                );
                const existingSubId = Number(existingRow?.sub_vacancies_autoid ?? 0);
                const initialSubVacanciesAutoId =
                  detailSubId > 0 ? detailSubId : existingSubId > 0 ? existingSubId : 0;

                rows.push({
                  srNo: sr++,
                  sub_vacancies_autoid: initialSubVacanciesAutoId,
                  organization: orgName,
                  organisation_name: orgName,
                  organisation_id: orgId,
                  force: force.agniveer_force_type,
                  agniveer_force_type: force.agniveer_force_type,
                  agniveer_force_autoid: force.agniveer_force_autoid,
                  gender: g.gender,
                  gender_code: g.gender_code,
                  category: cat.category_name,
                  category_name: cat.category_name,
                  autocategory_id: cat.autocategory_id,
                  vacancies: initialVacancies,
                  postAutoId: postAutoId,
                  postName: postName,
                  organisationId: orgId,
                });
              }
            }
          }
        } else {
          for (const g of genders) {
            for (const cat of orgCategories) {
              const existingRow = existingGroup?.rows?.find(
                (r) =>
                  (r.agniveer_force_autoid === force.agniveer_force_autoid ||
                    r.agniveer_force_type.toUpperCase() ===
                      force.agniveer_force_type.toUpperCase() ||
                    r.force.toUpperCase() === force.agniveer_force_type.toUpperCase()) &&
                  (r.gender === g.gender || r.gender_code === g.gender_code) &&
                  (r.autocategory_id === cat.autocategory_id ||
                    r.category_name.toUpperCase() === cat.category_name.toUpperCase() ||
                    r.category.toUpperCase() === cat.category_name.toUpperCase()),
              );

              const matchResult = this.findMatchingVacancyDetail(
                orgId,
                orgName,
                force.agniveer_force_autoid,
                force.agniveer_force_type,
                g.gender,
                g.gender_code,
                cat.autocategory_id,
                cat.category_name,
                undefined,
                usedDetailIndices,
              );

              if (matchResult) {
                usedDetailIndices.add(matchResult.index);
              }

              const matchingDetail = matchResult?.detail;
              const detailVacancies = matchingDetail
                ? Number(matchingDetail.NoOfVacancies ?? matchingDetail.no_of_vacancies ?? 0)
                : undefined;
              const existingVacancies = existingRow ? existingRow.vacancies : undefined;
              const initialVacancies =
                existingVacancies !== undefined && existingVacancies > 0
                  ? existingVacancies
                  : detailVacancies !== undefined
                    ? detailVacancies
                    : 0;

              const detailSubId = Number(
                matchingDetail?.SubVacanciesAutoId ?? matchingDetail?.sub_vacancies_autoid ?? 0,
              );
              const existingSubId = Number(existingRow?.sub_vacancies_autoid ?? 0);
              const initialSubVacanciesAutoId =
                detailSubId > 0 ? detailSubId : existingSubId > 0 ? existingSubId : 0;

              rows.push({
                srNo: sr++,
                sub_vacancies_autoid: initialSubVacanciesAutoId,
                organization: orgName,
                organisation_name: orgName,
                organisation_id: orgId,
                force: force.agniveer_force_type,
                agniveer_force_type: force.agniveer_force_type,
                agniveer_force_autoid: force.agniveer_force_autoid,
                gender: g.gender,
                gender_code: g.gender_code,
                category: cat.category_name,
                category_name: cat.category_name,
                autocategory_id: cat.autocategory_id,
                vacancies: initialVacancies,
                organisationId: orgId,
              });
            }
          }
        }
      }

      const isExpanded = existingGroup ? existingGroup.isExpanded : true;

      if (existingGroup?.gridApi) {
        existingGroup.gridApi.setGridOption('rowData', rows);
      }

      newGroups.push({
        id: orgId,
        organizationName: displayName,
        isExpanded: isExpanded,
        gridApi: existingGroup?.gridApi,
        rows: rows,
      });
    });

    this.organizationGroups.set(newGroups);
  }

  onGridReady(event: GridReadyEvent<VacancyRow>, group: OrganizationVacancyGroup): void {
    group.gridApi = event.api;
    if (this.loadedVacancyDetails().length > 0) {
      event.api.setGridOption('rowData', [...group.rows]);
    }
    setTimeout(() => {
      event.api.sizeColumnsToFit();
    }, 100);
  }

  onSearchChange(filterText: string): void {
    this.searchFilter.set(filterText);
    const groups = this.organizationGroups();
    for (const g of groups) {
      if (g.gridApi) {
        g.gridApi.setGridOption('quickFilterText', filterText.trim());
      }
    }
  }

  toggleGroup(group: OrganizationVacancyGroup): void {
    group.isExpanded = !group.isExpanded;
    if (group.isExpanded && group.gridApi) {
      setTimeout(() => {
        group.gridApi?.sizeColumnsToFit();
      }, 50);
    }
  }

  onGridContainerInput(event: Event, group: OrganizationVacancyGroup): void {
    if (this.isVacancyAdded()) return;

    const target = event.target as HTMLInputElement;
    if (target && target.classList.contains('vacancy-number-input')) {
      const sr = Number(target.getAttribute('data-sr'));

      // If user typed or pasted negative sign or exponential characters, strip them immediately
      if (
        target.value.includes('-') ||
        target.value.includes('+') ||
        target.value.includes('e') ||
        target.value.includes('E')
      ) {
        target.value = target.value.replace(/[^0-9]/g, '');
      }

      if (target.value !== '' && Number(target.value) < 0) {
        target.value = '0';
      }

      const val = target.value === '' ? 0 : Math.max(0, parseInt(target.value, 10) || 0);
      const row = group.rows.find((r) => r.srNo === sr);
      if (row) {
        row.vacancies = val;
      }
    }
  }

  onGridContainerChange(event: Event, group: OrganizationVacancyGroup): void {
    if (this.isVacancyAdded()) return;

    const target = event.target as HTMLInputElement;
    if (target && target.classList.contains('vacancy-number-input')) {
      const sr = Number(target.getAttribute('data-sr'));
      const val = Math.max(0, parseInt(target.value, 10) || 0);
      target.value = val.toString();
      const row = group.rows.find((r) => r.srNo === sr);
      if (row) {
        row.vacancies = val;
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/notifications']);
  }

  saveVacancies(isDraft: boolean = false): void {
    if (this.isVacancyAdded()) {
      Swal.fire({
        icon: 'info',
        title: 'Already Saved',
        text: 'Vacancies for this notification have already been finalized and cannot be modified.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    const orgGroups = this.organizationGroups();

    // Ensure any currently active input in the DOM is synced to row data
    if (typeof document !== 'undefined') {
      const inputs = document.querySelectorAll<HTMLInputElement>('.vacancy-number-input');
      inputs.forEach((input) => {
        const sr = Number(input.getAttribute('data-sr'));
        if (!isNaN(sr)) {
          const val = Math.max(0, parseInt(input.value, 10) || 0);
          for (const group of orgGroups) {
            const row = group.rows.find((r) => r.srNo === sr);
            if (row) {
              row.vacancies = val;
            }
          }
        }
      });
    }

    const allRows: VacancyRow[] = orgGroups.flatMap((g) => g.rows);

    if (allRows.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Vacancies to Save',
        text: 'There are no vacancy rows available to save.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    // 1. Check if all vacancies across all organisations are 0
    const totalVacancies = allRows.reduce(
      (sum, r) => sum + (Math.max(0, Number(r.vacancies)) || 0),
      0,
    );

    if (totalVacancies === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Vacancies Required',
        text: 'All vacancy counts are 0. Please enter at least one vacancy count greater than 0 before saving.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    // 2. If multiple organisations exist, check that each organisation has at least 1 object with vacancies > 0
    if (orgGroups.length > 1) {
      const emptyOrgs = orgGroups.filter(
        (group) =>
          group.rows.length > 0 &&
          !group.rows.some((row) => (Math.max(0, Number(row.vacancies)) || 0) > 0),
      );

      if (emptyOrgs.length > 0) {
        // Automatically expand the first organisation that has all 0 vacancies
        emptyOrgs[0].isExpanded = true;
        if (emptyOrgs[0].gridApi) {
          setTimeout(() => {
            emptyOrgs[0].gridApi?.sizeColumnsToFit();
          }, 50);
        }

        const orgNames = emptyOrgs.map((g) => `"${g.organizationName}"`).join(', ');
        Swal.fire({
          icon: 'warning',
          title: 'Vacancies Required for Each Organisation',
          text: `In each organisation, at least 1 vacancy must be filled (greater than 0). The following organisation(s) have all 0 vacancies: ${orgNames}.`,
          confirmButtonColor: '#355f2d',
        });
        return;
      }
    }

    if (!isDraft) {
      Swal.fire({
        title: 'Save Vacancies?',
        text: 'Are you sure you want to save the vacancies? Once saved, you will not be able to modify or change them later.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#355f2d',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, Save it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          this.executeSaveVacancies(allRows, false);
        }
      });
      return;
    }

    this.executeSaveVacancies(allRows, true);
  }

  private executeSaveVacancies(allRows: VacancyRow[], isDraft: boolean): void {
    if (isDraft) {
      this.isSavingDraft.set(true);
    } else {
      this.isSaving.set(true);
    }

    const roundVal = this.activeScheduleRound() ?? null;

    const vacancies = allRows.map((r) => ({
      sub_vacancies_autoid: r.sub_vacancies_autoid,
      organisation_name: r.organisation_name || r.organization,
      organisation_id: r.organisation_id,
      agniveer_force_type: r.agniveer_force_type || r.force,
      agniveer_force_autoid: r.agniveer_force_autoid,
      gender: r.gender,
      gender_code: r.gender_code,
      category_name: r.category_name || r.category,
      autocategory_id: r.autocategory_id,
      no_of_vacancies: Math.max(0, Number(r.vacancies)),
      // round: roundVal,
    }));

    const payload = {
      vacancies_autoid: this.vacanciesAutoId(),
      job_notification_autoid: this.jobNotificationAutoId(),
      advertisement_number: this.advertisementNo(),
      is_vacancy_added: isDraft ? false : true,
      round: roundVal,
      vacancies: vacancies,
    };
    // return console.log(payload, 'payulaod');

    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.jobNotificationService.AddVacancies(encryptedPayload).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        this.isSavingDraft.set(false);
        let dec: any = res;
        if (res?.data) {
          try {
            const rawDecrypted = CryptoHelper.decrypt(res.data);
            dec = typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
          } catch {
            dec = res?.data;
          }
        }
        // console.log('[VacancyesComponent] AddVacancies response:', res, dec);

        if (
          res?.code === 1 ||
          res?.status === true ||
          res?.success === true ||
          dec?.code === 1 ||
          dec?.status === true
        ) {
          if (!isDraft) {
            this.setVacancyAdded(true);
          }
          Swal.fire({
            icon: 'success',
            title: isDraft ? 'Draft Saved!' : 'Vacancies Saved!',
            text:
              res?.message ||
              dec?.message ||
              (isDraft
                ? 'Vacancy draft details have been successfully saved.'
                : 'Vacancy details have been successfully saved.'),
            confirmButtonColor: '#355f2d',
          }).then(() => {
            this.goBack();
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: isDraft ? 'Failed to Save Draft' : 'Failed to Save',
            text:
              res?.message ||
              dec?.message ||
              (isDraft ? 'Failed to save draft vacancies.' : 'Failed to save vacancies.'),
            confirmButtonColor: '#355f2d',
          });
        }
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.isSavingDraft.set(false);
        console.error('[VacancyesComponent] Error calling AddVacancies:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: isDraft
            ? 'Something went wrong while saving draft vacancies.'
            : 'Something went wrong while saving vacancies.',
          confirmButtonColor: '#355f2d',
        });
      },
    });
  }
}
