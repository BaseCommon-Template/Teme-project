import {
  Component,
  OnInit,
  DoCheck,
  inject,
  signal,
  effect,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { JobNotificationService } from '../../../services/notification/notification';
import { PostMasterService } from '../../../services/post-master.service';
import { OrganisationService } from '../../../services/organisation.service';
import { ScheduleService } from '../../../services/schedule/schedule';
import { AgniveerUploadService } from '../../../services/agniveer-upload/agniveer-upload';
import { AuthService } from '../../../services/auth';
import { CryptoHelper } from '../../../helpers/crypto-helper';

export interface PostOptionItem {
  post_autoid: string;
  post_name: string;
  post_code: string;
}

export interface PostRow {
  id: string;
  postName: string;
  post_autoid: string;
  post_code: string;
}

export interface VacancyGroup {
  id: string;
  selectedOrgTypeId?: number | null;
  selectedOrgId: number | null;
  organizationName: string;
  shortName: string;
  orgTypeId: number | null;
  displayName: string;
  hq_state_id?: number | null;
  hq_state?: string | null;
  isCollapsed: boolean;
  isLoadingPosts: boolean;
  hasNoPosts: boolean;
  noPostsMessage?: string;
  availablePosts: PostOptionItem[];
  availableOrganisations?: OrganisationObj[];
  posts: PostRow[];
}

export interface OrganisationTypeObj {
  organisation_type_id: number;
  organisation_type: string;
  short_name?: string;
  organisations?: OrganisationObj[];
}

export interface OrganisationObj {
  organisation_id: number;
  organisation_name: string;
  short_name: string;
  organisation_type_id: number;
  organisation_type: string;
  displayName: string;
  hq_state_id?: number | null;
  hq_state?: string | null;
}

@Component({
  selector: 'app-create-job-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-job-notification.html',
  styleUrl: './create-job-notification.css',
})
export class CreateJobNotificationComponent implements OnInit, DoCheck {
  private readonly router = inject(Router);
  private readonly jobNotificationService = inject(JobNotificationService);
  private readonly postMasterService = inject(PostMasterService);
  private readonly organisationService = inject(OrganisationService);
  private readonly authService = inject(AuthService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly agniveerUploadService = inject(AgniveerUploadService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  readonly isSubmitting = signal<boolean>(false);
  readonly activeScheduleRound = signal<number | string | null>(null);
  readonly activeScheduleId = signal<number | string | null>(null);
  readonly notificationOpenForAllState = signal<boolean>(false);
  readonly selectedFile = signal<File | null>(null);
  readonly selectedFileName = signal<string>('');
  readonly isUploadingDocument = signal<boolean>(false);
  readonly uploadedAttachmentPath = signal<string>('');

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // Form Data
  advertisementNo = '';
  notificationTitle = '';
  description = '';
  selectedOrgTypeId: number | null = null;
  organisationsList: OrganisationObj[] = [];
  organisationTypesList: OrganisationTypeObj[] = [];
  vacancyGroups: VacancyGroup[] = [];

  private lastRoleKey = '';

  constructor() {
    effect(() => {
      this.authService.authVersion();
      const roleInfo = this.userRoleInfo;
      const roleKey = `${roleInfo.activeRoleId}_${roleInfo.isCapfNodal}_${roleInfo.isOrgNodal}`;
      if (this.lastRoleKey !== roleKey) {
        this.lastRoleKey = roleKey;
        this.syncRoleState();
      }
    });
  }

  get isRole13(): boolean {
    const activeId = Number(this.authService.getRoleId() || this.userRoleInfo.activeRoleId || 0);
    if (activeId === 13) return true;
    const currentUser = this.authService.getCurrentUser() || {};
    if (Number(currentUser.roleId || currentUser.role_id || currentUser.roleIdNum) === 13) {
      return true;
    }
    const roles = this.authService.getRoles() || currentUser.roles || [];
    return (
      Array.isArray(roles) &&
      roles.some((r: any) => {
        const id =
          typeof r === 'object' && r !== null
            ? Number(r.roleId ?? r.roleid ?? r.role_id ?? r.id ?? 0)
            : Number(r);
        return id === 13;
      })
    );
  }

  get isCapfNodalOfficer(): boolean {
    return this.userRoleInfo.isCapfNodal;
  }

  get isOrgNodalOfficer(): boolean {
    return this.userRoleInfo.isOrgNodal;
  }

  get userRoleInfo() {
    this.authService.authVersion();
    const user = this.authService.getCurrentUser() || {};
    const activeRoleId = Number(this.authService.getRoleId() || 0);

    const rolesList: Array<{ roleId: number; roleName: string }> = [];
    const rawUserRoles = user.roles || user.rols || this.authService.getRoles() || [];

    if (Array.isArray(rawUserRoles)) {
      rawUserRoles.forEach((r: any) => {
        if (typeof r === 'object' && r !== null) {
          const id = Number(r.roleId ?? r.roleid ?? r.role_id ?? r.id ?? 0);
          const name = String(r.roleName ?? r.rolename ?? r.role_name ?? r.name ?? '');
          if (id > 0 && name && !rolesList.some((item) => item.roleId === id)) {
            rolesList.push({ roleId: id, roleName: name });
          }
        }
      });

      if (rolesList.length === 0) {
        let lastId: number | null = null;
        rawUserRoles.forEach((r: any) => {
          if (
            typeof r === 'number' ||
            (typeof r === 'string' && !isNaN(Number(r)) && Number(r) > 0)
          ) {
            lastId = Number(r);
          } else if (typeof r === 'string' && lastId !== null) {
            if (!rolesList.some((item) => item.roleId === lastId)) {
              rolesList.push({ roleId: lastId, roleName: r });
            }
            lastId = null;
          }
        });
      }
    }

    const matchedRole = rolesList.find((r) => r.roleId === activeRoleId);
    const matchedRoleName =
      matchedRole?.roleName || user.roleName || user.rolename || user.designation || '';
    const roleNameLower = matchedRoleName.toLowerCase();

    let isCapfNodal = false;
    let isOrgNodal = false;

    if (roleNameLower.includes('capf')) {
      isCapfNodal = true;
    } else if (
      roleNameLower.includes('organization nodal') ||
      roleNameLower.includes('organisation nodal') ||
      roleNameLower.includes('org nodal')
    ) {
      isOrgNodal = true;
    } else if (activeRoleId === 2 || activeRoleId === 14) {
      isCapfNodal = true;
    } else if (activeRoleId === 4 || activeRoleId === 12) {
      isOrgNodal = true;
    }

    const userOrgId = Number(
      user.organisation?.organisation_id || user.organisation_id || user.organisationId || 1,
    );

    const userOrgName = String(
      user.organisation?.organisation_name || user.organisation_name || user.organisationName,
    );

    const userOrgTypeId = Number(
      user.organisation_type?.organisation_type_id ||
        user.organisation_type_id ||
        user.organisationTypeId,
    );

    return {
      activeRoleId,
      matchedRoleName,
      roleNameLower,
      isCapfNodal,
      isOrgNodal,
      userOrgId,
      userOrgName,
      userOrgTypeId,
    };
  }

  ngOnInit(): void {
    this.syncRoleState();
    this.loadActiveSchedule();
  }

  loadActiveSchedule(): void {
    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.scheduleService.getActiveSchedule(encryptedPayload).subscribe({
      next: (res: any) => {
        if (res?.data) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const data = typeof dec === 'string' ? JSON.parse(dec) : dec;
            const schedule =
              data?.Schedule ?? data?.schedule ?? data?.Table ?? data?.Schedules ?? data;
            const activeItem = Array.isArray(schedule) ? schedule[0] : schedule;
            const notificationOpenForAllState =
              activeItem?.notification_open_for_all_state ??
              activeItem?.notificationOpenForAllState ??
              activeItem?.NotificationOpenForAllState ??
              false;

            this.notificationOpenForAllState.set(
              notificationOpenForAllState === true ||
                notificationOpenForAllState === 'true' ||
                notificationOpenForAllState === 1 ||
                notificationOpenForAllState === '1',
            );
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

            const scheduleIdVal =
              activeItem?.schedule_autoid ??
              activeItem?.ScheduleAutoId ??
              activeItem?.Schedule_AutoId ??
              activeItem?.schedule_id ??
              activeItem?.ScheduleId ??
              activeItem?.id ??
              activeItem?.Id ??
              data?.schedule_autoid ??
              data?.ScheduleAutoId ??
              null;
            if (scheduleIdVal !== undefined && scheduleIdVal !== null) {
              this.activeScheduleId.set(scheduleIdVal);
            }
          } catch (e) {
            console.error('[CreateJobNotificationComponent] Error parsing active schedule:', e);
          }
        }
      },
      error: (err) => {
        console.warn('[CreateJobNotificationComponent] Could not fetch active schedule:', err);
      },
    });
  }

  ngDoCheck(): void {
    const roleInfo = this.userRoleInfo;
    const roleKey = `${roleInfo.activeRoleId}_${roleInfo.isCapfNodal}_${roleInfo.isOrgNodal}`;
    if (this.lastRoleKey !== roleKey) {
      this.lastRoleKey = roleKey;
      this.syncRoleState();
    }
  }

  syncRoleState(): void {
    const roleInfo = this.userRoleInfo;
    this.loadOrganisations();

    if (roleInfo.isCapfNodal) {
      this.selectedOrgTypeId = roleInfo.userOrgTypeId!;
      const autoGroup: VacancyGroup = {
        id: 'group_capf_' + Date.now(),
        selectedOrgTypeId: this.selectedOrgTypeId,
        selectedOrgId: roleInfo.userOrgId,
        organizationName: roleInfo.userOrgName,
        shortName: '',
        orgTypeId: roleInfo.userOrgTypeId,
        displayName: roleInfo.userOrgName,
        isCollapsed: false,
        isLoadingPosts: false,
        hasNoPosts: false,
        noPostsMessage: '',
        availablePosts: [],
        posts: [],
      };
      this.vacancyGroups = [autoGroup];
      this.loadCapfOrganisationDetails(autoGroup, roleInfo.userOrgTypeId, roleInfo.userOrgId);
      this.onOrganizationChange(autoGroup, roleInfo.userOrgId);
    } else {
      this.selectedOrgTypeId = null;
      if (
        this.vacancyGroups.length === 0 ||
        this.vacancyGroups.some((g) => g.id.startsWith('group_capf_'))
      ) {
        this.vacancyGroups = [];
        this.addVacancyGroup();
      }
    }
    this.cdr.detectChanges();
  }

  private loadCapfOrganisationDetails(
    autoGroup: VacancyGroup,
    orgTypeId: number,
    orgId: number,
  ): void {
    this.organisationService.getOrganisation(orgTypeId, orgId).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          let data: any = res?.decryptedData ?? res;
          const cipher = typeof res === 'string' ? res : res?.data;
          if (cipher && typeof cipher === 'string') {
            try {
              const decrypted = CryptoHelper.decrypt(cipher);
              data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;

              // console.log(data, 'datadeta2');
            } catch (e) {}
          }

          const orgObj =
            data?.Organisation ||
            data?.organisation ||
            data?.data ||
            (typeof data === 'object' ? data : null);

          if (orgObj) {
            const orgName =
              orgObj.OrganisationName ||
              orgObj.organisation_name ||
              orgObj.name ||
              autoGroup.organizationName;
            const shortName = orgObj.ShortName || orgObj.short_name || orgObj.shortName || '';
            const displayName = shortName ? `${orgName} (${shortName})` : orgName;

            autoGroup.organizationName = orgName;
            autoGroup.shortName = shortName;
            autoGroup.displayName = displayName;

            const hqStateId =
              orgObj.hq_state_id ??
              orgObj.HqStateId ??
              orgObj.hq_stateId ??
              orgObj.hqStateId ??
              orgObj.state_id ??
              orgObj.StateId ??
              null;
            const hqState =
              orgObj.hq_state ??
              orgObj.HqState ??
              orgObj.hqState ??
              orgObj.state ??
              orgObj.State ??
              orgObj.state_name ??
              orgObj.StateName ??
              null;

            autoGroup.hq_state_id =
              hqStateId !== null && hqStateId !== undefined && hqStateId !== ''
                ? Number(hqStateId)
                : null;
            autoGroup.hq_state =
              hqState !== null && hqState !== undefined ? String(hqState).trim() : null;

            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error fetching GetOrganisation for CAPF Nodal Officer:', err);
      },
    });
  }

  private loadOrganisations(): void {
    const parseOrgData = (res: any): OrganisationObj[] => {
      let data: any = res;

      // 1. Unpack / decrypt string payload
      const cipher =
        typeof res === 'string' ? res : typeof res?.data === 'string' ? res.data : null;

      if (cipher) {
        try {
          const decrypted = CryptoHelper.decrypt(cipher);
          data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
        } catch (e) {
          try {
            data = JSON.parse(cipher);
          } catch {}
        }
      } else if (res?.decryptedData) {
        data = res.decryptedData;
      }

      // If data is still stringified JSON or double-encrypted
      if (typeof data === 'string') {
        try {
          const decrypted = CryptoHelper.decrypt(data);
          data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
        } catch {
          try {
            data = JSON.parse(data);
          } catch {}
        }
      }

      // console.log('[CreateJobNotification] parseOrgData unpacked data:', data);

      // 2. Find raw array of items from possible containers
      let orgListRaw: any[] = [];
      if (Array.isArray(data)) {
        orgListRaw = data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.records)) orgListRaw = data.records;
        else if (Array.isArray(data.Records)) orgListRaw = data.Records;
        else if (Array.isArray(data.organisations)) orgListRaw = data.organisations;
        else if (Array.isArray(data.Organisations)) orgListRaw = data.Organisations;
        else if (Array.isArray(data.Organisation?.records)) orgListRaw = data.Organisation.records;
        else if (Array.isArray(data.Organisation)) orgListRaw = data.Organisation;
        else if (Array.isArray(data.organisation?.records)) orgListRaw = data.organisation.records;
        else if (Array.isArray(data.organisation)) orgListRaw = data.organisation;
        else if (Array.isArray(data.OrganisationMaster?.records))
          orgListRaw = data.OrganisationMaster.records;
        else if (Array.isArray(data.OrganisationMaster)) orgListRaw = data.OrganisationMaster;
        else if (Array.isArray(data.data?.records)) orgListRaw = data.data.records;
        else if (Array.isArray(data.data)) orgListRaw = data.data;
        else if (Array.isArray(data.result?.records)) orgListRaw = data.result.records;
        else if (Array.isArray(data.result)) orgListRaw = data.result;
      }

      // 3. Map items to OrganisationObj
      const roleInfo = this.userRoleInfo;
      const defaultOrgTypeId = Number(roleInfo.userOrgTypeId);
      let list: OrganisationObj[] = [];

      orgListRaw.forEach((item: any) => {
        if (!item) return;

        // Case A: item is directly an organisation
        const orgName =
          item.organisation_name ??
          item.OrganisationName ??
          item.organization_name ??
          item.OrganizationName ??
          item.name ??
          item.Name;

        if (orgName) {
          const orgId = Number(
            item.organisation_id ??
              item.OrganisationId ??
              item.organization_id ??
              item.OrganizationId ??
              item.id ??
              item.Id ??
              item.auto_id ??
              item.AutoId ??
              0,
          );
          const shortName = String(
            item.short_name ??
              item.ShortName ??
              item.organisation_short_name ??
              item.OrganisationShortName ??
              item.shortName ??
              '',
          );
          const typeId = Number(
            item.organisation_type_id ??
              item.OrganisationTypeId ??
              item.organization_type_id ??
              item.OrganizationTypeId ??
              defaultOrgTypeId,
          );
          const typeName = String(
            item.organisation_type ??
              item.OrganisationType ??
              item.organization_type ??
              item.OrganizationType ??
              'Central Armed Police Force',
          );
          const displayName = shortName ? `${orgName} (${shortName})` : orgName;

          const rawHqStateId =
            item.hq_state_id ??
            item.HqStateId ??
            item.hq_stateId ??
            item.hqStateId ??
            item.HqStateID ??
            item.state_id ??
            item.StateId ??
            null;

          const rawHqState =
            item.hq_state ??
            item.HqState ??
            item.hqState ??
            item.state ??
            item.State ??
            item.state_name ??
            item.StateName ??
            item.hq_state_name ??
            item.HqStateName ??
            null;

          list.push({
            organisation_id: orgId,
            organisation_name: orgName,
            short_name: shortName,
            organisation_type_id: isNaN(typeId) ? defaultOrgTypeId : typeId,
            organisation_type: typeName,
            displayName: displayName,
            hq_state_id:
              rawHqStateId !== null && rawHqStateId !== undefined && rawHqStateId !== ''
                ? Number(rawHqStateId)
                : null,
            hq_state:
              rawHqState !== null && rawHqState !== undefined ? String(rawHqState).trim() : null,
          });
        }

        // Case B: item has nested organisations array
        const nested = item.organisations ?? item.Organisations ?? item.records ?? item.Records;

        if (Array.isArray(nested)) {
          const parentTypeId = Number(
            item.organisation_type_id ?? item.OrganisationTypeId ?? defaultOrgTypeId,
          );
          const parentTypeName = String(
            item.organisation_type ?? item.OrganisationType ?? 'Central Armed Police Force',
          );

          nested.forEach((org: any) => {
            const nestedName =
              org.organisation_name ?? org.OrganisationName ?? org.name ?? org.Name;

            if (nestedName) {
              const nestedId = Number(
                org.organisation_id ?? org.OrganisationId ?? org.id ?? org.Id ?? 0,
              );
              const nestedShort = String(
                org.short_name ??
                  org.ShortName ??
                  org.organisation_short_name ??
                  org.shortName ??
                  '',
              );
              const nestedTypeId = Number(
                org.organisation_type_id ?? org.OrganisationTypeId ?? parentTypeId,
              );
              const nestedDisplay = nestedShort ? `${nestedName} (${nestedShort})` : nestedName;

              const nestedHqStateId =
                org.hq_state_id ??
                org.HqStateId ??
                org.hq_stateId ??
                org.hqStateId ??
                org.HqStateID ??
                org.state_id ??
                org.StateId ??
                null;

              const nestedHqState =
                org.hq_state ??
                org.HqState ??
                org.hqState ??
                org.state ??
                org.State ??
                org.state_name ??
                org.StateName ??
                org.hq_state_name ??
                org.HqStateName ??
                null;

              list.push({
                organisation_id: nestedId,
                organisation_name: nestedName,
                short_name: nestedShort,
                organisation_type_id: isNaN(nestedTypeId) ? parentTypeId : nestedTypeId,
                organisation_type: org.organisation_type || parentTypeName,
                displayName: nestedDisplay,
                hq_state_id:
                  nestedHqStateId !== null &&
                  nestedHqStateId !== undefined &&
                  nestedHqStateId !== ''
                    ? Number(nestedHqStateId)
                    : null,
                hq_state:
                  nestedHqState !== null && nestedHqState !== undefined
                    ? String(nestedHqState).trim()
                    : null,
              });
            }
          });
        }
      });

      // 4. Deduplicate by organisation_id
      const seen = new Set<number>();
      list = list.filter((o) => {
        if (o.organisation_id > 0 && seen.has(o.organisation_id)) return false;
        if (o.organisation_id > 0) seen.add(o.organisation_id);
        return true;
      });

      // 5. Role-based filter only if specific matching items exist
      if (roleInfo.isOrgNodal && roleInfo.userOrgTypeId > 0) {
        const filtered = list.filter(
          (o) => Number(o.organisation_type_id) === Number(roleInfo.userOrgTypeId),
        );
        if (filtered.length > 0) {
          list = filtered;
        }
      }

      // console.log('[CreateJobNotification] Final mapped organisationsList:', list);
      return list;
    };

    if (this.isRole13) {
      this.loadOrganisationsFallback(parseOrgData);
      return;
    }

    const currentUser = this.authService.getCurrentUser() || {};
    const orgTypeId = Number(
      currentUser?.organisation_type?.organisation_type_id ??
        currentUser?.organisation_type_id ??
        currentUser?.organisationTypeId ??
        (typeof currentUser?.organisation_type === 'number'
          ? currentUser.organisation_type
          : null) ??
        this.userRoleInfo.userOrgTypeId ??
        1,
    );

    // Primary API: /api/OrganisationMaster/GetOrganisations
    this.organisationService.getOrganisations(orgTypeId, false, 1, 1000).subscribe({
      next: (res: any) => {
        // console.log('this.organisationService.getOrganisations', res);
        this.ngZone.run(() => {
          const list = parseOrgData(res);
          if (list.length > 0) {
            this.organisationsList = list;
            this.cdr.detectChanges();
          } else {
            this.loadOrganisationsFallback(parseOrgData);
          }
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.loadOrganisationsFallback(parseOrgData);
        });
      },
    });
  }

  private loadOrganisationsFallback(parseOrgData: (res: any) => OrganisationObj[]): void {
    // Secondary API: /api/OrganisationMaster/GetAll
    const currentUser = this.authService.getCurrentUser();
    // console.log(currentUser, 'currentUser');
    const orgTypeId = Number(
      currentUser?.organisation_type?.organisation_type_id ??
        currentUser?.organisation_type_id ??
        this.userRoleInfo.userOrgTypeId ??
        1,
    );

    this.postMasterService.getAllOrganisations(1, 1000, orgTypeId).subscribe({
      next: (res: any) => {
        let OrganisationMaster: any = null;
        try {
          let rawData: any = res?.data;
          if (typeof rawData === 'string') {
            const dec = CryptoHelper.decrypt(rawData);
            rawData = typeof dec === 'string' ? JSON.parse(dec) : dec;
          }
          OrganisationMaster = rawData?.OrganisationMaster ?? rawData;
        } catch (e) {
          console.error('Error parsing OrganisationMaster in getAllOrganisations:', e);
        }

        if (Array.isArray(OrganisationMaster?.records)) {
          this.organisationTypesList = OrganisationMaster.records.map((ot: any) => {
            const typeId = Number(ot.organisation_type_id);
            const typeName = String(ot.organisation_type || '');
            const shortName = String(ot.short_name || '');
            const rawOrgs: any[] = Array.isArray(ot.organisations) ? ot.organisations : [];
            const orgs: OrganisationObj[] = rawOrgs.map((org: any) => {
              const oName = String(org.organisation_name || org.name || '');
              const sName = String(org.short_name || '');
              return {
                organisation_id: Number(org.organisation_id ?? org.id ?? 0),
                organisation_name: oName,
                short_name: sName,
                organisation_type_id: typeId,
                organisation_type: typeName,
                displayName: sName ? `${oName} (${sName})` : oName,
                hq_state_id:
                  org.hq_state_id !== null && org.hq_state_id !== undefined
                    ? Number(org.hq_state_id)
                    : null,
                hq_state: org.hq_state ? String(org.hq_state).trim() : null,
              };
            });
            return {
              organisation_type_id: typeId,
              organisation_type: typeName,
              short_name: shortName,
              organisations: orgs,
            };
          });
        }

        this.ngZone.run(() => {
          const list = parseOrgData(res);

          // console.log(list, 'list234');
          if (list.length > 0) {
            this.organisationsList = list;
          } else if (this.organisationTypesList.length > 0) {
            this.organisationsList = this.organisationTypesList.flatMap(
              (t) => t.organisations || [],
            );
          }

          if (this.selectedOrgTypeId) {
            const orgsForType = this.getOrganisationsForSelectedType();
            this.vacancyGroups.forEach((g) => {
              g.availableOrganisations = orgsForType;
            });
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Error in fallback getAllOrganisations:', err);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Check if PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid File Type',
        text: 'Only PDF documents are allowed for the notification document.',
      });
      input.value = '';
      return;
    }

    // Check file size (10 MB limit)
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'File Too Large',
        text: 'File size exceeds 10 MB limit.',
      });
      input.value = '';
      return;
    }

    const scheduleId =
      this.activeScheduleId() ||
      (typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('schedule_autoid') ||
          sessionStorage.getItem('ScheduleAutoId') ||
          sessionStorage.getItem('schedule_id') ||
          sessionStorage.getItem('scheduleId')
        : null) ||
      this.activeScheduleRound() ||
      '1';

    const timestamp = Date.now();
    const fileName = `${timestamp}.pdf`;
    const filePath = `job-notification/${scheduleId}/${fileName}`;

    const payload = { filepath: filePath, filename: fileName };
    const encReq = CryptoHelper.encrypt(JSON.stringify(payload));

    const formData = new FormData();
    formData.append('file', file, fileName);
    formData.append('File', file, fileName);

    this.isUploadingDocument.set(true);
    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);

    Swal.fire({
      title: 'Uploading Notification Document...',
      text: 'Please wait while your PDF document is being uploaded.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.jobNotificationService.UploadNotificationDocAPI(formData, encReq).subscribe({
      next: (res: any) => {
        this.isUploadingDocument.set(false);
        Swal.close();

        let finalPath = filePath;
        if (res && res.code) {
          let resPath = res.data;
          try {
            if (typeof resPath === 'string') {
              const decrypted = CryptoHelper.decrypt(resPath);
              if (decrypted) {
                try {
                  const parsed = JSON.parse(decrypted);
                  resPath = parsed;
                } catch {
                  resPath = decrypted;
                }
              }
            }
          } catch (e) {
            console.error('Error decrypting upload response:', e);
          }

          if (typeof resPath === 'string' && resPath.trim()) {
            finalPath = resPath.trim().replace(/^"|"$/g, '');
          } else if (resPath && typeof resPath === 'object') {
            finalPath = resPath.filepath || resPath.filePath || resPath.path || filePath;
          }
          this.uploadedAttachmentPath.set(finalPath);
          this.cdr.detectChanges();

          Swal.fire({
            icon: 'success',
            title: 'Uploaded Successfully',
            text: 'Notification document uploaded successfully.',
            timer: 2000,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: res?.message || 'Failed to upload document. Please try again.',
          });
        }
      },
      error: (err: any) => {
        this.isUploadingDocument.set(false);
        Swal.close();
        this.selectedFile.set(null);
        this.selectedFileName.set('');
        this.uploadedAttachmentPath.set('');
        input.value = '';
        this.cdr.detectChanges();

        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text:
            err?.error?.message || err?.message || 'Failed to upload document. Please try again.',
        });
      },
    });
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    this.uploadedAttachmentPath.set('');
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  // Vacancy Group Actions
  addVacancyGroup(): void {
    const orgsForType = this.getOrganisationsForSelectedType();
    const newGroup: VacancyGroup = {
      id: 'group_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      selectedOrgTypeId: this.selectedOrgTypeId,
      selectedOrgId: null,
      organizationName: '',
      shortName: '',
      orgTypeId: this.selectedOrgTypeId,
      displayName: '',
      hq_state_id: null,
      hq_state: null,
      isCollapsed: false,
      isLoadingPosts: false,
      hasNoPosts: false,
      noPostsMessage: '',
      availablePosts: [],
      availableOrganisations: orgsForType,
      posts: [],
    };
    this.vacancyGroups.push(newGroup);
    this.cdr.detectChanges();
  }

  removeVacancyGroup(index: number): void {
    this.vacancyGroups.splice(index, 1);
    this.cdr.detectChanges();
  }

  onTopOrgTypeChange(selectedTypeId: any): void {
    const typeIdNum = Number(selectedTypeId);
    const hasExistingSelections = this.vacancyGroups.some((g) => g.selectedOrgId);

    const applyChange = () => {
      this.selectedOrgTypeId = typeIdNum;
      const orgsForType = this.getOrganisationsForSelectedType();

      this.vacancyGroups.forEach((group) => {
        group.selectedOrgTypeId = typeIdNum;
        group.orgTypeId = typeIdNum;
        group.selectedOrgId = null;
        group.organizationName = '';
        group.shortName = '';
        group.displayName = '';
        group.posts = [];
        group.availablePosts = [];
        group.hasNoPosts = false;
        group.noPostsMessage = '';
        group.availableOrganisations = orgsForType;
      });

      if (this.vacancyGroups.length === 0) {
        this.addVacancyGroup();
      }
      this.cdr.detectChanges();
    };

    if (hasExistingSelections) {
      Swal.fire({
        title: 'Change Organization Type?',
        text: 'Changing the Organization Type will reset selected organizations and posts in your vacancy groups.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, change it',
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          applyChange();
        } else {
          this.cdr.detectChanges();
        }
      });
    } else {
      applyChange();
    }
  }

  getOrganisationsForSelectedType(): OrganisationObj[] {
    if (!this.selectedOrgTypeId) {
      return [];
    }
    const typeId = Number(this.selectedOrgTypeId);
    const selectedType = this.organisationTypesList.find(
      (t) => Number(t.organisation_type_id) === typeId,
    );
    if (
      selectedType &&
      Array.isArray(selectedType.organisations) &&
      selectedType.organisations.length > 0
    ) {
      return selectedType.organisations;
    }
    return this.organisationsList.filter((o) => Number(o.organisation_type_id) === typeId);
  }

  getOrganisationsForGroup(group?: VacancyGroup): OrganisationObj[] {
    if (this.isCapfNodalOfficer) {
      return this.organisationsList;
    }
    if (group?.availableOrganisations && group.availableOrganisations.length > 0) {
      return group.availableOrganisations;
    }
    return this.getOrganisationsForSelectedType();
  }

  // Call /api/PostMaster/GetPostMasterBasedOnOrganisationId when an Organisation is selected
  onOrganizationChange(group: VacancyGroup, selectedOrgId: any): void {
    const orgIdNum = Number(selectedOrgId);
    let orgObj = this.organisationsList.find((o) => Number(o.organisation_id) === orgIdNum);

    if (!orgObj) {
      const groupOrgs = this.getOrganisationsForGroup(group);
      orgObj = groupOrgs.find((o) => Number(o.organisation_id) === orgIdNum);
    }

    if (!orgObj) {
      const roleInfo = this.userRoleInfo;
      if (orgIdNum === roleInfo.userOrgId || this.isCapfNodalOfficer) {
        orgObj = {
          organisation_id: roleInfo.userOrgId || orgIdNum,
          organisation_name: roleInfo.userOrgName || group.organizationName || 'Organization',
          short_name: group.shortName || '',
          organisation_type_id: roleInfo.userOrgTypeId || 1,
          organisation_type: 'Central Armed Police Force',
          displayName: roleInfo.userOrgName || group.organizationName || 'Organization',
          hq_state_id: group.hq_state_id ?? null,
          hq_state: group.hq_state ?? null,
        };
      } else {
        return;
      }
    }

    group.selectedOrgId = orgObj.organisation_id;
    group.organizationName = orgObj.organisation_name;
    group.shortName = orgObj.short_name;
    group.orgTypeId = orgObj.organisation_type_id;
    group.displayName = orgObj.displayName;
    group.hq_state_id = orgObj.hq_state_id ?? null;
    group.hq_state = orgObj.hq_state ?? null;
    group.posts = [];
    group.availablePosts = [];
    group.isLoadingPosts = true;
    group.hasNoPosts = false;
    group.noPostsMessage = '';
    this.cdr.detectChanges();

    // Call /api/PostMaster/GetPostMasterBasedOnOrganisationId with payload { organisation_id: orgObj.organisation_id }
    this.postMasterService.getPostMasterBasedOnOrganisationId(orgObj.organisation_id).subscribe({
      next: (res: any) => {
        this.ngZone.run(() => {
          group.isLoadingPosts = false;

          // Check if response indicates record not found or code 0
          if (
            res &&
            (res.code === 0 ||
              res.code === '0' ||
              res.message === 'Record not found' ||
              res.status === false)
          ) {
            group.hasNoPosts = true;
            group.noPostsMessage = res.message || `No posts found for ${group.organizationName}.`;
            group.availablePosts = [];
            this.addPostToGroup(group);
            this.cdr.detectChanges();
            return;
          }

          let data: any = res?.data ?? res?.decryptedData ?? res;
          if (typeof data === 'string') {
            try {
              const decrypted = CryptoHelper.decrypt(data);
              data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
            } catch (e) {}
          }
          // console.log(data, 'dataorgnai');

          let records: any[] = [];
          if (Array.isArray(data)) {
            records = data;
          } else if (Array.isArray(data?.records)) {
            records = data.records;
          } else if (Array.isArray(data?.posts)) {
            records = data.posts;
          } else if (Array.isArray(data?.data)) {
            records = data.data;
          } else if (Array.isArray(data?.OrganisationMaster?.records)) {
            records = data.OrganisationMaster.records;
          } else if (Array.isArray(data?.OrganisationMaster)) {
            records = data.OrganisationMaster;
          }

          const parsedPosts: PostOptionItem[] = records
            .map((p: any) => {
              const name = String(
                p.post_name || p.post || p.postName || p.name || p.post_title || '',
              ).trim();
              const rawAutoId =
                p.post_autoid && Number(p.post_autoid) !== 0
                  ? p.post_autoid
                  : p.postmaster_autoid || p.post_id || p.id || 1;
              const autoid = String(rawAutoId);
              const code = String(
                p.post_code ||
                  p.postCode ||
                  p.code ||
                  name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
              ).trim();
              return {
                post_autoid: autoid,
                post_name: name,
                post_code: code,
              };
            })
            .filter((p) => p.post_name.length > 0);

          if (parsedPosts.length === 0) {
            group.hasNoPosts = true;
            group.noPostsMessage = `No posts found for ${group.organizationName}.`;
            group.availablePosts = [];
          } else {
            group.hasNoPosts = false;
            group.availablePosts = parsedPosts;
          }

          // Auto add first post dropdown with placeholder "Select Post"
          this.addPostToGroup(group);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error(
          'Error fetching posts from PostMaster/GetPostMasterBasedOnOrganisationId:',
          err,
        );
        this.ngZone.run(() => {
          group.isLoadingPosts = false;
          group.hasNoPosts = true;
          group.noPostsMessage = `No posts found for ${group.organizationName}.`;
          group.availablePosts = [];
          this.addPostToGroup(group);
          this.cdr.detectChanges();
        });
      },
    });
  }

  addPostToGroup(group: VacancyGroup): void {
    if (!group.selectedOrgId) {
      return;
    }
    group.posts.push({
      id: 'post_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      postName: '',
      post_autoid: '1',
      post_code: '',
    });
    this.cdr.detectChanges();
  }

  removePostFromGroup(group: VacancyGroup, postIndex: number): void {
    if (group.posts.length <= 1) {
      return;
    }
    group.posts.splice(postIndex, 1);
    this.cdr.detectChanges();
  }

  onPostSelectChange(group: VacancyGroup, postRow: PostRow, selectedPostName: string): void {
    postRow.postName = selectedPostName;
    const match = group.availablePosts.find((p) => p.post_name === selectedPostName);
    if (match) {
      postRow.post_autoid = match.post_autoid;
      postRow.post_code = match.post_code;
    } else {
      postRow.post_autoid = '1';
      postRow.post_code = selectedPostName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    }
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/notifications']);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  createNotification(): void {
    if (!this.advertisementNo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter Advertisement No.',
      });
      return;
    }

    if (!this.notificationTitle.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter Notification Title.',
      });
      return;
    }

    if (!this.description.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please enter Description.',
      });
      return;
    }

    if (this.isUploadingDocument()) {
      Swal.fire({
        icon: 'warning',
        title: 'Upload in Progress',
        text: 'Please wait until the Notification Document finishes uploading.',
      });
      return;
    }

    if (!this.selectedFileName()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please upload a Notification Document (PDF).',
      });
      return;
    }

    if (!this.isCapfNodalOfficer && !this.selectedOrgTypeId) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please select an Organization Type.',
      });
      return;
    }

    if (this.vacancyGroups.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Please add at least one Vacancy group.',
      });
      return;
    }

    for (let i = 0; i < this.vacancyGroups.length; i++) {
      const g = this.vacancyGroups[i];
      if (!g.selectedOrgId) {
        Swal.fire({
          icon: 'warning',
          title: 'Required Field',
          text: `Please select an Organization for Vacancy Group ${i + 1}.`,
        });
        return;
      }
      const hasEmptyPost =
        g.posts.length === 0 || g.posts.some((p) => !p.postName || !p.postName.trim());
      if (hasEmptyPost) {
        Swal.fire({
          icon: 'warning',
          title: 'Required Field',
          text: `Please select a Post for all entries in Vacancy Group ${i + 1}.`,
        });
        return;
      }
    }

    const validGroups = this.vacancyGroups.filter(
      (g) => g.selectedOrgId && g.posts.some((p) => p.postName),
    );

    this.isSubmitting.set(true);

    const currentUser = this.authService.getCurrentUser() || {};
    const createdByUserId = currentUser?.userautoid;

    const roleInfo = this.userRoleInfo;
    const roundFromSchedule = this.activeScheduleRound();
    const roundFromStorage =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('round') || sessionStorage.getItem('schedule_round')
        : null;
    const finalRound =
      roundFromSchedule != null
        ? roundFromSchedule
        : roundFromStorage != null
          ? roundFromStorage
          : null;

    const payload = {
      job_notification_autoid: 0,
      advertisement_number: this.advertisementNo.trim(),
      date_of_advertisement: new Date().toISOString(),
      notification_title: this.notificationTitle.trim(),
      description: this.description.trim(),
      attachment_path:
        this.uploadedAttachmentPath() ||
        (this.selectedFileName() ? `uploads/${this.selectedFileName()}` : null),
      notification_document_filepath:
        this.uploadedAttachmentPath() ||
        (this.selectedFileName() ? `uploads/${this.selectedFileName()}` : null),
      visibility: 'public',
      created_by: createdByUserId,
      job_type: 'Centre',
      is_vacancy_added: false,
      round: this.activeScheduleRound() ?? null,
      notification_open_for_all_state: this.notificationOpenForAllState(),
      organisation_type:
        this.organisationTypesList.find(
          (t) =>
            Number(t.organisation_type_id) ===
            Number(this.selectedOrgTypeId || validGroups[0]?.orgTypeId),
        )?.organisation_type || (this.isCapfNodalOfficer ? 'Central Armed Police Force' : ''),
      organisation_type_id: Number(
        this.selectedOrgTypeId || validGroups[0]?.orgTypeId || roleInfo.userOrgTypeId || 1,
      ),
      organisations: validGroups.map((g) => {
        const matchedOrg = this.organisationsList.find(
          (o) => Number(o.organisation_id) === Number(g.selectedOrgId),
        );

        const hqStateId =
          g.hq_state_id !== undefined && g.hq_state_id !== null
            ? g.hq_state_id
            : matchedOrg?.hq_state_id !== undefined && matchedOrg?.hq_state_id !== null
              ? matchedOrg.hq_state_id
              : null;

        const hqState = g.hq_state || matchedOrg?.hq_state || null;

        const orgPayload: any = {
          organisation_id: Number(g.selectedOrgId),
          organisation_name: g.organizationName || roleInfo.userOrgName,
          short_name: g.shortName || '',
          posts: g.posts
            .filter((p) => p.postName)
            .map((p) => ({
              post_autoid: String(p.post_autoid || '1'),
              post_name: p.postName,
              post_code: p.post_code || p.postName.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
            })),
        };

        // If hq_state_id is present (not null or undefined), send dynamic hq_state and hq_state_id
        if (hqStateId != null) {
          orgPayload.hq_state = hqState != null ? String(hqState).trim() : '';
          orgPayload.hq_state_id = Number(hqStateId);
        }

        return orgPayload;
      }),
    };
    // console.log(payload, 'paylaod');

    this.jobNotificationService.createNotification('0', payload as any).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        let parsed: any = res;

        const cipher = typeof res === 'string' ? res : res?.data;
        if (cipher && typeof cipher === 'string') {
          try {
            const decryptedString = CryptoHelper.decrypt(cipher);
            const decObj =
              typeof decryptedString === 'string' ? JSON.parse(decryptedString) : decryptedString;
            if (decObj && typeof decObj === 'object') {
              parsed = { ...res, ...decObj };
            } else {
              parsed = decObj;
            }
          } catch (e) {}
        }

        const resCode = Number(parsed?.code ?? res?.code);
        const isSuccess = resCode === 1 || parsed?.status === true || res?.status === true;

        if (!isSuccess) {
          const errMsg =
            parsed?.message ||
            res?.message ||
            'Failed to create job notification. Please try again.';
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: errMsg,
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: parsed?.message || res?.message || 'Job notification created successfully.',
          timer: 2000,
          showConfirmButton: false,
        });
        this.goBack();
      },
      error: (err) => {
        console.error('Error creating job notification:', err);
        this.isSubmitting.set(false);
        const errMsg =
          err?.error?.message ||
          err?.message ||
          'Failed to create job notification. Please try again.';
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errMsg,
        });
      },
    });
  }
}
