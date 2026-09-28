import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { MyProfileService } from '../../../services/myprofile/myprofile';
import { CommonService } from '../../../services/common-service';
import { CryptoHelper } from '../../../helpers/crypto-helper';
import { AuthService } from '../../../services/auth';
import { ScheduleService } from '../../../services/schedule/schedule';

export interface ForcePreferenceItem {
  id: string | number;
  name?: string;
  organisationId?: string | number;
  OrganisationId?: string | number;
  organisationName?: string;
  OrganisationName?: string;
  force_name?: string;
  post_title?: string;
  department?: string;
  pay_level?: string;
  preference_order?: number;
  PreferenceOrder?: number;
  job_notification_autoid?: number;
  JobNotificationAutoId?: number;
  notification_title?: string;
  NotificationTitle?: string;
  organisation_type_id?: number;
  OrganisationTypeId?: number;
  organisation_type?: string;
  OrganisationType?: string;
  organisation_id?: number;
  organisation_name?: string;
  raw?: any;
  [key: string]: any;
}

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preferences.html',
  styleUrl: './preferences.css',
})
export class Preferences implements OnInit {
  @Input() agniveerAutoid?: number;
  @Input() agniveerJobapplicationsAutoid?: number;
  @Input() userDetails?: any;
  @Input() rawPartBDetails?: any;
  @Output() previousTab = new EventEmitter<void>();
  @Output() cancelPreferences = new EventEmitter<void>();

  private readonly myProfileService = inject(MyProfileService);
  private readonly commonService = inject(CommonService);
  private readonly authService = inject(AuthService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Preferences Signals
  readonly availablePosts = signal<ForcePreferenceItem[]>([]);
  readonly selectedPreferences = signal<ForcePreferenceItem[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly organisations = signal<any[]>([]);
  readonly candidateProfileData = signal<any>(null);
  readonly agniveerJobApplicationsAutoId = signal<number | null>(null);
  readonly activeRound = signal<number>(0);
  readonly isDraftSave = signal<boolean>(false);

  // Drag and Drop State
  draggedAvailableItem: ForcePreferenceItem | null = null;
  draggedFilledIndex: number | null = null;
  dragOverFilledIndex: number | null = null;
  readonly isDraggingOverFilled = signal<boolean>(false);

  ngOnInit(): void {
    this.loadOrganisations();
    this.loadUserDetails();
    this.loadAgniveerPreferenceByAgniveerAndRound();
    if (this.userDetails) {
      this.populateExistingPreferences(this.userDetails);
    }
  }

  loadAgniveerPreferenceByAgniveerAndRound(): void {
    const currentUser = this.authService.getCurrentUser();
    const payloadEnc = JSON.stringify(CryptoHelper.encrypt(JSON.stringify({})));
    // console.log(currentUser, 'current');
    this.scheduleService.getActiveSchedule(payloadEnc).subscribe({
      next: (res: any) => {
        let activeRound;
        if (res?.code === 1 && res?.data) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const data = typeof dec === 'string' ? JSON.parse(dec) : dec;
            const schedule =
              data?.Schedule ?? data?.schedule ?? data?.Table ?? data?.Schedules ?? data;
            const parsedRound = schedule?.Round;

            if (!isNaN(parsedRound) && parsedRound > 0) {
              activeRound = parsedRound;
            }
          } catch (e) {
            console.error('Error parsing active schedule in Preferences:', e);
          }
        }

        const fallbackRound = activeRound;
        this.activeRound.set(fallbackRound);

        const autoid =
          this.agniveerAutoid ||
          currentUser?.agniveer_autoid ||
          currentUser?.AgniveerAutoId ||
          currentUser?.userautoId ||
          sessionStorage.getItem('agniveer_autoid') ||
          sessionStorage.getItem('agniveerAutoid') ||
          sessionStorage.getItem('userautoId');

        this.fetchPreferencesByAgniveerAndRound(autoid, fallbackRound);
      },
      error: (err: any) => {
        console.error('Error fetching active schedule for round:', err);
      },
    });
  }

