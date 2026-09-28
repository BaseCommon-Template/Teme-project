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
import { environment } from '../../../../environments/environment';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface VacancyRow {
  srNo: number;
  sub_vacancies_autoid?: number;
  postName: string;
  organization: string;
  organisation_name: string;
  organisation_id: number;
  force: string;
  agniveer_force_type: string;
  agniveer_force_autoid: number;
  gender: string;
  gender_code: string;
  category: string;
  category_name: string;
  autocategory_id: number;
  vacancies: number;
  postAutoId?: string | number;
}

export interface PostInfo {
  postAutoId: string;
  postName: string;
  postCode?: string;
  gridApi?: GridApi<VacancyRow>;
  rows?: VacancyRow[];
}

export interface OrganizationVacancyGroup {
  id: number;
  organizationName: string;
  shortName?: string;
  isExpanded: boolean;
  posts: PostInfo[];
  hasVacancyDetails?: boolean;
}

@Component({
  selector: 'app-view-notification-details',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  templateUrl: './view-notification-details.html',
  styleUrl: './view-notification-details.css',
})
export class ViewNotificationDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jobNotificationService = inject(JobNotificationService);
  private readonly scheduleService = inject(ScheduleService);

  readonly decryptedNotificationId = signal<string>('');
  readonly jobNotificationAutoId = signal<number>(0);
  readonly advertisementNo = signal<string>('');
  readonly notificationTitle = signal<string>('');
  readonly description = signal<string>('');
  readonly documentUrl = signal<string>('');
  readonly isVacancyAdded = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);

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
  readonly organizationGroups = signal<OrganizationVacancyGroup[]>([]);

  // AG Grid Configuration
  rowHeight = 38;
  headerHeight = 34;

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
      width: 85,
      minWidth: 75,
      maxWidth: 95,
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
      headerName: 'POST NAME',
      field: 'postName',
      minWidth: 170,
      flex: 1.3,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#0f172a',
        fontWeight: '600',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'ORGANIZATION',
      field: 'organization',
      minWidth: 180,
      flex: 1.2,
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '12px',
        color: '#334155',
        fontWeight: '500',
        fontFamily: "'Poppins', sans-serif",
      },
    },
    {
      headerName: 'FORCE',
      field: 'force',
      minWidth: 140,
      flex: 1,
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
      minWidth: 100,
      flex: 0.8,
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
      minWidth: 110,
      flex: 0.9,
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
            padding: 3px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.2;
            background: ${bg};
            color: ${text};
            border: 1px solid ${border};
            font-family: 'Poppins', sans-serif;
          ">
            ${params.value || '-'}
          </span>
        `;
      },
    },
    {
      headerName: 'VACANCIES',
      field: 'vacancies',
      minWidth: 120,
      flex: 0.9,
      sortable: true,
      filter: false,
      resizable: false,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      cellRenderer: (params: ICellRendererParams<VacancyRow>) => {
        const val = Math.max(0, Number(params.value ?? 0) || 0);
        return `<span style="font-weight: 700; color: #0f172a; font-size: 13px; font-family: 'Poppins', sans-serif;">${val}</span>`;
      },
    },
  ];

  ngOnInit(): void {
    const decryptedId = this.extractAndDecryptId();
    this.loadNotificationDetails();
    this.loadNotificationDetailsById(decryptedId);
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
        } else {
          encrypted = raw.split('&')[0];
        }
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
        const num = Number(decryptedId);
        if (!isNaN(num) && num > 0) {
          this.jobNotificationAutoId.set(num);
        }
        return decryptedId;
      } catch (err) {
        console.error('[ViewNotificationDetails] Failed to decrypt ID:', err);
      }
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
        } catch { }
      }
    }
  }

  private applyNotificationInfo(notif: any): void {
    if (!notif) return;

    const advt =
      notif.advtNo ||
      notif.advertisement_number ||
      notif.AdvertisementNumber ||
      notif.advertisementNo;
    if (advt) this.advertisementNo.set(advt);

    const title = notif.title || notif.notification_title || notif.NotificationTitle;
    if (title) this.notificationTitle.set(title);

    const desc =
      notif.description ??
      notif.Description ??
      notif.notification_description ??
      notif.NotificationDescription ??
      '';
    if (desc) this.description.set(desc);

    const docUrl =
      notif.AttachmentPath ??
      notif.NotificationDocumentFilePath ??
      notif.notification_document ??
      notif.NotificationDocument ??
      notif.document_url ??
      notif.DocumentUrl ??
      notif.file_path ??
      notif.FilePath ??
      notif.pdf_path ??
      notif.job_link_url ??
      notif.url ??
      '';
    if (docUrl) this.documentUrl.set(docUrl);

    const isVacAdded = Boolean(
      notif.IsVacancyAdded ??
      notif.is_vacancy_added ??
      notif.isVacancyAdded ??
      false,
    );
    this.isVacancyAdded.set(isVacAdded);

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
  }

  viewDocument(): void {
    const doc = this.documentUrl();
    if (!doc) {
      Swal.fire({
        icon: 'info',
        title: 'No Document Uploaded',
        text: 'No notification document was uploaded for this opening.',
        confirmButtonColor: '#205493',
      });
      return;
    }

    let fullUrl = doc;
    if (!doc.startsWith('http://') && !doc.startsWith('https://')) {
      const base = environment.apiUrl.replace(/\/api\/?$/, '/');
      fullUrl = base + (doc.startsWith('/') ? doc.slice(1) : doc);
    }

    window.open(fullUrl, '_blank');
  }

  private loadNotificationDetailsById(notificationId?: any): void {
    const rawId = notificationId || this.decryptedNotificationId();
    const num = Number(rawId);
    const autoid = !isNaN(num) && num > 0 ? num : rawId;

    if (!autoid) {
      this.isLoading.set(false);
      return;
    }

    const payload = { job_notification_autoid: autoid };
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.jobNotificationService.getJobNotificationById(encryptedPayload).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res?.code || res?.data) {
          let dec: any = null;
          try {
            const rawDecrypted = CryptoHelper.decrypt(res?.data);
            dec = typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
          } catch (e) {
            dec = res?.data;
          }

          const notif = dec?.JobNotification || dec?.jobNotification || dec;
          if (notif) {
            this.applyNotificationInfo(notif);

            const rawOrgs = notif.Organisations || notif.organisations || [];
            if (Array.isArray(rawOrgs) && rawOrgs.length > 0) {
              this.loadedOrganisations.set(rawOrgs);
              this.buildVacancyRows();
            }
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('[ViewNotificationDetails] Failed to load notification by id:', err);
      },
    });
  }

  loadVacanciesById(): void {
    const notifId = this.jobNotificationAutoId() || Number(this.extractAndDecryptId());
    if (!notifId) return;

    const payload = { job_notification_autoid: notifId };
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.jobNotificationService.GetvacanciesbyJobNotificationAutoid(encryptedPayload).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        if (res?.code) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const parsed = typeof dec === 'string' ? JSON.parse(dec) : dec;
            const vacanciesData = parsed?.Vacancies ?? parsed?.vacancies ?? parsed;

            if (vacanciesData) {
              const advt =
                vacanciesData.AdvertisementNumber ?? vacanciesData.advertisement_number;
              if (advt && !this.advertisementNo()) {
                this.advertisementNo.set(advt);
              }

              const details =
                vacanciesData.VacancyDetails ?? vacanciesData.vacancy_details ?? [];
              if (Array.isArray(details) && details.length > 0) {
                this.loadedVacancyDetails.set(details);
                if (this.isVacancyAdded()) {
                  this.applyLoadedVacancyDetailsToGroups();
                }
              }
            }
          } catch (e) {
            console.error('Error decrypting vacancies:', e);
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.warn('Could not fetch vacancies by id:', err);
      },
    });
  }

  private buildVacancyRows(): void {
    const details = this.loadedVacancyDetails();
    const orgs = this.loadedOrganisations();

    // If IsVacancyAdded is true and actual details exist:
    if (this.isVacancyAdded() && Array.isArray(details) && details.length > 0) {
      this.buildVacancyRowsFromDetails(details);
      return;
    }

    if (!Array.isArray(orgs) || orgs.length === 0) return;

    const groups: OrganizationVacancyGroup[] = [];

    orgs.forEach((org: any, gIdx: number) => {
      const orgId = Number(
        org.OrganisationId ?? org.organisation_id ?? org.id ?? gIdx + 1,
      );
      const orgName = String(
        org.OrganisationName ?? org.organisation_name ?? org.name ?? `Organization ${gIdx + 1}`,
      );
      const shortName = String(org.ShortName ?? org.short_name ?? '');

      const postsRaw = org.Posts || org.posts || org.post_list || [];
      const postList: PostInfo[] = [];

      if (Array.isArray(postsRaw) && postsRaw.length > 0) {
        postsRaw.forEach((p: any) => {
          if (typeof p === 'string') {
            postList.push({ postAutoId: '1', postName: p });
          } else if (p && typeof p === 'object') {
            const pName = String(
              p.PostName ?? p.post_name ?? p.name ?? p.PostTitle ?? p.post_title ?? '',
            ).trim();
            const pId = String(p.PostAutoId ?? p.post_autoid ?? p.id ?? '1');
            const pCode = String(p.PostCode ?? p.post_code ?? '');
            if (pName) {
              postList.push({ postAutoId: pId, postName: pName, postCode: pCode });
            }
          }
        });
      }

      groups.push({
        id: orgId || gIdx + 1,
        organizationName: orgName,
        shortName: shortName,
        isExpanded: true,
        posts: postList,
        hasVacancyDetails: false,
      });
    });

    this.organizationGroups.set(groups);
  }

  private buildVacancyRowsFromDetails(details: any[]): void {
    const orgMap = new Map<string, Map<string, VacancyRow[]>>();

    details.forEach((d: any) => {
      const orgName = String(
        d.OrganisationName ?? d.organisation_name ?? d.Organisation ?? d.organisation ?? 'Organization',
      ).trim();

      const orgId = Number(d.OrganisationId ?? d.organisation_id ?? 1);
      const postTitle = String(
        d.PostName ?? d.post_name ?? d.PostTitle ?? d.post_title ?? d.PostMasterName ?? d.Post ?? d.post ?? 'General Post',
      ).trim();

      const forceTitle = String(
        d.AgniveerForceType ?? d.agniveer_force_type ?? d.Force ?? d.force ?? 'General',
      ).trim();

      const genderRaw = String(d.Gender ?? d.gender ?? d.GenderCode ?? d.gender_code ?? 'Male').trim();
      const gender = genderRaw.toUpperCase().startsWith('M') ? 'Male' : genderRaw.toUpperCase().startsWith('F') ? 'Female' : genderRaw;

      const category = String(d.CategoryName ?? d.category_name ?? d.Category ?? d.category ?? 'UR').trim();
      const vacNum = Number(d.NoOfVacancies ?? d.no_of_vacancies ?? d.Vacancies ?? d.vacancies ?? 0);

      if (!orgMap.has(orgName)) {
        orgMap.set(orgName, new Map<string, VacancyRow[]>());
      }

      const postMap = orgMap.get(orgName)!;
      if (!postMap.has(postTitle)) {
        postMap.set(postTitle, []);
      }

      const rows = postMap.get(postTitle)!;
      rows.push({
        srNo: rows.length + 1,
        postName: postTitle,
        organization: orgName,
        organisation_name: orgName,
        organisation_id: orgId,
        force: forceTitle,
        agniveer_force_type: forceTitle,
        agniveer_force_autoid: Number(d.AgniveerForceAutoId ?? d.agniveer_force_autoid ?? 1),
        gender: gender,
        gender_code: gender === 'Male' ? 'M' : 'F',
        category: category,
        category_name: category,
        autocategory_id: Number(d.AutoCategoryId ?? d.autocategory_id ?? 1),
        vacancies: vacNum,
      });
    });

    const groups: OrganizationVacancyGroup[] = [];
    let gIdx = 1;

    orgMap.forEach((postMap, orgName) => {
      const postList: PostInfo[] = [];
      let firstOrgId = 1;

      postMap.forEach((rows, postTitle) => {
        if (rows.length > 0 && rows[0].organisation_id) {
          firstOrgId = rows[0].organisation_id;
        }
        postList.push({
          postAutoId: String(rows[0]?.postAutoId || '1'),
          postName: postTitle,
          rows: rows,
        });
      });

      groups.push({
        id: firstOrgId || gIdx++,
        organizationName: orgName,
        isExpanded: true,
        posts: postList,
        hasVacancyDetails: true,
      });
    });

    this.organizationGroups.set(groups);
  }

  private applyLoadedVacancyDetailsToGroups(): void {
    if (!this.isVacancyAdded()) return;
    const details = this.loadedVacancyDetails();
    if (!details || details.length === 0) return;

    this.buildVacancyRowsFromDetails(details);
  }

  onGridReady(event: GridReadyEvent<VacancyRow>, postInfo: PostInfo): void {
    postInfo.gridApi = event.api;
    setTimeout(() => event.api.sizeColumnsToFit(), 50);
  }

  toggleGroup(group: OrganizationVacancyGroup): void {
    group.isExpanded = !group.isExpanded;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/notifications']);
  }
}
