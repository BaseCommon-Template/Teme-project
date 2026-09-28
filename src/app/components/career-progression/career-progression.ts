import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { MasterService } from '../../core/services/master';
import { AuthService } from '../../services/auth';
import { MyProfileService } from '../../services/myprofile/myprofile';
import { CommonService } from '../../services/common-service';
import { ScheduleService } from '../../services/schedule/schedule';
import { AgniveerUploadService } from '../../services/agniveer-upload/agniveer-upload';
import moment from 'moment';
import {
  AgniveerProfile,
  AgniveerUpdateAdditionalDetailsPayload,
} from '../../services/interfaces/agniveer.model';
import {
  Nationality,
  Religion,
  Category,
  DomicileStateUT,
  DomicileDistrict,
  PoliceStation,
} from '../../core/models/masters.model';
import { CryptoHelper } from '../../helpers/crypto-helper';
// import { environment } from '../../../environments/environment';
import { Preferences } from './preferences/preferences';
import { environment } from '../../../environments/environment';

export type ActiveTabType = 'part-a' | 'part-b' | 'preference';
export type { ForcePreferenceItem } from './preferences/preferences';

@Component({
  selector: 'app-career-progression',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Preferences
  ],
  templateUrl: './career-progression.html',
  styleUrl: './career-progression.css',
})
export class CareerProgression implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly masterService = inject(MasterService);
  private readonly authService = inject(AuthService);
  private readonly myProfileService = inject(MyProfileService);
  private readonly commonService = inject(CommonService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly agniveerUploadService = inject(AgniveerUploadService);

  // Active Tab: 'part-a' | 'part-b' | 'preference'
  readonly activeTab = signal<ActiveTabType>('part-a');

  readonly profile = signal<AgniveerProfile | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);

  // Edit mode for Part - B
  readonly isEditMode = signal<boolean>(false);
  readonly isDataAlreadySaved = signal<boolean>(false);
  readonly canEditProfile = signal<boolean>(false);
  readonly activeSchedule = signal<any>(null);
  readonly isOpenPartB = signal<boolean>(false);
  readonly isOpenPartC = signal<boolean>(false);
  agniveerAutoid: number = 1;

  // Master signals
  readonly nationalities = signal<Nationality[]>([]);
  readonly religions = signal<Religion[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly states = signal<DomicileStateUT[]>([]);
  readonly districts = signal<DomicileDistrict[]>([]);
  readonly policeStations = signal<PoliceStation[]>([]);

  // Raw Agniveer response data signal
  readonly agniveerData = signal<any>(null);

  // Signature preview & uploaded path
  readonly signaturePreview = signal<string | null>(null);
  readonly uploadedSignaturePath = signal<string | null>(null);

  // Cached raw Part B details from backend
  rawPartBDetails: any = null;

  // Full hierarchical state, district records from CommonService
  private stateRecords: any[] = [];

  // Part - B Reactive Form
  additionalForm!: FormGroup;
  isSubmitted = false;

  get fc() {
    return this.additionalForm.controls;
  }

  ngOnInit(): void {
    this.initForm();
    this.isLoading.set(true);
    this.loadActiveSchedule();
    this.loadMasterData();
    this.fetchStatesFromCommonService();
    this.fetchAgniveerDetails();
    this.getCentralCategory({}, 0);
  }

  private isTruthy(val: any): boolean {
    if (val === true || val === 1) return true;
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      return s === 'true' || s === '1';
    }
    return false;
  }

  private checkIsOpenPartB(item: any): boolean {
    if (!item) return false;
    const val =
      item.open_part_b ??
      item.OpenPartB ??
      item.openPartB ??
      item.Open_Part_B ??
      item.open_b ??
      item.OpenB;
    return this.isTruthy(val);
  }

  private checkIsOpenPartC(item: any): boolean {
    if (!item) return false;
    const val =
      item.open_part_c ??
      item.OpenPartC ??
      item.openPartC ??
      item.Open_Part_C ??
      item.open_c ??
      item.OpenC;
    return this.isTruthy(val);
  }

  /**
   * Fetch active schedule and check open_part_b and open_part_c availability
   */
  loadActiveSchedule(navigateToPartB: boolean = false): void {
    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    if (navigateToPartB) {
      Swal.fire({
        title: 'Verifying Schedule...',
        text: 'Please wait while we check schedule availability.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
    }

    this.scheduleService.getActiveSchedule(encryptedPayload).subscribe({
      next: (res: any) => {
        if (navigateToPartB) Swal.close();
        let scheduleItem: any = null;

        if (res?.code === 1 && res?.data) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const data = typeof dec === 'string' ? JSON.parse(dec) : dec;
            // console.log('🔥 getActiveSchedule FULL RESPONSE:', data);
            const schedule =
              data?.Schedule ?? data?.schedule ?? data?.Table ?? data?.Schedules ?? data;

            if (Array.isArray(schedule)) {
              scheduleItem = schedule.find((s: any) => this.isScheduleActiveFlag(s)) || schedule[0];
            } else if (
              schedule &&
              typeof schedule === 'object' &&
              Object.keys(schedule).length > 0
            ) {
              scheduleItem = schedule;
            }
          } catch (e) {
            console.error('Error decrypting schedule:', e);
          }
        }

        if (!scheduleItem) {
          this.isOpenPartB.set(false);
          this.isOpenPartC.set(false);
          this.canEditProfile.set(false);
          this.cdr.detectChanges();
          if (navigateToPartB) {
            Swal.fire({
              icon: 'warning',
              title: 'No Active Schedule',
              text: 'No active schedule was found. Profile editing is currently unavailable.',
              confirmButtonColor: '#1C4587',
            });
          }
          return;
        }

        this.activeSchedule.set(scheduleItem);

        const isActive = this.isScheduleActiveFlag(scheduleItem);
        const openB = isActive && this.checkIsOpenPartB(scheduleItem);
        const openC = isActive && this.checkIsOpenPartC(scheduleItem);

        this.isOpenPartB.set(openB);
        this.isOpenPartC.set(openC);

        // Date validity check for editing Part B
        if (openB) {
          const openingDateVal = scheduleItem?.ProfileEditOpeningDate;
          const closingDateVal = scheduleItem?.ProfileEditClosingDate;

          if (openingDateVal && closingDateVal) {
            const now = moment();
            const openMoment = this.parseWithMoment(openingDateVal, false);
            const closeMoment = this.parseWithMoment(closingDateVal, true);

            if (openMoment?.isValid() && closeMoment?.isValid()) {
              if (now.isSameOrAfter(openMoment) && now.isSameOrBefore(closeMoment)) {
                this.canEditProfile.set(true);
              } else {
                this.canEditProfile.set(false);
              }
            } else {
              this.canEditProfile.set(true);
            }
          } else {
            this.canEditProfile.set(true);
          }
        } else {
          this.canEditProfile.set(false);
        }

        this.cdr.detectChanges();

        if (navigateToPartB) {
          if (!openB) {
            Swal.fire({
              icon: 'warning',
              title: 'Part B Not Open',
              text: 'Part B is currently not enabled in the active schedule.',
              confirmButtonColor: '#1C4587',
            });
            return;
          }
          if (!this.canEditProfile()) {
            Swal.fire({
              icon: 'warning',
              title: 'Profile Edit Closed',
              text: 'The profile edit window is currently not active.',
              confirmButtonColor: '#1C4587',
            });
            return;
          }
          this.activeTab.set('part-b');
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        if (navigateToPartB) Swal.close();
        console.error('Error fetching active schedule:', err);
        this.isOpenPartB.set(false);
        this.isOpenPartC.set(false);
        this.canEditProfile.set(false);
        this.cdr.detectChanges();
        if (navigateToPartB) {
          Swal.fire({
            icon: 'error',
            title: 'Schedule Verification Error',
            text: 'Unable to verify schedule status. Please try again later.',
            confirmButtonColor: '#1C4587',
          });
        }
      },
    });
  }

  setActiveTab(tab: ActiveTabType): void {
    if (tab === 'part-b' && !this.isOpenPartB()) {
      Swal.fire({
        icon: 'warning',
        title: 'Part B Not Open',
        text: 'Part B is currently not enabled in the active schedule.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }

    if (tab === 'preference' && !this.isOpenPartC()) {
      Swal.fire({
        icon: 'warning',
        title: 'Preferences Not Open',
        text: 'Preferences (Part C) is currently not enabled in the active schedule.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }

    if (tab === 'preference' && !this.isDataAlreadySaved()) {
      Swal.fire({
        icon: 'info',
        title: 'First Complete Profile',
        text: 'Please complete and submit your Part B profile details first before accessing preferences.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }

    if (tab === 'part-b') {
      this.checkScheduleAndNavigateToPartB();
      return;
    }

    this.activeTab.set(tab);
    this.cdr.detectChanges();
  }

  onPartANext(): void {
    if (this.isOpenPartB()) {
      this.setActiveTab('part-b');
    } else if (this.isOpenPartC()) {
      this.setActiveTab('preference');
    }
  }

  onPreferencePrevious(): void {
    if (this.isOpenPartB()) {
      this.setActiveTab('part-b');
    } else {
      this.setActiveTab('part-a');
    }
  }

  getAgniveerCombinedDetails(): any {
    const rawData = this.agniveerData() || {};
    const partB = this.rawPartBDetails || {};
    const formVals = this.additionalForm ? this.additionalForm.getRawValue() : {};
    return {
      ...rawData,
      ...partB,
      ...formVals,
      partBDetails: partB,
    };
  }

  /**
   * Check if schedule is active and today's date lies within opening and closing date period.
   * If yes, user can edit their profile; otherwise show alert.
   */
  checkScheduleAndNavigateToPartB(): void {
    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    Swal.fire({
      title: 'Verifying Schedule...',
      text: 'Please wait while we check schedule availability.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.scheduleService.getActiveSchedule(encryptedPayload).subscribe({
      next: (res: any) => {
        Swal.close();
        let scheduleItem: any = null;

        if (res?.code === 1 && res?.data) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const data = typeof dec === 'string' ? JSON.parse(dec) : dec;
            // console.log(data, 'data');
            const schedule =
              data?.Schedule ?? data?.schedule ?? data?.Table ?? data?.Schedules ?? data;

            if (Array.isArray(schedule)) {
              scheduleItem = schedule.find((s: any) => this.isScheduleActiveFlag(s)) || schedule[0];
            } else if (
              schedule &&
              typeof schedule === 'object' &&
              Object.keys(schedule).length > 0
            ) {
              scheduleItem = schedule;
            }
          } catch (e) {
            console.error('Error decrypting schedule:', e);
          }
        }

        if (!scheduleItem) {
          this.canEditProfile.set(false);
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'warning',
            title: 'No Active Schedule',
            text: 'No active schedule was found. Profile editing is currently unavailable.',
            confirmButtonColor: '#1C4587',
          });
          return;
        }

        this.activeSchedule.set(scheduleItem);

        // 1. Check Active key
        const isActive = this.isScheduleActiveFlag(scheduleItem);
        const openB = isActive && this.checkIsOpenPartB(scheduleItem);
        const openC = isActive && this.checkIsOpenPartC(scheduleItem);
        this.isOpenPartB.set(openB);
        this.isOpenPartC.set(openC);

        if (!isActive) {
          console.warn('[Schedule Check] Schedule is inactive (Active != true):', scheduleItem);
          this.canEditProfile.set(false);
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'warning',
            title: 'Schedule Inactive',
            text: 'The schedule is currently inactive. Profile editing is not allowed.',
            confirmButtonColor: '#1C4587',
          });
          return;
        }

        if (!openB) {
          console.warn('[Schedule Check] Part B is not open:', scheduleItem);
          this.canEditProfile.set(false);
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'warning',
            title: 'Part B Closed',
            text: 'Part B is currently not enabled in the active schedule.',
            confirmButtonColor: '#1C4587',
          });
          return;
        }

        // 2. Check ONLY ProfileEditOpeningDate and ProfileEditClosingDate keys
        const openingDateVal = scheduleItem?.ProfileEditOpeningDate;
        const closingDateVal = scheduleItem?.ProfileEditClosingDate;

        if (!openingDateVal || !closingDateVal) {
          console.warn(
            '[Schedule Check] Missing ProfileEditOpeningDate or ProfileEditClosingDate:',
            {
              ProfileEditOpeningDate: openingDateVal,
              ProfileEditClosingDate: closingDateVal,
            },
          );
          this.canEditProfile.set(false);
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'warning',
            title: 'Dates Missing',
            text: 'Profile edit opening or closing date is missing in the schedule.',
            confirmButtonColor: '#1C4587',
          });
          return;
        }

        // 3. Compare with current date using moment.js
        const now = moment();
        const openMoment = this.parseWithMoment(openingDateVal, false);
        const closeMoment = this.parseWithMoment(closingDateVal, true);

        // console.log('[Schedule Check] Active:', isActive);
        // console.log('[Schedule Check] Current time:', now.format('YYYY-MM-DD HH:mm:ss'));
        // console.log(
        //   '[Schedule Check] ProfileEditOpeningDate:',
        //   openingDateVal,
        //   '=> Parsed:',
        //   openMoment?.format('YYYY-MM-DD HH:mm:ss'),
        // );
        // console.log(
        //   '[Schedule Check] ProfileEditClosingDate:',
        //   closingDateVal,
        //   '=> Parsed:',
        //   closeMoment?.format('YYYY-MM-DD HH:mm:ss'),
        // );

        if (!openMoment || !openMoment.isValid() || !closeMoment || !closeMoment.isValid()) {
          this.canEditProfile.set(false);
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'warning',
            title: 'Invalid Dates',
            text: 'Invalid ProfileEditOpeningDate or ProfileEditClosingDate in schedule.',
            confirmButtonColor: '#1C4587',
          });
          return;
        }

        if (openMoment && openMoment.isValid() && now.isBefore(openMoment)) {
          console.warn('[Schedule Check] Today is before ProfileEditOpeningDate');
          this.canEditProfile.set(false);
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'warning',
            title: 'Profile Edit Not Open',
            text: `Profile editing is not allowed. The editing window opens on ${openMoment.format('DD/MM/YYYY')}.`,
            confirmButtonColor: '#1C4587',
          });
          return;
        }

        if (
          closeMoment &&
          closeMoment.isValid() &&
          now.isAfter(closeMoment) &&
          this.agniveerData()?.Agniveer?.DraftSave === 0
        ) {
          // console.warn('[Schedule Check] Today is after ProfileEditClosingDate');
          this.canEditProfile.set(false);
          this.cdr.detectChanges();
          Swal.fire({
            icon: 'warning',
            title: 'Profile Edit Window Closed',
            text: `Profile editing is closed. The deadline was ${closeMoment.format('DD/MM/YYYY')}.`,
            confirmButtonColor: '#1C4587',
          });
          return;
        }

        // Current date lies between ProfileEditOpeningDate and ProfileEditClosingDate!
        // console.log(
        //   '[Schedule Check] Date lies between ProfileEditOpeningDate and ProfileEditClosingDate. User can edit profile.',
        // );
        this.canEditProfile.set(true);
        this.activeTab.set('part-b');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        Swal.close();
        console.error('Error fetching active schedule:', err);
        this.canEditProfile.set(false);
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Schedule Verification Error',
          text: 'Unable to verify schedule status. Please try again later.',
          confirmButtonColor: '#1C4587',
        });
      },
    });
  }

  private isScheduleActiveFlag(item: any): boolean {
    if (!item) return false;
    const val = item.Active ?? item.active ?? item.IsActive ?? item.isActive;
    return val === true || val === 1 || val === '1' || val === 'true';
  }

  private parseWithMoment(dateVal: any, isEndOfDay: boolean = false): moment.Moment | null {
    if (!dateVal) return null;
    const s = String(dateVal).trim();
    if (!s) return null;

    let m: moment.Moment;
    // If format is YYYY-MM-DD or starts with YYYY-MM-DD (e.g. 2026-09-11T18:30:00Z)
    if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(s)) {
      m = moment(s.slice(0, 10), 'YYYY-MM-DD');
    } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(s)) {
      m = moment(s.slice(0, 10), ['DD/MM/YYYY', 'DD-MM-YYYY']);
    } else {
      m = moment(s);
    }

    if (!m.isValid()) return null;
    return isEndOfDay ? m.endOf('day') : m.startOf('day');
  }

  private formatDisplayDate(dateVal: any): string {
    if (!dateVal) return '';
    const m = this.parseWithMoment(dateVal);
    if (!m || !m.isValid()) return String(dateVal);
    return m.format('DD/MM/YYYY');
  }

  initForm(): void {
    this.additionalForm = this.fb.group({
      mothersName: ['', [Validators.required]],
      nationality: ['Indian', [Validators.required]],
      religion: ['', [Validators.required]],
      category: ['', [Validators.required]],
      categoryName: [''],
      rcategory: ['', Validators.required],
      rcategoryName: [''],
      domicileState: ['', [Validators.required]],
      domicileDistrict: ['', [Validators.required]],
      policeStation: ['', [Validators.required]],
    });
    this.additionalForm.disable();
  }

  enableEditMode(): void {
    if (!this.canEditProfile()) {
      Swal.fire({
        icon: 'warning',
        title: 'Editing Not Allowed',
        text: 'Profile editing is closed because the schedule is inactive or outside the active window.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }
    if (this.isDataAlreadySaved()) {
      Swal.fire({
        icon: 'info',
        title: 'Update Not Allowed',
        text: 'Data already saved; update is not allowed.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }
    this.isEditMode.set(true);
    this.additionalForm.enable();
    this.loadActiveScheduleForEdit();
    this.cdr.detectChanges();
  }

  private loadActiveScheduleForEdit(): void {
    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    Swal.fire({
      title: 'Verifying Schedule...',
      text: 'Please wait while we check the Part B submission window.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.scheduleService.getActiveSchedule(encryptedPayload).subscribe({
      next: (res: any) => {
        Swal.close();

        let scheduleItem: any = null;

        if (res?.code === 1 && res?.data) {
          try {
            const dec = CryptoHelper.decrypt(res.data);
            const data = typeof dec === 'string' ? JSON.parse(dec) : dec;

            const schedule =
              data?.Schedule ?? data?.schedule ?? data?.Table ?? data?.Schedules ?? data;

            if (Array.isArray(schedule)) {
              scheduleItem = schedule.find((s: any) => this.isScheduleActiveFlag(s)) || schedule[0];
            } else if (
              schedule &&
              typeof schedule === 'object' &&
              Object.keys(schedule).length > 0
            ) {
              scheduleItem = schedule;
            }
          } catch (error) {
            console.error('Error decrypting schedule:', error);
          }
        }

        if (!scheduleItem) {
          this.canEditProfile.set(false);

          Swal.fire({
            icon: 'warning',
            title: 'No Active Schedule',
            text: 'No active schedule was found. Part B submission is currently unavailable.',
            confirmButtonColor: '#1C4587',
          });

          return;
        }

        // Active check
        const isActive = this.isScheduleActiveFlag(scheduleItem);

        // Part B enabled check
        const isPartBOpen = isActive && this.checkIsOpenPartB(scheduleItem);

        if (!isPartBOpen) {
          this.canEditProfile.set(false);

          Swal.fire({
            icon: 'warning',
            title: 'Part B Closed',
            text: 'Part B submission is currently closed.',
            confirmButtonColor: '#1C4587',
          });

          return;
        }

        // Dates from getActiveSchedule response
        const openingDateVal = scheduleItem?.ProfileEditOpeningDate;
        const closingDateVal = scheduleItem?.ProfileEditClosingDate;

        if (!openingDateVal || !closingDateVal) {
          this.canEditProfile.set(false);

          Swal.fire({
            icon: 'warning',
            title: 'Dates Missing',
            text: 'Part B opening or closing date is missing.',
            confirmButtonColor: '#1C4587',
          });

          return;
        }

        const now = moment();

        const openMoment = this.parseWithMoment(openingDateVal, false);

        const closeMoment = this.parseWithMoment(closingDateVal, true);

        if (!openMoment || !openMoment.isValid() || !closeMoment || !closeMoment.isValid()) {
          this.canEditProfile.set(false);

          Swal.fire({
            icon: 'warning',
            title: 'Invalid Dates',
            text: 'Invalid Part B opening or closing date.',
            confirmButtonColor: '#1C4587',
          });

          return;
        }

        if (now.isBefore(openMoment)) {
          this.canEditProfile.set(false);

          Swal.fire({
            icon: 'warning',
            title: 'Part B Not Open',
            text: `Part B submission will open on ${openMoment.format('DD/MM/YYYY')}.`,
            confirmButtonColor: '#1C4587',
          });

          return;
        }

        if (now.isAfter(closeMoment)) {
          this.canEditProfile.set(false);

          Swal.fire({
            icon: 'warning',
            title: 'Part B Submission Closed',
            text: `Part B submission closed on ${closeMoment.format('DD/MM/YYYY')}.`,
            confirmButtonColor: '#1C4587',
          });

          return;
        }

        this.canEditProfile.set(true);
        this.activeSchedule.set(scheduleItem);

        this.isEditMode.set(true);
        this.additionalForm.enable();

        this.cdr.detectChanges();
      },

      error: (err: any) => {
        Swal.close();

        console.error('Error fetching active schedule for Part B:', err);

        this.canEditProfile.set(false);

        Swal.fire({
          icon: 'error',
          title: 'Schedule Check Failed',
          text: 'Unable to verify Part B submission window. Please try again.',
          confirmButtonColor: '#1C4587',
        });
      },
    });
  }

  isPartBUpdateAllowed(): boolean {
    const closingDate =
      this.activeSchedule()?.ClosingDate ?? this.activeSchedule()?.ProfileEditClosingDate;

    if (!closingDate) {
      return false;
    }

    const now = moment();
    const closeMoment = this.parseWithMoment(closingDate, true);

    if (!closeMoment || !closeMoment.isValid()) {
      return false;
    }

    return now.isSameOrBefore(closeMoment);
  }

  cancelEditMode(): void {
    this.isEditMode.set(false);
    this.isSubmitted = false;
    this.additionalForm.disable();
    if (this.rawPartBDetails) {
      this.patchAdditionalProfileDetails(this.rawPartBDetails);
    }
    this.cdr.detectChanges();
  }

  fetchStatesFromCommonService(): void {
    const payload = {
      is_draft: false,
      page_number: 1,
      record_per_page: 50,
    };
    const jsonPayload = JSON.stringify(payload);
    const encryptedPayload = CryptoHelper.encrypt(jsonPayload);

    this.commonService.getState(JSON.stringify(encryptedPayload)).subscribe({
      next: (response: any) => {
        if (response?.code) {
          let records: any[] = [];
          try {
            const decrypted = CryptoHelper.decrypt(response.data);
            const parsed = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
            records = parsed?.records || (Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            console.error('Error decrypting or parsing getState response:', e);
          }

          if (Array.isArray(records) && records.length > 0) {
            this.stateRecords = records;
            // console.log(this.stateRecords);
            const stateOptions: DomicileStateUT[] = records.map((st: any) => ({
              _id: String(st.state_cd),
              state_name: st.state_name,
              name: st.state_name,
              state_code: String(st.state_cd),
            }));
            // console.log(stateOptions);
            this.states.set(stateOptions);

            this.syncStateAndDistrictFromCommonService();
          }
        }
      },
      error: (error: any) => {
        console.error('Error fetching states from CommonService:', error);
      },
    });
  }

  syncStateAndDistrictFromCommonService(): void {
    if (!this.stateRecords || this.stateRecords.length === 0) return;

    const rawState =
      this.rawPartBDetails?.State ??
      this.rawPartBDetails?.state ??
      this.rawPartBDetails?.domicile_state ??
      this.rawPartBDetails?.DomicileState ??
      this.rawPartBDetails?.domicile_state_or_ut ??
      this.rawPartBDetails?.DomicileStateOrUt ??
      this.rawPartBDetails?.state_name ??
      this.rawPartBDetails?.StateName ??
      this.rawPartBDetails?.StateId ??
      this.rawPartBDetails?.state_id ??
      this.rawPartBDetails?.State_cd ??
      this.rawPartBDetails?.state_cd ??
      this.additionalForm?.get('domicileState')?.value;

    const rawStateId =
      this.rawPartBDetails?.StateId ??
      this.rawPartBDetails?.state_id ??
      this.rawPartBDetails?.State_cd ??
      this.rawPartBDetails?.state_cd ??
      this.rawPartBDetails?.state_code ??
      this.rawPartBDetails?.State_ID;

    const rawDistrict =
      this.rawPartBDetails?.District ??
      this.rawPartBDetails?.district ??
      this.rawPartBDetails?.domicile_district ??
      this.rawPartBDetails?.DomicileDistrict ??
      this.rawPartBDetails?.district_name ??
      this.rawPartBDetails?.DistrictName ??
      this.rawPartBDetails?.DistrictId ??
      this.rawPartBDetails?.district_id ??
      this.rawPartBDetails?.District_cd ??
      this.rawPartBDetails?.district_cd ??
      this.additionalForm?.get('domicileDistrict')?.value;

    const rawDistrictId =
      this.rawPartBDetails?.DistrictId ??
      this.rawPartBDetails?.district_id ??
      this.rawPartBDetails?.District_cd ??
      this.rawPartBDetails?.district_cd ??
      this.rawPartBDetails?.district_code ??
      this.rawPartBDetails?.District_ID;

    if (!rawState && rawStateId === undefined) return;

    const patchPayload: any = {};

    const matchedState = this.stateRecords.find((st: any) => {
      if (!st) return false;
      const sName = st.state_name ? String(st.state_name).trim().toLowerCase() : '';
      const rName = rawState ? String(rawState).trim().toLowerCase() : '';
      const exactMatch = sName && rName && sName === rName;
      const containsMatch = sName && rName && (sName.includes(rName) || rName.includes(sName));
      const cdMatch =
        st.state_cd !== undefined &&
        (String(st.state_cd) === String(rawState) ||
          (rawStateId !== undefined && String(st.state_cd) === String(rawStateId)));
      return exactMatch || containsMatch || cdMatch;
    });

    if (matchedState) {
      patchPayload.domicileState = matchedState.state_name;
      this.getCentralCategory(matchedState, 1);

      if (
        !this.states().some(
          (s) => (s.state_name || s.name)?.toLowerCase() === matchedState.state_name.toLowerCase(),
        )
      ) {
        this.states.update((list) => [
          ...list,
          {
            _id: String(matchedState.state_cd),
            state_name: matchedState.state_name,
            name: matchedState.state_name,
            state_code: String(matchedState.state_cd),
          },
        ]);
      }

      if (Array.isArray(matchedState.districts) && matchedState.districts.length > 0) {
        const districtList: DomicileDistrict[] = matchedState.districts.map((d: any) => ({
          _id: String(d.district_cd),
          district_name: d.district_name,
          name: d.district_name,
          state_id: String(matchedState.state_cd),
          police_stations: d.police_stations,
        }));
        this.districts.set(districtList);

        if (rawDistrict || rawDistrictId !== undefined) {
          const matchedDist = matchedState.districts.find((d: any) => {
            if (!d) return false;
            const dName = d.district_name ? String(d.district_name).trim().toLowerCase() : '';
            const rDist = rawDistrict ? String(rawDistrict).trim().toLowerCase() : '';
            const exactMatch = dName && rDist && dName === rDist;
            const containsMatch =
              dName && rDist && (dName.includes(rDist) || rDist.includes(dName));
            const cdMatch =
              d.district_cd !== undefined &&
              (String(d.district_cd) === String(rawDistrict) ||
                (rawDistrictId !== undefined && String(d.district_cd) === String(rawDistrictId)));
            return exactMatch || containsMatch || cdMatch;
          });

          if (matchedDist) {
            patchPayload.domicileDistrict = matchedDist.district_name;

            if (
              Array.isArray(matchedDist.police_stations) &&
              matchedDist.police_stations.length > 0
            ) {
              const policeStationList: PoliceStation[] = matchedDist.police_stations.map(
                (ps: any) => ({
                  _id: String(ps.ps_cd),
                  name: ps.ps_name,
                  police_station_name: ps.ps_name,
                  district_id: String(ps.district_cd ?? matchedDist.district_cd),
                }),
              );
              this.policeStations.set(policeStationList);
            }

            const rawPs =
              this.rawPartBDetails?.PoliceStation ??
              this.rawPartBDetails?.police_station ??
              this.rawPartBDetails?.Police_Station;
            const rawPsId =
              this.rawPartBDetails?.PoliceStationId ??
              this.rawPartBDetails?.police_station_id ??
              this.rawPartBDetails?.Police_Station_Id;

            if (rawPs && String(rawPs).trim() && String(rawPs).trim() !== '—') {
              let psValue = String(rawPs).trim();
              if (
                Array.isArray(matchedDist.police_stations) &&
                matchedDist.police_stations.length > 0
              ) {
                const matchedPs = matchedDist.police_stations.find((ps: any) => {
                  if (!ps) return false;
                  const psNameMatch =
                    ps.ps_name &&
                    String(ps.ps_name).trim().toLowerCase() === String(rawPs).trim().toLowerCase();
                  const psCdMatch =
                    ps.ps_cd !== undefined &&
                    (String(ps.ps_cd) === String(rawPs) ||
                      (rawPsId !== undefined && String(ps.ps_cd) === String(rawPsId)));
                  return psNameMatch || psCdMatch;
                });
                if (matchedPs) {
                  psValue = matchedPs.ps_name;
                }
              }
              patchPayload.policeStation = psValue;
              if (
                !this.policeStations().some(
                  (p) => (p.police_station_name || p.name)?.toLowerCase() === psValue.toLowerCase(),
                )
              ) {
                this.policeStations.update((list) => [
                  ...list,
                  {
                    _id: String(rawPsId || list.length + 1),
                    name: psValue,
                    police_station_name: psValue,
                    district_id: String(matchedDist.district_cd),
                  },
                ]);
              }
            }
          } else if (
            rawDistrict &&
            isNaN(Number(rawDistrict)) &&
            String(rawDistrict).trim() !== '—' &&
            String(rawDistrict).trim() !== 'null'
          ) {
            const customDistName = String(rawDistrict).trim();
            patchPayload.domicileDistrict = customDistName;
            this.districts.update((list) => [
              ...list,
              {
                _id: String(rawDistrictId || list.length + 1),
                district_name: customDistName,
                name: customDistName,
                state_id: String(matchedState.state_cd),
              },
            ]);
            const rawPs =
              this.rawPartBDetails?.PoliceStation ??
              this.rawPartBDetails?.police_station ??
              this.rawPartBDetails?.Police_Station;
            if (rawPs && String(rawPs).trim() && String(rawPs).trim() !== '—') {
              patchPayload.policeStation = String(rawPs).trim();
            }
          }
        }
      }
    } else if (
      rawState &&
      isNaN(Number(rawState)) &&
      String(rawState).trim() !== '—' &&
      String(rawState).trim() !== 'null'
    ) {
      const stateNameStr = String(rawState).trim();
      patchPayload.domicileState = stateNameStr;
      if (
        !this.states().some(
          (s) => (s.state_name || s.name)?.toLowerCase() === stateNameStr.toLowerCase(),
        )
      ) {
        this.states.update((list) => [
          ...list,
          {
            _id: String(rawStateId || list.length + 1),
            state_name: stateNameStr,
            name: stateNameStr,
            state_code: String(rawStateId || list.length + 1),
          },
        ]);
      }
      if (
        rawDistrict &&
        isNaN(Number(rawDistrict)) &&
        String(rawDistrict).trim() !== '—' &&
        String(rawDistrict).trim() !== 'null'
      ) {
        const distNameStr = String(rawDistrict).trim();
        patchPayload.domicileDistrict = distNameStr;
        if (
          !this.districts().some(
            (d) => (d.district_name || d.name)?.toLowerCase() === distNameStr.toLowerCase(),
          )
        ) {
          this.districts.update((list) => [
            ...list,
            {
              _id: String(rawDistrictId || list.length + 1),
              district_name: distNameStr,
              name: distNameStr,
              state_id: '1',
            },
          ]);
        }
      }
      const rawPs =
        this.rawPartBDetails?.PoliceStation ??
        this.rawPartBDetails?.police_station ??
        this.rawPartBDetails?.Police_Station;
      if (rawPs && String(rawPs).trim() && String(rawPs).trim() !== '—') {
        patchPayload.policeStation = String(rawPs).trim();
      }
    }

    this.additionalForm.patchValue(patchPayload, { emitEvent: false });
    if (!this.isEditMode()) {
      this.additionalForm.disable();
    }
    this.cdr.detectChanges();
  }

  fetchAgniveerDetails(): void {
    this.isLoading.set(true);
    const currentUser = this.authService.getCurrentUser();
    // console.log('🔥 CURRENT USER:', currentUser);
    const agniveerAutoid =
      currentUser?.agniveer_autoid ||
      currentUser?.autoid ||
      currentUser?.id ||
      currentUser?.userId ||
      (typeof window !== 'undefined' &&
        (sessionStorage.getItem('agniveer_autoid') ||
          sessionStorage.getItem('agniveer_profile_id'))) ||
      1;

    const payload = {
      agniveer_autoid: Number(agniveerAutoid) || 1,
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
              // console.log('🔥 DECRYPTED DATA:', decryptedData);
            } catch (e) {
              console.error('Error decrypting Agniveer details:', e);
              decryptedData = response.data;
            }
          } else if (response) {
            decryptedData = response;
          }

          // Recursively unwrap response envelopes
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
            if (
              unwrapped.data &&
              !unwrapped.AgniveerIdNo &&
              !unwrapped.Name &&
              typeof unwrapped.data === 'object'
            ) {
              unwrapped = Array.isArray(unwrapped.data) ? unwrapped.data[0] : unwrapped.data;
              continue;
            }
            if (unwrapped.Table && Array.isArray(unwrapped.Table) && unwrapped.Table.length > 0) {
              unwrapped = unwrapped.Table[0];
              continue;
            }
            break;
          }
          decryptedData = unwrapped;
          // console.log(decryptedData, 'getAgniveerdetailsByAgniveer_autoid');

          if (
            decryptedData &&
            (decryptedData.AgniveerIdNo ||
              decryptedData.Name ||
              decryptedData.Id ||
              decryptedData.AgniveerAutoId ||
              decryptedData.AdditionalProfileDetails)
          ) {
            if (typeof decryptedData.PhysicalMeasurements === 'string') {
              try {
                decryptedData.PhysicalMeasurements = JSON.parse(decryptedData.PhysicalMeasurements);
              } catch (e) {}
            }
            if (typeof decryptedData.Photo === 'string') {
              try {
                decryptedData.Photo = JSON.parse(decryptedData.Photo);
              } catch (e) {}
            }
            if (typeof decryptedData.AdditionalProfileDetails === 'string') {
              try {
                decryptedData.AdditionalProfileDetails = JSON.parse(
                  decryptedData.AdditionalProfileDetails,
                );
              } catch (e) {}
            }

            this.agniveerData.set(decryptedData);

            const autoIdCandidate =
              decryptedData.AgniveerAutoId ??
              decryptedData.agniveer_autoid ??
              decryptedData.AutoId ??
              decryptedData.Id ??
              agniveerAutoid;
            const parsedAutoId = Number(autoIdCandidate);
            if (!isNaN(parsedAutoId) && parsedAutoId > 0) {
              this.agniveerAutoid = parsedAutoId;
            }

            const draftSaveCheck =
              decryptedData.draft_save ??
              decryptedData.DraftSave ??
              decryptedData.AdditionalProfileDetails?.DraftSave ??
              decryptedData.AdditionalProfileDetails?.draft_save ??
              decryptedData.additional_profile_details?.draft_save;
            if (Number(draftSaveCheck) === 1) {
              this.isDataAlreadySaved.set(true);
            } else {
              this.isDataAlreadySaved.set(false);
            }

            // Map candidate profile
            const mappedProfile: any = {
              _id: String(
                decryptedData?.AgniveerIdNo ||
                  decryptedData?.Id ||
                  decryptedData?.Agniveer?.AgniveerIdNo,
              ),
              name: decryptedData?.Name || '',
              candidate_name: decryptedData?.Name || '',
              father_name: decryptedData?.FatherName || '—',
              mother_name:
                decryptedData?.AdditionalProfileDetails?.MotherName ||
                decryptedData?.additional_profile_details?.MotherName ||
                '—',
              dob: decryptedData?.DateOfBirth || '—',
              gender: decryptedData?.Gender || '—',
              permanent_address: decryptedData?.PermanentAddress || '—',
              mobile: decryptedData?.MobileNumber || '—',
              phone: decryptedData?.MobileNumber || '—',
              email: decryptedData?.EmailId || '—',
              educational_qualification: decryptedData?.EducationalQualification || '—',
              highest_civil_education: decryptedData?.EducationalQualification || '—',
              armed_force:
                decryptedData?.ArmedForceWhereRemainedPosted ||
                decryptedData?.AgniveerForceType ||
                '—',
              defence_force:
                decryptedData?.ArmedForceWhereRemainedPosted ||
                decryptedData?.AgniveerForceType ||
                '—',
              trade: decryptedData?.PresentTradeHeld || '—',
              medical_category: decryptedData?.LastMedicalCategory || '—',
              medical_category_date: decryptedData?.LastMedicalCategoryDate || '—',
              enlistment_date: decryptedData?.DateOfEnlistmentAsAgniveer || '—',
              height: decryptedData?.PhysicalMeasurements?.Height || '—',
              weight: decryptedData?.PhysicalMeasurements?.Weight || '—',
              chest_unexpanded: decryptedData?.PhysicalMeasurements?.ChestUnExpanded || '—',
              chest_expanded: decryptedData?.PhysicalMeasurements?.ChestExpanded || '—',
              punishment: decryptedData?.DetailsOfPunishmentIfAny || '—',
              photo: decryptedData?.Photo?.AgniveerPhoto || '',
              Photo: decryptedData?.Photo,
              personal_details: {
                candidate_name: decryptedData?.Name || '',
                name: decryptedData?.Name || '',
                father_name: decryptedData?.FatherName || '—',
                dob: decryptedData?.DateOfBirth || '—',
                gender: decryptedData?.Gender || '—',
                permanent_address: decryptedData?.PermanentAddress || '—',
                mobile: decryptedData?.MobileNumber || '—',
                email: decryptedData?.EmailId || '—',
              },
              service_details: {
                service_id: String(decryptedData?.AgniveerIdNo || decryptedData?.Id || '5002020'),
                defence_force: decryptedData?.ArmedForceWhereRemainedPosted || 'Armed Forces',
                trade: decryptedData?.PresentTradeHeld || '—',
                date_of_enrolment: decryptedData?.DateOfEnlistmentAsAgniveer || '—',
                service_tenure: 'Active Service',
                character_assessed: 'Exemplary',
              },
              skill_and_education: {
                educational_qualification: decryptedData?.EducationalQualification || '—',
              },
              health_and_medical_details: {
                height: decryptedData?.PhysicalMeasurements?.Height || '—',
                weight: decryptedData?.PhysicalMeasurements?.Weight || '—',
                chest_size_unexp: decryptedData?.PhysicalMeasurements?.ChestUnExpanded || '—',
                chest_size_exp: decryptedData?.PhysicalMeasurements?.ChestExpanded || '—',
                medical_category: decryptedData?.LastMedicalCategory || '—',
                last_medical_exam_date: decryptedData?.LastMedicalCategoryDate || '—',
              },
            };

            this.profile.set(mappedProfile);

            const additionalDetails =
              decryptedData?.AdditionalProfileDetails ||
              decryptedData?.additional_profile_details ||
              decryptedData?.Additional_profile_details ||
              decryptedData?.additionalProfileDetails ||
              decryptedData;

            this.patchAdditionalProfileDetails(additionalDetails);
          }

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching agniveer details:', error);
          // this.isLoading.set(false);
          this.router.navigate(['/']);
        },
      });
  }

  patchAdditionalProfileDetails(details: any): void {
    if (!details) return;

    let data: any = details;
    // console.log(data, 'dataagniveer');

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {}
    }

    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }

    if (data && typeof data === 'object') {
      if (data.Agniveer && typeof data.Agniveer === 'object') {
        data = { ...data, ...(Array.isArray(data.Agniveer) ? data.Agniveer[0] : data.Agniveer) };
      }
      if (Array.isArray(data.Table1) && data.Table1.length > 0) {
        data = { ...data, ...data.Table1[0] };
      }
      let inner =
        data.additional_profile_details ??
        data.Additional_profile_details ??
        data.AdditionalProfileDetails ??
        data.additionalProfileDetails;
      if (typeof inner === 'string') {
        try {
          inner = JSON.parse(inner);
        } catch (e) {}
      }
      if (Array.isArray(inner) && inner.length > 0) {
        inner = inner[0];
      }
      if (inner && typeof inner === 'object') {
        data = { ...data, ...inner };
      }
    }

    if (!data || typeof data !== 'object') return;

    this.rawPartBDetails = data;

    const partBDraftSave =
      data.DraftSave ??
      data.draft_save ??
      data.AdditionalProfileDetails?.DraftSave ??
      data.AdditionalProfileDetails?.draft_save ??
      data.additional_profile_details?.draft_save ??
      data.additional_profile_details?.DraftSave;
    if (partBDraftSave !== undefined && partBDraftSave !== null) {
      this.isDataAlreadySaved.set(Number(partBDraftSave) === 1);
    }

    const patchPayload: any = {};

    // 1. Mother's Name
    const motherName = data.MotherName ?? data.mother_name;
    if (motherName !== undefined && motherName !== null) {
      const val = String(motherName).trim();
      if (val && val !== '—' && val !== 'null' && val !== 'undefined') {
        patchPayload.mothersName = val;
      }
    }

    // 2. Nationality
    const natName = data.Nationality ?? data.nationality;
    const natId = data.NationalityId ?? data.nationality_id;
    let targetNat = '';
    if (natName && String(natName).trim() && String(natName).trim() !== 'null') {
      targetNat = String(natName).trim();
    }
    const targetNatNum = Number(targetNat);
    const resolvedNatId = !isNaN(targetNatNum) && targetNatNum > 0 ? targetNatNum : natId;
    if (resolvedNatId !== undefined && resolvedNatId !== null) {
      const found = this.nationalities().find(
        (n) => String(n._id) === String(resolvedNatId) || String(n.code) === String(resolvedNatId),
      );
      if (found) {
        targetNat = found.name || found.nationality || targetNat;
      }
    }
    if (targetNat) {
      if (targetNat.toLowerCase() === 'indian') {
        patchPayload.nationality = 'Indian';
      } else {
        const existing = this.nationalities().find(
          (n) => (n.name || n.nationality)?.toLowerCase() === targetNat.toLowerCase(),
        );
        if (existing) {
          patchPayload.nationality = existing.name || existing.nationality || targetNat;
        } else {
          patchPayload.nationality = targetNat;
          this.nationalities.update((list) => [
            ...list,
            {
              _id: String(resolvedNatId || list.length + 1),
              name: targetNat,
              nationality: targetNat,
            },
          ]);
        }
      }
    }

    // 3. Religion
    const relName = data.Religion ?? data.religion;
    const relId = data.ReligionId ?? data.religion_id;
    let targetRel = '';
    if (relName && String(relName).trim() && String(relName).trim() !== 'null') {
      targetRel = String(relName).trim();
    }
    const targetRelNum = Number(targetRel);
    const resolvedRelId = !isNaN(targetRelNum) && targetRelNum > 0 ? targetRelNum : relId;
    if (resolvedRelId !== undefined && resolvedRelId !== null) {
      const found = this.religions().find(
        (r) => String(r._id) === String(resolvedRelId) || String(r.code) === String(resolvedRelId),
      );
      if (found) {
        targetRel = found.name || found.religion || targetRel;
      }
    }
    patchPayload.religion = targetRel;

    // 4. Central Category
    const catName = data.Category ?? data.category;
    const catId = Number(data.CategoryId ?? data.category_id);
    if (catId && !isNaN(catId)) {
      patchPayload.category = catId;
      patchPayload.categoryName = catName || '';
    } else if (catName && Array.isArray(this.centralCategoryList)) {
      const matchedCat = this.centralCategoryList.find(
        (c: any) => c.CategoryName?.toLowerCase() === String(catName).trim().toLowerCase(),
      );
      if (matchedCat) {
        patchPayload.category = Number(matchedCat.AutoCategoryId);
        patchPayload.categoryName = matchedCat.CategoryName;
      }
    }

    // 4b. Reservation Category in Domicile State
    const rcatName = data.RCategory ?? data.rcategory ?? data.rCategory;
    const rcatId = Number(data.RCategoryId ?? data.rcategory_id ?? data.rCategoryId);
    if (rcatId && !isNaN(rcatId)) {
      patchPayload.rcategory = rcatId;
      patchPayload.rcategoryName = rcatName || '';
    } else if (rcatName && Array.isArray(this.reservationCategory)) {
      const matchedrCat = this.reservationCategory.find(
        (c: any) => c.CategoryName?.toLowerCase() === String(rcatName).trim().toLowerCase(),
      );
      if (matchedrCat) {
        patchPayload.rcategory = Number(matchedrCat.AutoCategoryId);
        patchPayload.rcategoryName = matchedrCat.CategoryName;
      }
    }

    // 5. State
    const stateName =
      data.State ??
      data.state ??
      data.domicile_state ??
      data.DomicileState ??
      data.state_name ??
      data.StateName;
    const stateId =
      data.StateId ?? data.state_id ?? data.State_cd ?? data.state_cd ?? data.state_code;
    let targetState = '';
    if (stateName && String(stateName).trim() && String(stateName).trim() !== 'null') {
      targetState = String(stateName).trim();
    }
    patchPayload.state = targetState;
    patchPayload.stateId = stateId;
    // 6. District
    const districtName =
      data.District ??
      data.district ??
      data.domicile_district ??
      data.DomicileDistrict ??
      data.district_name ??
      data.DistrictName;
    const districtId =
      data.DistrictId ??
      data.district_id ??
      data.District_cd ??
      data.district_cd ??
      data.district_code;
    let targetDistrict = '';
    if (districtName && String(districtName).trim() && String(districtName).trim() !== 'null') {
      targetDistrict = String(districtName).trim();
    }

    if (targetState) {
      patchPayload.domicileState = targetState;
    }
    if (targetDistrict) {
      patchPayload.domicileDistrict = targetDistrict;
    }

    // 7. Police Station
    const policeStation = data.PoliceStation ?? data.police_station;
    if (policeStation !== undefined && policeStation !== null) {
      const val = String(policeStation).trim();
      if (val && val !== '—' && val !== 'null') {
        patchPayload.policeStation = val;
      }
    }

    this.additionalForm.patchValue(patchPayload, { emitEvent: false });
    if (!this.isEditMode()) {
      this.additionalForm.disable();
    }
    this.cdr.detectChanges();

    const rawStateCd = Number(
      data.StateId ?? data.state_id ?? data.State_cd ?? data.state_cd ?? patchPayload.stateId,
    );
    if (rawStateCd && !isNaN(rawStateCd) && rawStateCd > 0) {
      this.getCentralCategory({ state_cd: rawStateCd }, 1);
    }

    if (this.stateRecords && this.stateRecords.length > 0) {
      this.syncStateAndDistrictFromCommonService();
    } else if (targetState) {
      this.loadDistrictsForState(targetState, targetDistrict, districtId);
    }

    // 8. Signature
    const sigPath = data.SignatureFilePath ?? data.signature_file_path;
    if (sigPath && String(sigPath).trim()) {
      let cleanSig = String(sigPath).trim();
      if (cleanSig.startsWith('"') && cleanSig.endsWith('"')) {
        cleanSig = cleanSig.slice(1, -1);
      }
      if (cleanSig !== 'null' && cleanSig !== 'undefined' && cleanSig !== '—') {
        this.uploadedSignaturePath.set(cleanSig);
        this.signaturePreview.set(this.getSignatureUrl(cleanSig));
      }
    }
  }

  loadMasterData(): void {
    let payload: any = {
      is_draft: false,
      page_number: 1,
      record_per_page: 1000,
    };
    payload = JSON.stringify(payload);
    payload = CryptoHelper.encrypt(payload);
    payload = JSON.stringify(payload);
    this.masterService.getAllNationalities(payload).subscribe({
      next: (data: any) => {
        if (data) {
          let response = data.data;
          response = CryptoHelper.decrypt(response);
          response = JSON.parse(response);
          this.nationalities.set(response?.records);
          // console.log(this.nationalities());
          if (this.rawPartBDetails) {
            const natName = this.rawPartBDetails.Nationality ?? this.rawPartBDetails.nationality;
            const natId = this.rawPartBDetails.NationalityId ?? this.rawPartBDetails.nationality_id;
            const matched = (response?.records || []).find(
              (n: any) =>
                (natId && (n.autonationality_id == natId || n._id == natId)) ||
                (natName &&
                  (n.nationality || n.name)?.toLowerCase() === String(natName).toLowerCase()),
            );
            if (matched) {
              this.additionalForm.patchValue(
                { nationality: matched.nationality || matched.name },
                { emitEvent: false },
              );
            }
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {},
    });

    let payload2: any = {
      is_draft: false,
      page_number: 1,
      record_per_page: 100,
    };
    payload2 = JSON.stringify(payload2);
    payload2 = CryptoHelper.encrypt(payload2);
    payload2 = JSON.stringify(payload2);
    this.myProfileService.getAllReligions(payload2).subscribe({
      next: (data: any) => {
        if (data) {
          let response = data.data;
          response = CryptoHelper.decrypt(response);
          response = JSON.parse(response);
          // console.log(response?.records);
          this.religions.set(response?.records);
          if (this.rawPartBDetails) {
            const relName = this.rawPartBDetails.Religion ?? this.rawPartBDetails.religion;
            const relId = this.rawPartBDetails.ReligionId ?? this.rawPartBDetails.religion_id;
            const matched = (response?.records || []).find(
              (r: any) =>
                (relId && (r.autoreligion_id == relId || r._id == relId)) ||
                (relName &&
                  (r.religion || r.name)?.toLowerCase() === String(relName).toLowerCase()) ||
                (relName &&
                  String(relName).toLowerCase().includes('hindu') &&
                  (r.religion || r.name)?.toLowerCase().includes('hindu')),
            );
            if (matched) {
              this.additionalForm.patchValue(
                { religion: matched.religion || matched.name },
                { emitEvent: false },
              );
            }
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {},
    });
  }

  getInitials(): string {
    const name = this.profile()?.name || '';
    if (!name) return 'AG';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getPhotoUrl(): string | null {
    const rawPhoto =
      this.profile()?.photo ||
      this.agniveerData()?.Photo?.AgniveerPhoto ||
      this.profile()?.['Photo']?.AgniveerPhoto;
    if (!rawPhoto || rawPhoto === '—' || rawPhoto === 'null') return null;

    let cleanPhoto = String(rawPhoto).trim();
    if (cleanPhoto.startsWith('"') && cleanPhoto.endsWith('"')) {
      cleanPhoto = cleanPhoto.slice(1, -1);
    }
    if (!cleanPhoto || cleanPhoto === '—' || cleanPhoto === 'null' || cleanPhoto === 'undefined')
      return null;

    if (
      cleanPhoto.startsWith('http://') ||
      cleanPhoto.startsWith('https://') ||
      cleanPhoto.startsWith('data:')
    ) {
      return cleanPhoto;
    }

    const photoBase = environment.photoPath;
    const stripped = cleanPhoto.startsWith('/') ? cleanPhoto.slice(1) : cleanPhoto;
    return `${photoBase}${stripped}`;
  }

  getTenureRange(): string {
    const tenure = this.profile()?.service_details?.service_tenure;
    if (tenure) return tenure;
    const start = this.profile()?.enlistment_date || '2022';
    return `${start} - Present`;
  }

  onStateChange(): void {
    this.additionalForm.patchValue({
      domicileDistrict: '',
      policeStation: '',
      rcategory: '',
      rcategoryName: '',
    });
    const selectedStateName = this.additionalForm.get('domicileState')?.value;
    if (!selectedStateName) {
      this.districts.set([]);
      this.policeStations.set([]);
      this.reservationCategory = [];
      this.cdr.detectChanges();
      return;
    }

    if (this.stateRecords && this.stateRecords.length > 0) {
      const matchedState = this.stateRecords.find(
        (st: any) =>
          st.state_name &&
          st.state_name.trim().toLowerCase() === selectedStateName.trim().toLowerCase(),
      );
      this.getCentralCategory(matchedState, 1);
      // console.log(matchedState);
      if (matchedState && Array.isArray(matchedState.districts)) {
        const districtList: DomicileDistrict[] = matchedState.districts.map((d: any) => ({
          _id: String(d.district_cd),
          district_name: d.district_name,
          name: d.district_name,
          state_id: String(matchedState.state_cd),
          police_stations: d.police_stations,
        }));
        this.districts.set(districtList);
        this.cdr.detectChanges();
        return;
      }
    }
    this.loadDistrictsForState(selectedStateName);
  }

  loadDistrictsForState(stateName: string, targetDistrict?: string, districtId?: any): void {
    if (!stateName) {
      this.districts.set([]);
      this.cdr.detectChanges();
      return;
    }

    if (this.stateRecords && this.stateRecords.length > 0) {
      const matchedState = this.stateRecords.find(
        (st: any) =>
          st.state_name && st.state_name.trim().toLowerCase() === stateName.trim().toLowerCase(),
      );

      if (matchedState && Array.isArray(matchedState.districts)) {
        const districtList: DomicileDistrict[] = matchedState.districts.map((d: any) => ({
          _id: String(d.district_cd),
          district_name: d.district_name,
          name: d.district_name,
          state_id: String(matchedState.state_cd),
          police_stations: d.police_stations,
        }));
        // console.log(districtList);
        this.districts.set(districtList);

        const wantedDistrict = targetDistrict || this.additionalForm.get('domicileDistrict')?.value;
        if (wantedDistrict) {
          const matched = districtList.find(
            (d) =>
              (d.district_name || d.name)?.toLowerCase() === wantedDistrict.toLowerCase() ||
              (districtId && String(d._id) === String(districtId)),
          );
          if (matched) {
            this.additionalForm.patchValue({
              domicileDistrict: matched.district_name || matched.name || wantedDistrict,
            });
          }
        }
        if (!this.isEditMode()) {
          this.additionalForm.disable();
        }
        this.cdr.detectChanges();
      }
    }
  }

  onDistrictChange(): void {
    const selectedDistrictName = this.additionalForm.get('domicileDistrict')?.value;

    // Reset policeStation whenever district changes
    this.additionalForm.patchValue({ policeStation: '' }, { emitEvent: false });

    // Clear police stations when district is cleared
    if (!selectedDistrictName) {
      this.policeStations.set([]);
      this.cdr.detectChanges();
      return;
    }

    if (this.isDistrict9999()) {
      this.policeStations.set([]);
      this.cdr.detectChanges();
      return;
    }

    let policeStationsList: PoliceStation[] = [];

    // 1. Find matched district in this.districts()
    const matchedDistrict: any = this.districts().find(
      (d: any) =>
        (d.district_name || d.name)?.trim().toLowerCase() ===
          String(selectedDistrictName).trim().toLowerCase() ||
        String(d._id) === String(selectedDistrictName) ||
        String(d.district_code) === String(selectedDistrictName) ||
        String(d.district_cd) === String(selectedDistrictName),
    );

    // console.log('Selected District:', selectedDistrictName);
    // console.log('Matched District:', matchedDistrict);

    if (
      matchedDistrict &&
      Array.isArray(matchedDistrict.police_stations) &&
      matchedDistrict.police_stations.length > 0
    ) {
      policeStationsList = matchedDistrict.police_stations.map((ps: any) => ({
        _id: String(ps.ps_cd),
        name: ps.ps_name,
        police_station_name: ps.ps_name,
        district_id: String(ps.district_cd ?? matchedDistrict._id),
      }));
    }

    // 2. Fallback: Search in this.stateRecords
    if (policeStationsList.length === 0 && this.stateRecords && this.stateRecords.length > 0) {
      const selectedStateName = this.additionalForm.get('domicileState')?.value;
      const matchedState = this.stateRecords.find(
        (st: any) =>
          st.state_name &&
          st.state_name.trim().toLowerCase() === String(selectedStateName).trim().toLowerCase(),
      );
      if (matchedState && Array.isArray(matchedState.districts)) {
        const foundD: any = matchedState.districts.find(
          (d: any) =>
            (d.district_name || d.name)?.trim().toLowerCase() ===
              String(selectedDistrictName).trim().toLowerCase() ||
            String(d.district_cd) === String(selectedDistrictName) ||
            String(d.district_code) === String(selectedDistrictName),
        );
        if (foundD && Array.isArray(foundD.police_stations) && foundD.police_stations.length > 0) {
          policeStationsList = foundD.police_stations.map((ps: any) => ({
            _id: String(ps.ps_cd),
            name: ps.ps_name,
            police_station_name: ps.ps_name,
            district_id: String(ps.district_cd ?? foundD.district_cd),
          }));
        }
      }
    }

    // console.log('Police Stations found:', policeStationsList);
    this.policeStations.set(policeStationsList);
    this.cdr.detectChanges();
  }

  isDistrict9999(): boolean {
    const selectedDistName = this.additionalForm?.get('domicileDistrict')?.value;
    if (!selectedDistName) return false;

    const trimmed = String(selectedDistName).trim().toLowerCase();
    if (trimmed === '9999' || trimmed === 'other' || trimmed === 'others') {
      return true;
    }

    const matchedDist: any = this.districts().find(
      (d: any) =>
        (d.district_name || d.name)?.trim().toLowerCase() === trimmed ||
        String(d._id) === String(selectedDistName) ||
        String(d.district_code) === String(selectedDistName) ||
        String(d.district_cd) === String(selectedDistName),
    );
    if (
      matchedDist &&
      (Number(matchedDist._id) === 9999 ||
        Number(matchedDist.district_cd) === 9999 ||
        Number(matchedDist.district_code) === 9999)
    ) {
      return true;
    }

    if (this.stateRecords && this.stateRecords.length > 0) {
      for (const st of this.stateRecords) {
        if (Array.isArray(st.districts)) {
          const d: any = st.districts.find(
            (dist: any) =>
              (dist.district_name && dist.district_name.trim().toLowerCase() === trimmed) ||
              String(dist.district_cd) === String(selectedDistName) ||
              String(dist.district_code) === String(selectedDistName),
          );
          if (
            d &&
            (Number(d.district_cd) === 9999 ||
              Number(d.district_code) === 9999 ||
              Number(d._id) === 9999)
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  onSignatureSelected(event: Event): void {
    if (!this.isEditMode() || this.isDataAlreadySaved()) return;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const fileName = file.name || '';
      const ext = fileName.split('.').pop()?.toLowerCase() || '';

      if (!['jpg', 'jpeg', 'png'].includes(ext)) {
        Swal.fire({
          icon: 'warning',
          title: 'Invalid File Format',
          text: 'Please select a JPG or PNG image file.',
          confirmButtonColor: '#1C4587',
        });
        input.value = '';
        return;
      }

      if (file.size > 200 * 1024) {
        Swal.fire({
          icon: 'warning',
          title: 'File Too Large',
          text: 'Signature file size must be 200KB or less.',
          confirmButtonColor: '#1C4587',
        });
        input.value = '';
        return;
      }

      const autoId = Number(
        this.agniveerAutoid ||
          this.agniveerData()?.AgniveerAutoId ||
          this.agniveerData()?.AutoId ||
          this.rawPartBDetails?.AgniveerAutoId ||
          1,
      );
      const sigPath = `agniveer/${autoId}/signature/${file.name}`;
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('File', file, file.name);

      const encReq = CryptoHelper.encrypt(JSON.stringify({ filepath: sigPath }));

      Swal.fire({
        title: 'Uploading Signature...',
        text: 'Please wait while your signature is being uploaded.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.agniveerUploadService.UploadProfilePhotoAPI(formData, encReq).subscribe({
        next: (res: any) => {
          if (res.code) {
            let resPath = res.data;
            try {
              resPath = CryptoHelper.decrypt(res.data);
              resPath = JSON.parse(resPath);
              if (typeof resPath === 'string') {
                try {
                  const second = JSON.parse(resPath);
                  if (second) resPath = second;
                } catch (_) {}
              }
            } catch (e) {
              console.error('Error decrypting signature upload response:', e);
            }

            Swal.close();
            // console.log('UploadProfilePhotoAPI response:', res, 'Parsed path:', resPath);

            let pathStr = '';
            if (typeof resPath === 'string') {
              pathStr = resPath.trim();
            }

            if (pathStr.startsWith('"') && pathStr.endsWith('"')) {
              pathStr = pathStr.slice(1, -1);
            }

            this.uploadedSignaturePath.set(pathStr);

            this.signaturePreview.set(this.getSignatureUrl(pathStr));

            Swal.fire({
              icon: 'success',
              title: 'Uploaded Successfully',
              text: 'Signature uploaded successfully.',
              confirmButtonColor: '#1C4587',
              timer: 2000,
              showConfirmButton: false,
            });
            this.cdr.detectChanges();
          }
        },
        error: (err: any) => {
          Swal.close();
          console.error('Error uploading signature:', err);
          Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: 'Failed to upload signature. Please try again.',
            confirmButtonColor: '#1C4587',
          });
          input.value = '';
        },
      });
    }
  }

  getSignatureUrl(sigPath: string | null | undefined): string | null {
    if (!sigPath) return null;
    let cleanSig = String(sigPath).trim();
    if (cleanSig.startsWith('"') && cleanSig.endsWith('"')) {
      cleanSig = cleanSig.slice(1, -1);
    }
    if (!cleanSig || cleanSig === 'null' || cleanSig === 'undefined' || cleanSig === '—') {
      return null;
    }
    if (
      cleanSig.startsWith('http://') ||
      cleanSig.startsWith('https://') ||
      cleanSig.startsWith('data:')
    ) {
      return cleanSig;
    }

    const signatureBase = environment.signaturePath;
    const stripped = cleanSig.startsWith('/') ? cleanSig.slice(1) : cleanSig;
    return `${signatureBase}${stripped}`;
  }

  removeSignature(): void {
    if (!this.isEditMode() || this.isDataAlreadySaved()) return;
    this.signaturePreview.set(null);
    this.uploadedSignaturePath.set(null);
    this.cdr.detectChanges();
  }

  buildUpdatePayload(draftSaveValue: number): AgniveerUpdateAdditionalDetailsPayload | null {
    const formVals = this.additionalForm.getRawValue();

    // 1. Agniveer Auto ID
    const autoId = Number(
      this.agniveerAutoid ||
        this.agniveerData()?.AgniveerAutoId ||
        this.agniveerData()?.AutoId ||
        this.rawPartBDetails?.AgniveerAutoId ||
        this.rawPartBDetails?.agniveer_autoid ||
        0,
    );
    if (!autoId || isNaN(autoId) || autoId <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Agniveer ID',
        text: 'Agniveer Auto ID is not available. Please refresh the page or login again.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 2. Mother's Name
    const motherName = String(formVals.mothersName || '').trim();
    if (!motherName) {
      Swal.fire({
        icon: 'warning',
        title: "Missing Mother's Name",
        text: "Mother's Name is required. Please fill in Mother's Name.",
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 3. Nationality & Nationality ID
    const natName = String(formVals.nationality || '').trim();
    if (!natName) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Nationality',
        text: 'Nationality is required. Please select Nationality.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }
    const matchedNat = this.nationalities().find(
      (n: any) =>
        (n.nationality || n.name)?.toLowerCase() === natName.toLowerCase() ||
        String(n.autonationality_id || n._id) === natName,
    );
    const nationalityId = Number(
      matchedNat?.autonationality_id || matchedNat?._id || this.rawPartBDetails?.NationalityId || 0,
    );
    if (!nationalityId || isNaN(nationalityId) || nationalityId <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Nationality',
        text: `Nationality ID for "${natName}" is not available in master records.`,
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 4. Religion & Religion ID
    const relName = String(formVals.religion || '').trim();
    if (!relName) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Religion',
        text: 'Religion is required. Please select Religion.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }
    const matchedRel = this.religions().find(
      (r: any) =>
        (r.name || r.religion)?.toLowerCase() === relName.toLowerCase() ||
        String(r.autoreligion_id || r._id) === relName,
    );
    const religionId = Number(
      matchedRel?.autoreligion_id || matchedRel?._id || this.rawPartBDetails?.ReligionId || 0,
    );
    if (!religionId || isNaN(religionId) || religionId <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Religion',
        text: `Religion ID for "${relName}" is not available in master records.`,
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 5. Central Category
    const categoryId =
      Number(formVals.category) ||
      Number(this.rawPartBDetails?.CategoryId ?? this.rawPartBDetails?.category_id ?? 0);
    const matchedCat = Array.isArray(this.centralCategoryList)
      ? this.centralCategoryList.find((c: any) => Number(c.AutoCategoryId) === categoryId)
      : null;
    const catName =
      matchedCat?.CategoryName ||
      formVals.categoryName ||
      this.rawPartBDetails?.Category ||
      this.rawPartBDetails?.category ||
      '';
    if (!categoryId || isNaN(categoryId) || categoryId <= 0 || !catName) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Reservation Category in Center',
        text: 'Reservation Category in Center is required. Please select Reservation Category in Center.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 6. Reservation Category
    const rcategoryId =
      Number(formVals.rcategory) ||
      Number(
        this.rawPartBDetails?.RCategoryId ??
          this.rawPartBDetails?.rCategoryId ??
          this.rawPartBDetails?.rcategory_id ??
          0,
      );
    const matchedrCat = Array.isArray(this.reservationCategory)
      ? this.reservationCategory.find((c: any) => Number(c.AutoCategoryId) === rcategoryId)
      : null;
    const rcategoryName =
      matchedrCat?.CategoryName ||
      formVals.rcategoryName ||
      this.rawPartBDetails?.RCategory ||
      this.rawPartBDetails?.rCategory ||
      this.rawPartBDetails?.rcategory ||
      '';
    if (!rcategoryId || isNaN(rcategoryId) || rcategoryId <= 0 || !rcategoryName) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Reservation Category',
        text: 'Reservation Category in the Domicile State is required. Please select Reservation Category.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 7. State & State ID
    const stateName = String(formVals.domicileState || '').trim();
    if (!stateName) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing State',
        text: 'Domicile State / UT is required. Please select Domicile State / UT.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }
    let stateId = Number(this.rawPartBDetails?.StateId || 0);
    if (this.stateRecords && this.stateRecords.length > 0) {
      const matchedState = this.stateRecords.find(
        (st: any) =>
          st.state_name && st.state_name.trim().toLowerCase() === stateName.toLowerCase(),
      );
      if (matchedState?.state_cd !== undefined && !isNaN(Number(matchedState.state_cd))) {
        stateId = Number(matchedState.state_cd);
      }
    }
    if (!stateId && this.states().length > 0) {
      const stateObj = this.states().find(
        (s: any) => (s.state_name || s.name)?.toLowerCase() === stateName.toLowerCase(),
      );
      if (stateObj?._id && !isNaN(Number(stateObj._id))) {
        stateId = Number(stateObj._id);
      }
    }
    if (!stateId || isNaN(stateId) || stateId <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid State',
        text: `State ID for "${stateName}" is not available in master records.`,
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 8. District & District ID
    const distName = String(formVals.domicileDistrict || '').trim();
    if (!distName) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing District',
        text: 'Domicile District is required. Please select Domicile District.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }
    let districtId = 0;
    const trimmedDist = distName.toLowerCase();
    if (trimmedDist === 'other' || trimmedDist === 'others' || trimmedDist === '9999') {
      districtId = 9999;
    } else {
      if (this.stateRecords && this.stateRecords.length > 0) {
        const matchedState = this.stateRecords.find(
          (st: any) =>
            st.state_name && st.state_name.trim().toLowerCase() === stateName.toLowerCase(),
        );
        if (matchedState && Array.isArray(matchedState.districts)) {
          const matchedDist = matchedState.districts.find(
            (d: any) =>
              (d.district_name &&
                d.district_name.trim().toLowerCase() === distName.toLowerCase()) ||
              String(d.district_cd) === distName,
          );
          if (matchedDist?.district_cd !== undefined && !isNaN(Number(matchedDist.district_cd))) {
            districtId = Number(matchedDist.district_cd);
          }
        }
      }
      if (!districtId && this.districts().length > 0) {
        const distObj: any = this.districts().find(
          (d: any) =>
            (d.district_name || d.name)?.toLowerCase() === distName.toLowerCase() ||
            String(d._id) === distName,
        );
        if (distObj && !isNaN(Number(distObj._id ?? distObj.district_cd))) {
          districtId = Number(distObj._id ?? distObj.district_cd);
        }
      }
      if (!districtId && this.rawPartBDetails?.DistrictId) {
        const rawDId = Number(this.rawPartBDetails.DistrictId);
        if (rawDId !== 9999) {
          districtId = rawDId;
        }
      }
    }
    if (!districtId || isNaN(districtId) || districtId <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid District',
        text: `District ID for "${distName}" is not available in master records.`,
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 9. Police Station & Police Station ID
    const psName = String(formVals.policeStation).trim();
    if (!psName) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Police Station',
        text: 'Police Station is required. Please enter or select Police Station.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }
    let psId = 0;
    if (districtId === 9999) {
      psId = 9999999;
    } else {
      const matchedPs = this.policeStations().find(
        (ps: any) =>
          (ps.police_station_name || ps.name)?.trim().toLowerCase() === psName.toLowerCase() ||
          String(ps._id) === psName,
      );
      if (matchedPs?._id && !isNaN(Number(matchedPs._id))) {
        psId = Number(matchedPs._id);
      }
      if (!psId && this.stateRecords && this.stateRecords.length > 0) {
        const matchedState = this.stateRecords.find(
          (st: any) =>
            st.state_name && st.state_name.trim().toLowerCase() === stateName.toLowerCase(),
        );
        if (matchedState && Array.isArray(matchedState.districts)) {
          const matchedDist = matchedState.districts.find(
            (d: any) =>
              d.district_name && d.district_name.trim().toLowerCase() === distName.toLowerCase(),
          );
          if (matchedDist && Array.isArray(matchedDist.police_stations)) {
            const found = matchedDist.police_stations.find(
              (p: any) =>
                (p.ps_name || p.name)?.trim().toLowerCase() === psName.toLowerCase() ||
                String(p.ps_cd) === psName,
            );
            if (found?.ps_cd) {
              psId = Number(found.ps_cd);
            }
          }
        }
      }
      if (
        !psId &&
        this.rawPartBDetails?.PoliceStationId &&
        Number(this.rawPartBDetails.PoliceStationId) !== 9999999
      ) {
        psId = Number(this.rawPartBDetails.PoliceStationId);
      }
      if (!psId && (this.rawPartBDetails?.police_station_id || this.rawPartBDetails?.ps_cd)) {
        const rawId = Number(this.rawPartBDetails.police_station_id || this.rawPartBDetails.ps_cd);
        if (rawId !== 9999999) {
          psId = rawId;
        }
      }
    }
    if (!psId || isNaN(psId) || psId <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Police Station',
        text: `Police Station ID for "${psName}" is not available. Please enter or select a valid Police Station.`,
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 10. Signature File Path
    const sigPath =
      this.uploadedSignaturePath() ||
      (this.signaturePreview()
        ? this.rawPartBDetails?.SignatureFilePath ||
          this.rawPartBDetails?.signature_file_path ||
          `agniveer/${autoId}/signature/filename`
        : '');

    if (!sigPath) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Signature',
        text: 'Please upload signature before saving.',
        confirmButtonColor: '#1C4587',
      });
      return null;
    }

    // 11. Rehabilitated status
    const isRehab = Boolean(
      this.rawPartBDetails?.Rehabilitated ?? this.rawPartBDetails?.rehabilitated,
    );

    const additionalDetails: any = {
      mother_name: motherName,
      nationality_id: nationalityId,
      nationality: natName,
      religion_id: religionId,
      religion: relName,
      category_id: categoryId,
      category: catName,
      rcategory_id: rcategoryId,
      rcategory: rcategoryName,
      state_id: stateId,
      state: stateName,
      district_id: districtId,
      district: distName,
      police_station_id: psId,
      police_station: psName,
      signature_file_path: sigPath,
    };

    const payload: AgniveerUpdateAdditionalDetailsPayload = {
      agniveer_autoid: autoId,
      draft_save: draftSaveValue,
      rehabilitated: isRehab,
      additional_profile_details: additionalDetails,
    };

    // console.log(payload);
    return payload;
  }

  onSaveDraft(): void {
    if (!this.canEditProfile()) {
      Swal.fire({
        icon: 'warning',
        title: 'Save Not Allowed',
        text: 'Profile editing is closed because the schedule is inactive or outside the active window.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }
    if (this.isDataAlreadySaved()) {
      Swal.fire({
        icon: 'info',
        title: 'Save Not Allowed',
        text: 'Data already saved; further updates are not permitted.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }
    this.sendUpdateDetails(0);
  }

  onSubmitDetails(): void {
    if (!this.canEditProfile()) {
      Swal.fire({
        icon: 'warning',
        title: 'Submit Not Allowed',
        text: 'Profile editing is closed because the schedule is inactive or outside the active window.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }
    if (this.isDataAlreadySaved()) {
      Swal.fire({
        icon: 'info',
        title: 'Submit Not Allowed',
        text: 'Data already saved; further updates are not permitted.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }

    this.isSubmitted = true;
    if (this.additionalForm.invalid) {
      this.additionalForm.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Details',
        text: 'Please fill in all mandatory fields before submitting.',
        confirmButtonColor: '#1C4587',
      });
      return;
    }

    Swal.fire({
      title: 'Confirm Final Submission',
      text: 'Once submitted, details cannot be edited again. Do you want to proceed?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1C4587',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Submit Details',
      cancelButtonText: 'Review Again',
    }).then((result) => {
      if (result.isConfirmed) {
        this.sendUpdateDetails(1);
      }
    });
  }

  private sendUpdateDetails(draftSaveValue: number): void {
    const rawPayload = this.buildUpdatePayload(draftSaveValue);
    if (!rawPayload) {
      this.isSaving.set(false);
      return;
    }
    const payload: AgniveerUpdateAdditionalDetailsPayload = rawPayload;

    this.isSaving.set(true);
    // return console.log(payload, 'sendupdared');
    this.myProfileService.agniveerUpdateAdditionalDetails(payload).subscribe({
      next: (response: any) => {
        this.isSaving.set(false);
        if (response?.code) {
          let responseMsg = '';
          if (response?.data) {
            try {
              const dec = CryptoHelper.decrypt(response.data);
              const parsed = typeof dec === 'string' ? JSON.parse(dec) : dec;
              responseMsg =
                parsed?.message || parsed?.Message || (typeof parsed === 'string' ? parsed : '');
            } catch {}
          }
          if (!responseMsg) {
            responseMsg = response?.message || response?.Message || '';
          }

          const msgLower = (responseMsg || '').toLowerCase();

          if (msgLower.includes('already saved') || msgLower.includes('not allowed')) {
            this.isDataAlreadySaved.set(true);
            this.isEditMode.set(false);
            this.additionalForm.disable();
            Swal.fire({
              icon: 'info',
              title: 'Data Already Saved',
              text: responseMsg || 'Data already saved; update is not allowed.',
              confirmButtonColor: '#1C4587',
            });
            return;
          }

          this.isEditMode.set(false);
          this.additionalForm.disable();

          if (draftSaveValue === 1) {
            this.isDataAlreadySaved.set(true);
          }

          this.rawPartBDetails = {
            ...this.rawPartBDetails,
            MotherName: payload.additional_profile_details.mother_name,
            Nationality: payload.additional_profile_details.nationality,
            NationalityId: payload.additional_profile_details.nationality_id,
            Religion: payload.additional_profile_details.religion,
            ReligionId: payload.additional_profile_details.religion_id,
            Category: payload.additional_profile_details.category,
            CategoryId: payload.additional_profile_details.category_id,
            State: payload.additional_profile_details.state,
            StateId: payload.additional_profile_details.state_id,
            District: payload.additional_profile_details.district,
            DistrictId: payload.additional_profile_details.district_id,
            PoliceStation: payload.additional_profile_details.police_station,
            PoliceStationId: payload.additional_profile_details.police_station_id,
            SignatureFilePath: payload.additional_profile_details.signature_file_path,
            draft_save: draftSaveValue,
            DraftSave: draftSaveValue,
            draftSave: draftSaveValue,
          };

          if (draftSaveValue === 0) {
            Swal.fire({
              icon: 'success',
              title: 'Draft Saved',
              text: responseMsg || 'Your additional profile details have been saved as a draft.',
              confirmButtonColor: '#1C4587',
              timer: 2500,
            });
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Details Submitted',
              text: responseMsg || 'Your additional profile details have been saved successfully.',
              confirmButtonColor: '#1C4587',
              timer: 3000,
            });
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response?.message || 'Failed to update additional details.',
            confirmButtonColor: '#1C4587',
          });
        }
      },
      error: (err: any) => {
        this.isSaving.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Request Failed',
          text: err || 'An unexpected error occurred while communicating with the server.',
          confirmButtonColor: '#1C4587',
        });
      },
    });
  }

  centralCategoryList: any = [];
  reservationCategory: any = [];
  getCentralCategory(item: any, type: any) {
    this.isSaving.set(true);

    let payload: any = {};
    if (type == 1) {
      this.reservationCategory = [];
      payload = {
        StateCd: Number(item?.state_cd ?? item?.StateId ?? item?.state_id ?? 0),
      };
    } else {
      this.centralCategoryList = [];
      payload = {
        StateCd: 0,
      };
    }
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.myProfileService.GetReservationCategories(encryptedPayload).subscribe({
      next: (response: any) => {
        this.isSaving.set(false);
        if (response?.code) {
          let decryptVal = CryptoHelper.decrypt(response.data);
          decryptVal = JSON.parse(decryptVal);
          if (type == 0) {
            this.centralCategoryList = Array.isArray(decryptVal) ? decryptVal : [];
            const rawCatId = Number(
              this.rawPartBDetails?.CategoryId ?? this.rawPartBDetails?.category_id,
            );
            const rawCatName = this.rawPartBDetails?.Category ?? this.rawPartBDetails?.category;
            if (rawCatId) {
              const matched = this.centralCategoryList.find(
                (c: any) => Number(c.AutoCategoryId) === rawCatId,
              );
              this.additionalForm.patchValue(
                {
                  category: rawCatId,
                  categoryName: matched?.CategoryName || rawCatName || '',
                },
                { emitEvent: false },
              );
            } else if (rawCatName) {
              const matched = this.centralCategoryList.find(
                (c: any) =>
                  c.CategoryName?.toLowerCase() === String(rawCatName).trim().toLowerCase(),
              );
              if (matched) {
                this.additionalForm.patchValue(
                  {
                    category: Number(matched.AutoCategoryId),
                    categoryName: matched.CategoryName,
                  },
                  { emitEvent: false },
                );
              }
            }
          } else {
            this.reservationCategory = Array.isArray(decryptVal) ? decryptVal : [];
            const rawRCatId = Number(
              this.rawPartBDetails?.RCategoryId ??
                this.rawPartBDetails?.rCategoryId ??
                this.rawPartBDetails?.rcategory_id,
            );
            const rawRCatName =
              this.rawPartBDetails?.RCategory ??
              this.rawPartBDetails?.rCategory ??
              this.rawPartBDetails?.rcategory;
            if (rawRCatId) {
              const matched = this.reservationCategory.find(
                (c: any) => Number(c.AutoCategoryId) === rawRCatId,
              );
              this.additionalForm.patchValue(
                {
                  rcategory: rawRCatId,
                  rcategoryName: matched?.CategoryName || rawRCatName || '',
                },
                { emitEvent: false },
              );
            } else if (rawRCatName) {
              const matched = this.reservationCategory.find(
                (c: any) =>
                  c.CategoryName?.toLowerCase() === String(rawRCatName).trim().toLowerCase(),
              );
              if (matched) {
                this.additionalForm.patchValue(
                  {
                    rcategory: Number(matched.AutoCategoryId),
                    rcategoryName: matched.CategoryName,
                  },
                  { emitEvent: false },
                );
              }
            }
          }
          this.cdr.detectChanges();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response?.message,
            confirmButtonColor: '#1C4587',
          });
        }
      },
      error: (err: any) => {
        this.isSaving.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Request Failed',
          text: err || 'An unexpected error occurred while communicating with the server.',
          confirmButtonColor: '#1C4587',
        });
      },
    });
  }

  onCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const catId = Number(select.value);
    const item = Array.isArray(this.centralCategoryList)
      ? this.centralCategoryList.find((c: any) => Number(c.AutoCategoryId) === catId)
      : null;
    if (item) {
      this.additionalForm.patchValue({
        category: Number(item.AutoCategoryId),
        categoryName: item.CategoryName,
      });
    } else {
      this.additionalForm.patchValue({
        category: '',
        categoryName: '',
      });
    }
  }

  onrCategoryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const rCatId = Number(select.value);
    const item = Array.isArray(this.reservationCategory)
      ? this.reservationCategory.find((c: any) => Number(c.AutoCategoryId) === rCatId)
      : null;
    if (item) {
      this.additionalForm.patchValue({
        rcategory: Number(item.AutoCategoryId),
        rcategoryName: item.CategoryName,
      });
    } else {
      this.additionalForm.patchValue({
        rcategory: '',
        rcategoryName: '',
      });
    }
  }
}