  private fetchPreferencesByAgniveerAndRound(agniveerAutoid: any, round: number): void {
    const payload = {
      agniveer_autoid: Number(agniveerAutoid),
      round: Number(round),
    };

    // console.log('Fetching AgniveerPreference/GetByAgniveerAndRound with payload:', payload);

    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.myProfileService.GetAgniveerPreferenceByAgniveerAndRound(encryptedPayload).subscribe({
      next: (response: any) => {
        let decryptedData: any = null;
        if (response?.data) {
          try {
            const rawDecrypted = CryptoHelper.decrypt(response.data);
            decryptedData =
              typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
            if (typeof decryptedData === 'string') {
              decryptedData = JSON.parse(decryptedData);
            }
          } catch (e) {
            decryptedData = response.data;
          }
        } else if (response) {
          decryptedData = response;
        }

        // console.log('AgniveerPreference/GetByAgniveerAndRound decrypted data:', decryptedData);

        if (decryptedData) {
          const prefObj =
            decryptedData.AgniveerPreference ??
            decryptedData.agniveerPreference ??
            decryptedData.agniveer_preference;

          const rawDraft = prefObj?.IsDraftSave;

          if (rawDraft !== undefined && rawDraft !== null) {
            this.isDraftSave.set(rawDraft);
          }

          if (prefObj) {
            const jobAppId =
              prefObj.AgniveerJobApplicationsAutoId ?? prefObj.agniveer_jobapplications_autoid;
            if (jobAppId && !this.agniveerJobApplicationsAutoId()) {
              this.agniveerJobApplicationsAutoId.set(Number(jobAppId));
            }
            if (prefObj.Round && !this.activeRound()) {
              this.activeRound.set(Number(prefObj.Round));
            }
            this.candidateProfileData.update((cur: any) => ({
              ...(cur || {}),
              ...prefObj,
            }));
          }

          this.populateExistingPreferences(decryptedData, true);
        }
      },
      error: (err: any) => {
        console.error('AgniveerPreference/GetByAgniveerAndRound error:', err);
      },
    });
  }

  populateExistingPreferences(data: any, force: boolean = false): void {
    if (!data) return;
    if (!force && this.selectedPreferences().length > 0) return;

    let savedOrgs: any = null;

    if (Array.isArray(data)) {
      savedOrgs = data;
    } else if (data && typeof data === 'object') {
      const agniveerPref =
        data.AgniveerPreference ??
        data.agniveerPreference ??
        data.agniveer_preference ??
        (Array.isArray(data.AgniveerPreferences)
          ? data.AgniveerPreferences[0]
          : data.AgniveerPreferences);

      let parsedPref = agniveerPref;
      if (typeof parsedPref === 'string') {
        try {
          parsedPref = JSON.parse(parsedPref);
        } catch {}
      }

      savedOrgs =
        parsedPref?.Organisations ??
        parsedPref?.organisations ??
        parsedPref?.Preferences ??
        parsedPref?.preferences ??
        data.Organisations ??
        data.organisations ??
        data.preferences ??
        data.Preferences ??
        data.Table ??
        data.Table1 ??
        data.AdditionalProfileDetails?.Organisations ??
        data.AdditionalProfileDetails?.organisations ??
        data.AdditionalProfileDetails?.Preferences ??
        data.AdditionalProfileDetails?.preferences ??
        this.userDetails?.Organisations ??
        this.userDetails?.organisations ??
        this.userDetails?.Preferences ??
        this.userDetails?.preferences;

      const jobAppId =
        parsedPref?.AgniveerJobApplicationsAutoId ??
        parsedPref?.agniveer_jobapplications_autoid ??
        data.AgniveerJobApplicationsAutoId ??
        data.agniveer_jobapplications_autoid;

      if (jobAppId && !this.agniveerJobApplicationsAutoId()) {
        this.agniveerJobApplicationsAutoId.set(Number(jobAppId));
      }
    }

    if (typeof savedOrgs === 'string') {
      try {
        savedOrgs = JSON.parse(savedOrgs);
      } catch {}
    }

    if (Array.isArray(savedOrgs) && savedOrgs.length > 0) {
      const mappedSaved: ForcePreferenceItem[] = savedOrgs.map((item: any, index: number) => {
        const orgId =
          item.OrganisationId ??
          item.organisation_id ??
          item.organisationId ??
          item.id ??
          index + 1;
        const name =
          item.OrganisationName ??
          item.organisation_name ??
          item.organisationName ??
          item.force_name ??
          item.name ??
          '';
        const notifTitle =
          item.NotificationTitle ?? item.notification_title ?? item.post_title ?? '';
        const jobNotifId =
          item.JobNotificationAutoId ??
          item.job_notification_autoid ??
          item.job_notification_id ??
          item.notification_id ??
          0;
        const orgTypeId =
          item.OrganisationTypeId ?? item.organisation_type_id ?? item.org_type_id ?? 0;
        const orgType = item.OrganisationType ?? item.organisation_type ?? item.org_type ?? '';

        return {
          ...item,
          id: orgId,
          organisationId: orgId,
          OrganisationId: orgId,
          organisationName: name,
          OrganisationName: name,
          force_name: name,
          post_title: notifTitle,
          department: name,
          job_notification_autoid: Number(jobNotifId) || 0,
          notification_title: notifTitle,
          organisation_type_id: Number(orgTypeId) || 0,
          organisation_type: orgType,
          organisation_id: Number(orgId) || 0,
          organisation_name: name,
          preference_order: item.preference_order ?? item.PreferenceOrder ?? index + 1,
          raw: item,
        };
      });

      const getOrgIdStr = (x: any) =>
        String(x?.OrganisationId ?? x?.organisation_id ?? x?.organisationId ?? x?.id ?? '');

      // Enrich with any extra metadata if organisations are already loaded
      const currentOrgs = this.organisations();
      if (Array.isArray(currentOrgs) && currentOrgs.length > 0) {
        mappedSaved.forEach((pref, idx) => {
          const prefOrgId = getOrgIdStr(pref);
          const matching = currentOrgs.find((o: any) => getOrgIdStr(o) === prefOrgId);
          if (matching) {
            mappedSaved[idx] = {
              ...matching,
              ...pref,
              organisationName:
                pref.organisationName ||
                matching.organisation_name ||
                matching.OrganisationName ||
                matching.name,
              force_name:
                pref.force_name ||
                matching.organisation_name ||
                matching.OrganisationName ||
                matching.name,
            };
          }
        });
      }

      this.selectedPreferences.set(mappedSaved);

      // Filter from available posts using OrganisationId
      const selectedOrgIds = new Set(mappedSaved.map(getOrgIdStr).filter(Boolean));

      this.availablePosts.update((avail) =>
        avail.filter((item) => !selectedOrgIds.has(getOrgIdStr(item))),
      );

      this.cdr.detectChanges();
    }
  }

  loadUserDetails(): void {
    if (this.userDetails && (this.userDetails.Name || this.userDetails.name)) {
      this.populateExistingPreferences(this.userDetails);
      return;
    }

    const autoid =
      this.agniveerAutoid ||
      sessionStorage.getItem('agniveer_autoid') ||
      sessionStorage.getItem('agniveerAutoid') ||
      sessionStorage.getItem('userautoId') ||
      1;

    const payload = {
      agniveer_autoid: Number(autoid) || 1,
    };
    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    this.myProfileService
      .getAgniveerdetailsByAgniveer_autoid(JSON.stringify(encryptedPayload))
      .subscribe({
        next: (response: any) => {
          let decryptedData: any = null;
          if (response?.data) {
            try {
              const rawDecrypted = CryptoHelper.decrypt(response.data);
              decryptedData =
                typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
              if (typeof decryptedData === 'string') {
                decryptedData = JSON.parse(decryptedData);
              }
            } catch (e) {
              decryptedData = response.data;
            }
          } else if (response) {
            decryptedData = response;
          }

          let unwrapped = decryptedData;
          for (let i = 0; i < 6 && unwrapped; i++) {
            if (Array.isArray(unwrapped) && unwrapped.length > 0) {
              unwrapped = unwrapped[0];
              continue;
            }
            if (unwrapped.Agniveer && typeof unwrapped.Agniveer === 'object') {
              unwrapped = Array.isArray(unwrapped.Agniveer)
                ? unwrapped.Agniveer[0]
                : unwrapped.Agniveer;
              continue;
            }
            if (unwrapped.agniveer && typeof unwrapped.agniveer === 'object') {
              unwrapped = Array.isArray(unwrapped.agniveer)
                ? unwrapped.agniveer[0]
                : unwrapped.agniveer;
              continue;
            }
            if (unwrapped.records && typeof unwrapped.records === 'object') {
              unwrapped = Array.isArray(unwrapped.records)
                ? unwrapped.records[0]
                : unwrapped.records;
              continue;
            }
            if (unwrapped.Table && Array.isArray(unwrapped.Table) && unwrapped.Table.length > 0) {
              unwrapped = unwrapped.Table[0];
              continue;
            }
            break;
          }

          if (unwrapped) {
            if (typeof unwrapped.AdditionalProfileDetails === 'string') {
              try {
                unwrapped.AdditionalProfileDetails = JSON.parse(unwrapped.AdditionalProfileDetails);
              } catch {}
            }
            this.candidateProfileData.set(unwrapped);

            const userJobAppId =
              unwrapped?.agniveer_jobapplications_autoid ??
              unwrapped?.AgniveerJobApplicationsAutoId ??
              unwrapped?.jobapplications_autoid ??
              unwrapped?.JobApplicationsAutoId ??
              unwrapped?.job_applications_autoid ??
              unwrapped?.job_application_id ??
              unwrapped?.JobApplicationId ??
              unwrapped?.AdditionalProfileDetails?.agniveer_jobapplications_autoid ??
              unwrapped?.additional_profile_details?.agniveer_jobapplications_autoid;

            if (userJobAppId && !this.agniveerJobApplicationsAutoId()) {
              this.agniveerJobApplicationsAutoId.set(Number(userJobAppId));
            }

            this.populateExistingPreferences(unwrapped);
          }
        },
        error: (err) => {
          console.error('Failed to fetch candidate details in Preferences:', err);
        },
      });
  }

  loadOrganisations(): void {
    const agniveerIdNo =
      sessionStorage.getItem('agniveerId') ||
      sessionStorage.getItem('userId') ||
      sessionStorage.getItem('agniveer_id_no');

    const param: any = {
      agniveer_id_no: agniveerIdNo,
    };
    const jsonPayload = JSON.stringify(param);
    const encryptedPayload = CryptoHelper.encrypt(jsonPayload);

    this.isLoading.set(true);

    this.myProfileService.GetOrganisationsByAgniveer(JSON.stringify(encryptedPayload)).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        // console.log('GetOrganisationsByAgniveer response:', response);

        if (response?.code) {
          const rawDecrypted = CryptoHelper.decrypt(response.data);
          let decryptedData =
            typeof rawDecrypted === 'string' ? JSON.parse(rawDecrypted) : rawDecrypted;
          if (typeof decryptedData === 'string') {
            decryptedData = JSON.parse(decryptedData);
          }

          // console.log('decryptedData', decryptedData);

          let orgList: any[] = [];
          if (Array.isArray(decryptedData)) {
            orgList = decryptedData;
          } else if (decryptedData && typeof decryptedData === 'object') {
            orgList =
              decryptedData.Organisations ||
              decryptedData.organisations ||
              decryptedData.Table ||
              [];
          }

          this.organisations.set(orgList);

          if (Array.isArray(orgList)) {
            const mapped: ForcePreferenceItem[] = orgList.map((item: any, index: number) => {
              const orgId =
                item.OrganisationId ??
                item.organisation_id ??
                item.organisationId ??
                item.id ??
                index + 1;
              const name =
                item.OrganisationName ??
                item.organisation_name ??
                item.organisationName ??
                item.name ??
                '';
              const notifTitle =
                item.NotificationTitle ?? item.notification_title ?? item.post_title ?? '';
              const jobNotifId =
                item.JobNotificationAutoId ??
                item.job_notification_autoid ??
                item.job_notification_id ??
                item.notification_id ??
                0;
              const orgTypeId =
                item.OrganisationTypeId ?? item.organisation_type_id ?? item.org_type_id ?? 0;
              const orgType =
                item.OrganisationType ?? item.organisation_type ?? item.org_type ?? '';

              return {
                ...item,
                id: orgId,
                organisationId: orgId,
                OrganisationId: orgId,
                organisationName: name,
                OrganisationName: name,
                force_name: name,
                post_title: notifTitle,
                department: name,
                job_notification_autoid: Number(jobNotifId) || 0,
                notification_title: notifTitle,
                organisation_type_id: Number(orgTypeId) || 0,
                organisation_type: orgType,
                organisation_id: Number(orgId) || 0,
                organisation_name: name,
                raw: item,
              };
            });

            const getOrgIdStr = (x: any) =>
              String(x.OrganisationId ?? x.organisation_id ?? x.organisationId ?? x.id ?? '');

            const selectedOrgIds = new Set(
              this.selectedPreferences().map(getOrgIdStr).filter(Boolean),
            );

            // If selectedPreferences already has items, enrich with full organisation details
            if (this.selectedPreferences().length > 0) {
              const enriched = this.selectedPreferences().map((pref) => {
                const prefOrgId = getOrgIdStr(pref);
                const matchingOrg = mapped.find((m) => getOrgIdStr(m) === prefOrgId);
                if (matchingOrg) {
                  return {
                    ...matchingOrg,
                    ...pref,
                    organisationName:
                      pref.organisationName ||
                      matchingOrg.organisationName ||
                      matchingOrg.force_name,
                    force_name:
                      pref.force_name || matchingOrg.force_name || matchingOrg.organisationName,
                  };
                }
                return pref;
              });
              this.selectedPreferences.set(enriched);
            }

            // Keep only unselected organisations in available list
            const available = mapped.filter((item) => !selectedOrgIds.has(getOrgIdStr(item)));
            this.availablePosts.set(available);
          }
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => {
        this.isLoading.set(false);
        console.error('GetOrganisationsByAgniveer error:', error);
      },
    });
  }

  // ── Add to Filled Preferences ──────────────────────────────
  addPreference(itemOrDraft?: ForcePreferenceItem | boolean, insertIndex?: number): void {
    if (
      typeof itemOrDraft === 'boolean' ||
      (itemOrDraft === undefined && insertIndex === undefined)
    ) {
      this.savePreferences(!!itemOrDraft);
      return;
    }

    if (itemOrDraft && typeof itemOrDraft === 'object') {
      const item = itemOrDraft as ForcePreferenceItem;
      const getOrgIdStr = (x: any) =>
        String(x.OrganisationId ?? x.organisation_id ?? x.organisationId ?? x.id ?? '');
      const itemId = getOrgIdStr(item);

      if (this.selectedPreferences().some((p) => getOrgIdStr(p) === itemId)) return;

      const current = [...this.selectedPreferences()];
      const itemToAdd = { ...item };

      if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= current.length) {
        current.splice(insertIndex, 0, itemToAdd);
      } else {
        current.push(itemToAdd);
      }

      // Number 1, 2, 3... in the order they are moved
      const reindexed = current.map((p, idx) => ({
        ...p,
        preference_order: idx + 1,
      }));

      this.selectedPreferences.set(reindexed);
      this.availablePosts.update((list) => list.filter((p) => getOrgIdStr(p) !== itemId));
      this.cdr.detectChanges();
    }
  }

  // ── Remove from Filled Preferences ─────────────────────────
  removePreference(index: number): void {
    const list = [...this.selectedPreferences()];
    const [removed] = list.splice(index, 1);
    if (removed) {
      // Re-index remaining preferences 1, 2, 3...
      const reindexed = list.map((item, idx) => ({ ...item, preference_order: idx + 1 }));
      this.selectedPreferences.set(reindexed);

      const getOrgIdStr = (x: any) =>
        String(x?.OrganisationId ?? x?.organisation_id ?? x?.organisationId ?? x?.id ?? '');
      const getOrgName = (x: any) =>
        x?.organisationName ||
        x?.OrganisationName ||
        x?.organisation_name ||
        x?.force_name ||
        x?.name ||
        '';

      const removedOrgId = getOrgIdStr(removed);

      // Return removed item back to available organisations list
      this.availablePosts.update((avail) => {
        if (!avail.some((a) => getOrgIdStr(a) === removedOrgId)) {
          const originalOrg = (this.organisations() || []).find(
            (o: any) => getOrgIdStr(o) === removedOrgId,
          );

          const orgName = getOrgName(removed) || getOrgName(originalOrg);
          const notifTitle =
            removed?.NotificationTitle ??
            removed?.notification_title ??
            originalOrg?.NotificationTitle ??
            originalOrg?.notification_title ??
            removed?.post_title ??
            originalOrg?.post_title ??
            '';
          const jobNotifId =
            removed?.JobNotificationAutoId ??
            removed?.job_notification_autoid ??
            originalOrg?.JobNotificationAutoId ??
            originalOrg?.job_notification_autoid ??
            0;
          const orgTypeId =
            removed?.OrganisationTypeId ??
            removed?.organisation_type_id ??
            originalOrg?.OrganisationTypeId ??
            originalOrg?.organisation_type_id ??
            0;
          const orgType =
            removed?.OrganisationType ??
            removed?.organisation_type ??
            originalOrg?.OrganisationType ??
            originalOrg?.organisation_type ??
            '';

          const cleanItem: ForcePreferenceItem = {
            ...(originalOrg || {}),
            ...removed,
            id: removedOrgId,
            organisationId: removedOrgId,
            OrganisationId: removedOrgId,
            organisation_id: Number(removedOrgId) || 0,
            organisationName: orgName,
            OrganisationName: orgName,
            organisation_name: orgName,
            force_name: orgName,
            department: orgName,
            post_title: notifTitle,
            notification_title: notifTitle,
            NotificationTitle: notifTitle,
            job_notification_autoid: Number(jobNotifId) || 0,
            JobNotificationAutoId: Number(jobNotifId) || 0,
            organisation_type_id: Number(orgTypeId) || 0,
            OrganisationTypeId: Number(orgTypeId) || 0,
            organisation_type: orgType,
            OrganisationType: orgType,
            preference_order: undefined,
            PreferenceOrder: undefined,
          };

          const updated = [...avail, cleanItem];
          return updated.sort((a, b) => {
            const aId = Number(getOrgIdStr(a)) || 0;
            const bId = Number(getOrgIdStr(b)) || 0;
            return aId - bId;
          });
        }
        return avail;
      });
      this.cdr.detectChanges();
    }
  }

  // ── Reordering (Move Up / Down) ────────────────────────────
  movePreferenceUp(index: number): void {
    if (index <= 0) return;
    const list = [...this.selectedPreferences()];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    const reindexed = list.map((item, idx) => ({ ...item, preference_order: idx + 1 }));
    this.selectedPreferences.set(reindexed);
    this.cdr.detectChanges();
  }

  movePreferenceDown(index: number): void {
    const list = [...this.selectedPreferences()];
    if (index >= list.length - 1) return;
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    const reindexed = list.map((item, idx) => ({ ...item, preference_order: idx + 1 }));
    this.selectedPreferences.set(reindexed);
    this.cdr.detectChanges();
  }

  // ── Drag & Drop Handlers ───────────────────────────────────

  // From Available List
  onDragStartAvailable(event: DragEvent, item: ForcePreferenceItem): void {
    this.draggedAvailableItem = item;
    this.draggedFilledIndex = null;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(item.id));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  // From Filled Preferences (for reordering)
  onDragStartFilled(event: DragEvent, index: number): void {
    this.draggedFilledIndex = index;
    this.draggedAvailableItem = null;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', String(index));
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOverContainer(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.isDraggingOverFilled.set(true);
  }

  onDragLeaveContainer(event: DragEvent): void {
    const target = event.currentTarget as HTMLElement;
    const related = event.relatedTarget as HTMLElement;
    if (!target.contains(related)) {
      this.isDraggingOverFilled.set(false);
    }
  }

  onDropContainer(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOverFilled.set(false);
    this.dragOverFilledIndex = null;

    if (this.draggedAvailableItem) {
      this.addPreference(this.draggedAvailableItem);
      this.draggedAvailableItem = null;
    }
  }

  onDragOverFilledItem(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverFilledIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDropFilledItem(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverFilledIndex = null;
    this.isDraggingOverFilled.set(false);

    if (this.draggedAvailableItem) {
      this.addPreference(this.draggedAvailableItem, targetIndex);
      this.draggedAvailableItem = null;
      return;
    }

    if (this.draggedFilledIndex !== null && this.draggedFilledIndex !== targetIndex) {
      const list = [...this.selectedPreferences()];
      const [moved] = list.splice(this.draggedFilledIndex, 1);
      list.splice(targetIndex, 0, moved);
      const reindexed = list.map((item, idx) => ({ ...item, preference_order: idx + 1 }));
      this.selectedPreferences.set(reindexed);
      this.draggedFilledIndex = null;
      this.cdr.detectChanges();
    }
  }

  onDragEnd(): void {
    this.draggedAvailableItem = null;
    this.draggedFilledIndex = null;
    this.dragOverFilledIndex = null;
    this.isDraggingOverFilled.set(false);
  }

  // ── Navigation & Actions ───────────────────────────────────
  goToPreviousTab(): void {
    this.previousTab.emit();
  }

  onCancelPreferences(): void {
    this.cancelPreferences.emit();
  }

  // ── Build Preference Payload ───────────────────────────────
  buildPreferencePayload(isDraft: boolean = false): any {
    const inputUser = this.userDetails || {};
    const candidateData = this.candidateProfileData() || {};
    const inputPartB =
      this.rawPartBDetails ||
      inputUser.partBDetails ||
      inputUser.AdditionalProfileDetails ||
      inputUser.additional_profile_details ||
      candidateData.AdditionalProfileDetails ||
      candidateData.additional_profile_details ||
      {};

    let sessionUser: any = null;
    try {
      const stored = sessionStorage.getItem('userdata');
      if (stored) {
        const dec = CryptoHelper.decrypt(stored);
        sessionUser = typeof dec === 'string' ? JSON.parse(dec) : dec;
        if (typeof sessionUser === 'string') sessionUser = JSON.parse(sessionUser);
      }
    } catch {}
    if (!sessionUser) {
      try {
        const plain = sessionStorage.getItem('user');
        if (plain) sessionUser = JSON.parse(plain);
      } catch {}
    }

    const u = {
      ...(sessionUser || {}),
      ...candidateData,
      ...inputUser,
    };

    const pB = {
      ...inputPartB,
      ...(candidateData.AdditionalProfileDetails || {}),
      ...(inputUser.AdditionalProfileDetails || {}),
    };

    const agniveerAutoId = Number(
      this.agniveerAutoid ||
        u.agniveer_autoid ||
        u.AgniveerAutoId ||
        u.AutoId ||
        u.userautoId ||
        sessionStorage.getItem('agniveer_autoid') ||
        sessionStorage.getItem('userautoId') ||
        0,
    );

    const agniveerIdNo = String(
      u.Agniveer_Id_No ||
        u.AgniveerIdNo ||
        u.agniveer_id_no ||
        u.agniveerId ||
        u.userId ||
        sessionStorage.getItem('agniveerId') ||
        sessionStorage.getItem('userId') ||
        sessionStorage.getItem('agniveer_id_no') ||
        '',
    ).trim();

    const name = String(u.Name || u.name || u.candidate_name || u.userName || '').trim();

    const gender = String(u.Gender || u.gender || '').trim();

    let genderCode = String(u.gender_code || u.GenderCode || '').trim();
    if (!genderCode && gender) {
      const gUpper = gender.toUpperCase();
      if (gUpper.startsWith('M')) genderCode = 'M';
      else if (gUpper.startsWith('F')) genderCode = 'F';
      else genderCode = 'O';
    }

    const forceTypeId = Number(
      u.agniveer_force_type_id ||
        u.AgniveerForceTypeId ||
        u.forceTypeId ||
        u.force_type_id ||
        sessionStorage.getItem('forceTypeId') ||
        0,
    );

    const forceType = String(
      u.AgniveerForceType ||
        u.agniveer_force_type ||
        u.forceType ||
        u.force_type ||
        u.ArmedForceWhereRemainedPosted ||
        sessionStorage.getItem('forceType') ||
        '',
    ).trim();

    const categoryId = Number(
      pB.category_id || pB.CategoryId || u.category_id || u.CategoryId || u.category,
    );

    const category = String(
      pB.category ||
        pB.Category ||
        pB.categoryName ||
        pB.CategoryName ||
        u.category ||
        u.Category ||
        '',
    ).trim();

    const rcategoryId = Number(
      pB.rcategory_id ||
        pB.RCategoryId ||
        pB.rCategoryId ||
        pB.rcategoryId ||
        u.rcategory_id ||
        u.RCategoryId ||
        u.rcategory,
    );

    const rcategory = String(
      pB.rcategory ||
        pB.RCategory ||
        pB.rCategory ||
        pB.rcategoryName ||
        pB.RcategoryName ||
        u.rcategory ||
        u.RCategory ||
        '',
    ).trim();

    const stateId = Number(
      pB.state_id ||
        pB.StateId ||
        pB.stateId ||
        pB.state_cd ||
        pB.State_cd ||
        u.state_id ||
        u.StateId ||
        u.stateId,
    );

    const state = String(
      pB.state ||
        pB.State ||
        pB.state_name ||
        pB.StateName ||
        pB.domicile_state ||
        pB.DomicileState ||
        pB.domicileState ||
        u.state ||
        u.State ||
        '',
    ).trim();

    const organisationsPayload = this.selectedPreferences().map((item: any) => {
      const raw = item.raw || {};
      return {
        job_notification_autoid: Number(
          item.job_notification_autoid ??
            raw.job_notification_autoid ??
            raw.JobNotificationAutoId ??
            raw.job_notification_id ??
            0,
        ),
        notification_title: String(
          item.notification_title ??
            raw.notification_title ??
            raw.NotificationTitle ??
            item.post_title ??
            '',
        ).trim(),
        organisation_type_id: Number(
          item.organisation_type_id ?? raw.organisation_type_id ?? raw.OrganisationTypeId ?? 0,
        ),
        organisation_type: String(
          item.organisation_type ?? raw.organisation_type ?? raw.OrganisationType ?? '',
        ).trim(),
        organisation_id: Number(
          item.organisation_id ??
            item.organisationId ??
            raw.organisation_id ??
            raw.OrganisationId ??
            item.id ??
            0,
        ),
        organisation_name: String(
          item.organisation_name ??
            item.organisationName ??
            raw.organisation_name ??
            raw.OrganisationName ??
            item.force_name ??
            '',
        ).trim(),
      };
    });

    const round =
      this.activeRound() ||
      Number(
        u.round ??
          u.Round ??
          candidateData.round ??
          candidateData.Round ??
          pB.round ??
          pB.Round ??
          sessionStorage.getItem('round'),
      );

    return {
      agniveer_autoid: agniveerAutoId,
      Agniveer_Id_No: agniveerIdNo,
      Name: name,
      Gender: gender,
      gender_code: genderCode,
      agniveer_force_type_id: forceTypeId,
      agniveer_force_type: forceType,
      category_id: categoryId,
      category: category,
      rcategory_id: rcategoryId,
      rcategory: rcategory,
      state_id: stateId,
      state: state,
      round: round,
      organisations: organisationsPayload,
      is_draftsave: isDraft,
    };
  }

  // ── Save Preferences via API ───────────────────────────────
  savePreferences(isDraft: boolean = false): void {
    if (this.selectedPreferences().length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Preferences Selected',
        text: isDraft
          ? 'Please select at least one organisation preference before saving as draft.'
          : 'Please select at least one organisation preference before submitting your application.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    const payload = this.buildPreferencePayload(isDraft);
    // return console.log('AgniveerPreferenceAdd payload:', payload);
    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));
    this.isSaving.set(true);

    this.myProfileService.AgniveerPreferenceAdd(JSON.stringify(encryptedPayload)).subscribe({
      next: (response: any) => {
        this.isSaving.set(false);
        this.cdr.detectChanges();
        // console.log(response, 'response');

        const isSuccess =
          response?.code === 1 || response?.success === true || response?.status === true;
        const msg =
          response?.message ||
          response?.msg ||
          (isDraft
            ? 'Your preferences draft has been saved successfully.'
            : 'Your application with selected preferences has been submitted successfully.');

        if (response?.code === 1 && isDraft) {
          this.isDraftSave.set(true);
        }
        if (isSuccess || response?.code === 1) {
          Swal.fire({
            icon: 'success',
            title: isDraft ? 'Draft Saved' : 'Application Submitted!',
            text: msg,
            confirmButtonColor: '#355f2d',
            timer: isDraft ? 2500 : 3500,
          }).then(() => {
            if (isDraft) {
              this.cancelPreferences.emit();
            }
          });
        } else {
          Swal.fire({
            icon: 'info',
            title: isDraft ? 'Draft Saved' : 'Application Status',
            text: msg,
            confirmButtonColor: '#355f2d',
          });
        }
      },
      error: (error: any) => {
        this.isSaving.set(false);
        console.error('AgniveerPreferenceAdd error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text:
            typeof error === 'string'
              ? error
              : error?.message || 'Failed to save preferences. Please try again.',
          confirmButtonColor: '#355f2d',
        });
      },
    });
  }

  // Direct aliases
  AgniveerPreferenceAdd(isDraft: boolean = false): void {
    this.savePreferences(isDraft);
  }

  UpdateAgniveerPreference(isDraft: boolean = false): void {
    this.savePreferences(isDraft);
  }

  AgniveerPreferenceAddOrUpdate(isDraft: boolean = false): void {
    this.savePreferences(isDraft);
  }

  onSaveDraft(): void {
    this.savePreferences(false);
  }

  onSubmitApplication(): void {
    if (this.selectedPreferences().length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Preferences Selected',
        text: 'Please select at least one organisation preference before submitting your application.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    Swal.fire({
      title: 'Submit Application?',
      text: `You have selected ${this.selectedPreferences().length} organisation preference(s). Are you sure you want to submit your application?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#355f2d',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Submit Application',
      cancelButtonText: 'Review Again',
    }).then((res) => {
      if (res.isConfirmed) {
        this.savePreferences(true);
      }
    });
  }
}
