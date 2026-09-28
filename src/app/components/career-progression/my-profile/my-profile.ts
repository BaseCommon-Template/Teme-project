import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { MasterService } from '../../../core/services/master';
import { AuthService } from '../../../services/auth';
import { MyProfileService } from '../../../services/myprofile/myprofile';
import { CommonService } from '../../../services/common-service';
import {
  AgniveerProfile,
  SubmitAdditionalDetailsPayload,
  AgniveerUpdateAdditionalDetailsPayload,
} from '../../../services/interfaces/agniveer.model';
import {
  Nationality,
  Religion,
  Category,
  DomicileStateUT,
  DomicileDistrict,
} from '../../../core/models/masters.model';
import { CryptoHelper } from '../../../helpers/crypto-helper';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.css',
})
export class MyProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly masterService = inject(MasterService);
  private readonly authService = inject(AuthService);
  private readonly myProfileService = inject(MyProfileService);
  private readonly commonService = inject(CommonService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  @Input() agniveerId?: number | string;
  @Input() agniveerIdNo?: string;

  readonly isViewingOtherCandidate = computed(() => {
    const roleId = Number(this.authService.getRoleId());
    const queryId =
      this.route?.snapshot?.queryParams?.['id'] ||
      this.route?.snapshot?.queryParams?.['autoid'] ||
      this.route?.snapshot?.queryParams?.['agniveer_autoid'];
    const routeId = this.route?.snapshot?.params?.['id'];
    const stateId =
      typeof window !== 'undefined' ? history.state?.agniveer_autoid || history.state?.id : null;

    return Boolean(
      this.agniveerId || queryId || routeId || stateId || (roleId !== 11 && roleId > 0),
    );
  });

  readonly hasPartBData = computed(() => {
    const data = this.rawPartBDetails;

    if (!data || typeof data !== 'object') {
      return false;
    }

    const fields = [
      'MotherName',
      'mother_name',
      'Nationality',
      'nationality',
      'Religion',
      'religion',
      'Category',
      'category',
      'State',
      'state',
      'District',
      'district',
      'PoliceStation',
      'police_station',
      'RCategory',
      'SignatureFilePath',
      'signature_file_path',
    ];

    return fields.some((key) => {
      const value = data[key];

      return (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== '' &&
        String(value).trim() !== '—' &&
        String(value).trim().toLowerCase() !== 'null' &&
        String(value).trim().toLowerCase() !== 'undefined'
      );
    });
  });

  readonly profile = signal<AgniveerProfile | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly isSaving = signal<boolean>(false);

  // Edit mode: false by default (Part - B is not editable until user clicks "Update Additional Details")
  readonly isEditMode = signal<boolean>(false);
  readonly isDataAlreadySaved = signal<boolean>(false);
  agniveerAutoid: number = 1;

  // Master signals
  readonly nationalities = signal<Nationality[]>([]);
  readonly religions = signal<Religion[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly states = signal<DomicileStateUT[]>([]);
  readonly districts = signal<DomicileDistrict[]>([]);

  // Raw Agniveer response data signal
  readonly agniveerData = signal<any>(null);

  // Signature preview
  readonly signaturePreview = signal<string | null>(null);
  readonly partCDetails = signal<any | null>(null);
  readonly viewPart = signal<'B' | 'C' | null>(null);

  // Cached raw Part B details from backend
  rawPartBDetails: any = null;

  // Full hierarchical state, district, and police station records from CommonService
  private stateRecords: any[] = [];

  // Part - B Form State (Reactive FormGroup matching Extradition)
  additionalForm!: FormGroup;
  isSubmitted = false;

  get fc() {
    return this.additionalForm.controls;
  }

  ngOnInit(): void {
    this.initForm();
    this.isLoading.set(true);
    this.fetchStatesFromCommonService();
    this.fetchAgniveerDetails();

    this.route.queryParams.subscribe((params) => {
      const part = params['part'];

      if (part === 'B' || part === 'C') {
        this.viewPart.set(part);
      } else {
        this.viewPart.set(null);
      }
      const rawQId = params['id'] || params['autoid'] || params['agniveer_autoid'];
      const qId = rawQId ? CryptoHelper.decrypt(rawQId) : null;
      if (qId && Number(qId) !== this.agniveerAutoid) {
        this.fetchAgniveerDetails();
      }
    });
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/dashboard/agniveers']);
    }
  }

  initForm(): void {
    this.additionalForm = this.fb.group({
      mothersName: ['', [Validators.required]],
      nationality: ['Indian', [Validators.required]],
      religion: ['', [Validators.required]],
      category: ['', [Validators.required]],
      domicileState: ['', [Validators.required]],
      domicileDistrict: ['', [Validators.required]],
      policeStation: ['', [Validators.required]],
    });
    // Part - B is read-only / disabled by default
    this.additionalForm.disable();
  }

  enableEditMode(): void {
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
    this.cdr.detectChanges();
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
            // console.error('Error decrypting or parsing getState response:', e);
          }
          // console.log('CommonService getState decrypted response:', records);

          if (Array.isArray(records) && records.length > 0) {
            this.stateRecords = records;

            // Map states for dropdown
            const stateOptions: DomicileStateUT[] = records.map((st: any) => ({
              _id: String(st.state_cd),
              state_name: st.state_name,
              name: st.state_name,
              state_code: String(st.state_cd),
            }));
            this.states.set(stateOptions);

            // Re-reconcile and patch State and District in additionalForm
            this.syncStateAndDistrictFromCommonService();
          }
        }
      },
      error: (error: any) => {
        // console.error('Error fetching states from CommonService:', error);
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

    // 1. Match State by name or state_cd with flexible/case-insensitive matching
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

      // Ensure state is in this.states options
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

      // 2. Populate districts from matchedState.districts
      if (Array.isArray(matchedState.districts) && matchedState.districts.length > 0) {
        const districtList: DomicileDistrict[] = matchedState.districts.map((d: any) => ({
          _id: String(d.district_cd),
          district_name: d.district_name,
          name: d.district_name,
          state_id: String(matchedState.state_cd),
        }));
        this.districts.set(districtList);

        // 3. Match District by name or district_cd
        if (rawDistrict || rawDistrictId !== undefined) {
          const matchedDist = matchedState.districts.find((d: any) => {
            if (!d) return false;
            const dName = d.district_name ? String(d.district_name).trim().toLowerCase() : '';
            const rDist = rawDistrict ? String(rawDistrict).trim().toLowerCase() : '';
            const exactDist = dName && rDist && dName === rDist;
            const containsDist = dName && rDist && (dName.includes(rDist) || rDist.includes(dName));
            const distCdMatch =
              d.district_cd !== undefined &&
              (String(d.district_cd) === String(rawDistrict) ||
                (rawDistrictId !== undefined && String(d.district_cd) === String(rawDistrictId)));
            return exactDist || containsDist || distCdMatch;
          });

          if (matchedDist) {
            patchPayload.domicileDistrict = matchedDist.district_name;

            // Also check police station if present
            const rawPs =
              this.rawPartBDetails?.PoliceStation ??
              this.rawPartBDetails?.police_station ??
              this.rawPartBDetails?.Police_Station;
            const rawPsId =
              this.rawPartBDetails?.PoliceStationId ??
              this.rawPartBDetails?.police_station_id ??
              this.rawPartBDetails?.ps_cd;

            if (rawPs && String(rawPs).trim() && String(rawPs).trim() !== '—') {
              let psValue = String(rawPs).trim();
              if (
                Array.isArray(matchedDist.police_stations) &&
                matchedDist.police_stations.length > 0
              ) {
                const matchedPs = matchedDist.police_stations.find((ps: any) => {
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

    // Patch form values into reactive form tree and preserve disabled status if not editing
    this.additionalForm.patchValue(patchPayload, { emitEvent: false });
    if (!this.isEditMode()) {
      this.additionalForm.disable();
    }
    this.cdr.detectChanges();
  }

  fetchAgniveerDetails(): void {
    this.isLoading.set(true);
    const currentUser = this.authService.getCurrentUser();

    const rawQueryId =
      this.route?.snapshot?.queryParams?.['id'] ||
      this.route?.snapshot?.queryParams?.['autoid'] ||
      this.route?.snapshot?.queryParams?.['agniveer_autoid'];

    let queryId: any = null;
    if (rawQueryId) {
      try {
        const cleanCipher = decodeURIComponent(rawQueryId).replace(/ /g, '+');
        const decrypted = CryptoHelper.decrypt(cleanCipher);
        queryId = decrypted || rawQueryId;
      } catch {
        queryId = rawQueryId;
      }
    }

    const numQueryId = Number(queryId);
    const resolvedQueryId = !isNaN(numQueryId) && numQueryId > 0 ? numQueryId : queryId;

    if (resolvedQueryId && typeof resolvedQueryId === 'number') {
      this.agniveerAutoid = resolvedQueryId;
    }

    const partCAgniveerAutoId =
      resolvedQueryId || currentUser?.agniveer_autoid || this.agniveerAutoid;

    if (partCAgniveerAutoId) {
      this.fetchPartCPreference(partCAgniveerAutoId);
    }

    const agniveerAutoid = currentUser?.agniveer_autoid;

    const payload: any = {
      agniveer_autoid: resolvedQueryId ? resolvedQueryId : agniveerAutoid,
    };

    // console.log(payload, 'pauyload', currentUser, 'cure');

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    this.myProfileService
      .getAgniveerdetailsByAgniveer_autoid(JSON.stringify(encryptedPayload))
      .subscribe({
        next: (response: any) => {
          // console.log(response, 'resoponse');

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
              // console.error('Error decrypting or parsing Agniveer details:', e);
              decryptedData = response.data;
            }
          } else if (response) {
            decryptedData = response;
          }

          // console.log('Raw decrypted Agniveer details response:', decryptedData);

          // Recursively unwrap response envelopes: Agniveer, agniveer, records, data, Table, Table1, arrays
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

          // console.log('GetAgniveerdetailsByAgniveer_autoid unwrapped response:', decryptedData);

          if (
            decryptedData &&
            (decryptedData.AgniveerIdNo ||
              decryptedData.Name ||
              decryptedData.Id ||
              decryptedData.AgniveerAutoId ||
              decryptedData.AdditionalProfileDetails)
          ) {
            // Parse nested JSON strings if any
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

            // 1. Map Part - A and candidate header using the exact server keys
            const mappedProfile: any = {
              _id: String(
                decryptedData?.AgniveerIdNo ||
                  decryptedData?.Id ||
                  decryptedData?.Agniveer?.AgniveerIdNo ||
                  '',
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
                domicile_state_or_ut:
                  decryptedData?.AdditionalProfileDetails?.State ||
                  decryptedData?.additional_profile_details?.State ||
                  '—',
                domicile_district:
                  decryptedData?.AdditionalProfileDetails?.District ||
                  decryptedData?.additional_profile_details?.District ||
                  '—',
              },
              service_details: {
                service_id: String(
                  decryptedData?.AgniveerIdNo ||
                    decryptedData?.Id ||
                    decryptedData?.Agniveer?.AgniveerIdNo ||
                    '',
                ),
                service_number: String(
                  decryptedData?.AgniveerIdNo ||
                    decryptedData?.Id ||
                    decryptedData?.Agniveer?.AgniveerIdNo ||
                    '',
                ),
                defence_force:
                  decryptedData?.ArmedForceWhereRemainedPosted ||
                  decryptedData?.AgniveerForceType ||
                  'Armed Forces',
                branch:
                  decryptedData?.ArmedForceWhereRemainedPosted ||
                  decryptedData?.AgniveerForceType ||
                  'Armed Forces',
                trade: decryptedData?.PresentTradeHeld || '—',
                date_of_enrolment: decryptedData?.DateOfEnlistmentAsAgniveer || '—',
                enrollment_date: decryptedData?.DateOfEnlistmentAsAgniveer || '—',
                service_tenure: 'Active Service',
                character_assessed: 'Exemplary',
              },
              skill_and_education: {
                educational_qualification: decryptedData?.EducationalQualification || '—',
                highest_civil_education: decryptedData?.EducationalQualification || '—',
              },
              health_and_medical_details: {
                height: decryptedData?.PhysicalMeasurements?.Height || '—',
                weight: decryptedData?.PhysicalMeasurements?.Weight || '—',
                chest_size_unexp: decryptedData?.PhysicalMeasurements?.ChestUnExpanded || '—',
                chest_size_exp: decryptedData?.PhysicalMeasurements?.ChestExpanded || '—',
                medical_category: decryptedData?.LastMedicalCategory || '—',
                last_medical_exam_date: decryptedData?.LastMedicalCategoryDate || '—',
              },
              performance_and_discipline_record: {
                disciplinary_actions: decryptedData?.DetailsOfPunishmentIfAny || '—',
              },
            };
            this.profile.set(mappedProfile);

            // 2. Map Part - B using exact AdditionalProfileDetails keys
            const additionalDetails =
              decryptedData?.AdditionalProfileDetails ||
              decryptedData?.additional_profile_details ||
              decryptedData?.Additional_profile_details ||
              decryptedData?.additionalProfileDetails ||
              decryptedData;

            this.patchAdditionalProfileDetails(additionalDetails);
          } else {
            console.warn('No valid Agniveer details in response');
          }

          // Complete loading only AFTER all patching is finished
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error fetching agniveer details:', error);

          // this.isLoading.set(false);
          this.router.navigate(['/']);
        },
      });
  }

  fetchPartCPreference(agniveerAutoId: number | string): void {
    const payload = {
      agniveer_autoid: Number(agniveerAutoId),
      round: 1,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    this.myProfileService
      .GetAgniveerPreferenceByAgniveerAndRound(JSON.stringify(encryptedPayload))
      .subscribe({
        next: (response: any) => {
          try {
            let decryptedData: any = response?.data ?? response;

            // Decrypt
            if (typeof decryptedData === 'string') {
              decryptedData = CryptoHelper.decrypt(decryptedData);
            }

            // Parse JSON
            if (typeof decryptedData === 'string') {
              try {
                decryptedData = JSON.parse(decryptedData);
              } catch {
                // ignore
              }
            }

            /*
             * Response structure:
             *
             * {
             *   AgniveerPreference: {
             *      AgniveerAutoId: 102047,
             *      AgniveerIdNo: "AGN000002",
             *      Name: "Dummy Candidate 2",
             *      ApplicationNo: "AGV-APP-000000003",
             *      ...
             *      Organisations: [...]
             *   }
             * }
             */

            const preference =
              decryptedData?.AgniveerPreference ?? decryptedData?.agniveerPreference ?? null;

            if (preference && typeof preference === 'object') {
              const organisations =
                preference?.Organisations ??
                preference?.organisations ??
                preference?.Organizations ??
                preference?.organizations ??
                [];

              const partCData = {
                ...preference,
                Organisations: Array.isArray(organisations) ? organisations : [],
              };

              // Part C available
              this.partCDetails.set(partCData);
            } else {
              // Part C not available
              this.partCDetails.set(null);
            }

            this.cdr.detectChanges();
          } catch (error) {
            console.error('Error decrypting/parsing Part C Preference response:', error);

            // Hide Part C if API response is invalid
            this.partCDetails.set(null);
            this.cdr.detectChanges();
          }
        },

        error: (error: any) => {
          this.partCDetails.set(null);
          this.cdr.detectChanges();
        },
      });
  }

  patchAdditionalProfileDetails(details: any): void {
    if (!details) return;

    // 1. Unwrap data if it is a string or array or wraps an inner object/array
    let data: any = details;

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.warn('patchAdditionalProfileDetails: could not parse string details', e);
      }
    }

    if (Array.isArray(data) && data.length > 0) {
      data = data[0];
    }

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {}
    }

    if (data && typeof data === 'object') {
      // Check for nested Agniveer / agniveer
      if (data.Agniveer && typeof data.Agniveer === 'object') {
        data = { ...data, ...(Array.isArray(data.Agniveer) ? data.Agniveer[0] : data.Agniveer) };
      }
      // Check for nested Table1 / table1 (common secondary table in DataSet)
      if (Array.isArray(data.Table1) && data.Table1.length > 0) {
        data = { ...data, ...data.Table1[0] };
      } else if (Array.isArray(data.table1) && data.table1.length > 0) {
        data = { ...data, ...data.table1[0] };
      }

      // Check for nested Table / table
      if (Array.isArray(data.Table) && data.Table.length > 0) {
        data = { ...data.Table[0], ...data };
      } else if (Array.isArray(data.table) && data.table.length > 0) {
        data = { ...data.table[0], ...data };
      }

      // Check for inner additional_profile_details property
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

    if (!data || typeof data !== 'object') {
      console.warn('patchAdditionalProfileDetails: invalid data', details);
      return;
    }

    this.rawPartBDetails = data;
    // console.log('Unwrapped Part - B details for patching:', data);

    // Prepare patch object matching Extradition Reactive Form pattern
    const patchPayload: any = {};

    // 1. Mother's Name
    const motherName = data.MotherName;
    if (motherName !== undefined && motherName !== null) {
      const val = String(motherName).trim();
      if (val && val !== '—' && val !== 'null' && val !== 'undefined') {
        patchPayload.mothersName = val;
      }
    }

    // 2. Nationality
    const natName = data.Nationality;
    const natId = data.NationalityId;

    let targetNat = '';
    if (
      natName !== undefined &&
      natName !== null &&
      String(natName).trim() &&
      String(natName).trim() !== 'null' &&
      String(natName).trim() !== 'undefined'
    ) {
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
    const relName = data.Religion;
    const relId = data.ReligionId;

    let targetRel = '';
    if (
      relName !== undefined &&
      relName !== null &&
      String(relName).trim() &&
      String(relName).trim() !== 'null' &&
      String(relName).trim() !== 'undefined'
    ) {
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

    if (targetRel) {
      const standardReligions = [
        'Muslim',
        'Hindu',
        'Sikh',
        'Christian',
        'Jain',
        'Buddhist',
        'Other',
      ];
      const stdMatch = standardReligions.find((s) => s.toLowerCase() === targetRel.toLowerCase());
      if (stdMatch) {
        patchPayload.religion = stdMatch;
      } else {
        const existing = this.religions().find(
          (r) => (r.name || r.religion)?.toLowerCase() === targetRel.toLowerCase(),
        );
        if (existing) {
          patchPayload.religion = existing.name || existing.religion || targetRel;
        } else {
          patchPayload.religion = targetRel;
          this.religions.update((list) => [
            ...list,
            { _id: String(resolvedRelId || list.length + 1), name: targetRel, religion: targetRel },
          ]);
        }
      }
    }

    // 4. Category
    const catName = data.Category;
    const catId = data.CategoryId;

    let targetCat = '';
    if (
      catName !== undefined &&
      catName !== null &&
      String(catName).trim() &&
      String(catName).trim() !== 'null' &&
      String(catName).trim() !== 'undefined'
    ) {
      targetCat = String(catName).trim();
    }
    const targetCatNum = Number(targetCat);
    const resolvedCatId = !isNaN(targetCatNum) && targetCatNum > 0 ? targetCatNum : catId;

    if (resolvedCatId !== undefined && resolvedCatId !== null) {
      const found = this.categories().find(
        (c) => String(c._id) === String(resolvedCatId) || String(c.code) === String(resolvedCatId),
      );
      if (found) {
        targetCat = found.code || found.name || found.category_name || targetCat;
      }
    }

    if (targetCat) {
      const standardCats = ['UR', 'OBC', 'SC', 'ST', 'EWS'];
      let stdMatch = standardCats.find((s) => s.toLowerCase() === targetCat.toLowerCase());
      if (
        !stdMatch &&
        (targetCat.toLowerCase() === 'gen' || targetCat.toLowerCase() === 'general')
      ) {
        stdMatch = 'UR';
      }

      if (stdMatch) {
        patchPayload.category = stdMatch;
      } else {
        const existing = this.categories().find(
          (c) => (c.code || c.name || c.category_name)?.toLowerCase() === targetCat.toLowerCase(),
        );
        if (existing) {
          patchPayload.category =
            existing.code || existing.name || existing.category_name || targetCat;
        } else {
          patchPayload.category = targetCat;
          this.categories.update((list) => [
            ...list,
            { _id: String(resolvedCatId || list.length + 1), code: targetCat, name: targetCat },
          ]);
        }
      }
    }

    // 5. State / UT (Domicile State)
    const stateName =
      data.State ??
      data.state ??
      data.domicile_state ??
      data.DomicileState ??
      data.domicile_state_or_ut ??
      data.DomicileStateOrUt ??
      data.state_name ??
      data.StateName;
    const stateId =
      data.StateId ??
      data.state_id ??
      data.State_cd ??
      data.state_cd ??
      data.state_code ??
      data.State_ID;

    let targetState = '';
    if (
      stateName !== undefined &&
      stateName !== null &&
      String(stateName).trim() &&
      String(stateName).trim() !== 'null' &&
      String(stateName).trim() !== 'undefined' &&
      String(stateName).trim() !== '—'
    ) {
      targetState = String(stateName).trim();
    }

    // 6. District (Domicile District)
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
      data.district_code ??
      data.District_ID;
    let targetDistrict = '';
    if (
      districtName !== undefined &&
      districtName !== null &&
      String(districtName).trim() &&
      String(districtName).trim() !== 'null' &&
      String(districtName).trim() !== 'undefined' &&
      String(districtName).trim() !== '—'
    ) {
      targetDistrict = String(districtName).trim();
    }

    if (targetState) {
      patchPayload.domicileState = targetState;
    }
    if (targetDistrict) {
      patchPayload.domicileDistrict = targetDistrict;
    }

    // 7. Police Station
    const policeStation = data.PoliceStation;
    if (policeStation !== undefined && policeStation !== null) {
      const val = String(policeStation).trim();
      if (val && val !== '—' && val !== 'null' && val !== 'undefined') {
        patchPayload.policeStation = val;
      }
    }

    // Apply patchValue cleanly into Reactive Form tree
    this.additionalForm.patchValue(patchPayload, { emitEvent: false });
    if (!this.isEditMode()) {
      this.additionalForm.disable();
    }
    this.cdr.detectChanges();

    // Immediately sync with CommonService hierarchical state/district records if already loaded
    if (this.stateRecords && this.stateRecords.length > 0) {
      this.syncStateAndDistrictFromCommonService();
    } else if (targetState) {
      const existingState = this.states().find(
        (s) => (s.state_name || s.name)?.toLowerCase() === targetState.toLowerCase(),
      );
      const exactStateName: string = (
        existingState?.state_name ||
        existingState?.name ||
        targetState
      ).trim();
      this.additionalForm.patchValue({ domicileState: exactStateName }, { emitEvent: false });

      if (!existingState) {
        this.states.update((list) => [
          ...list,
          {
            _id: String(stateId || list.length + 1),
            state_name: exactStateName,
            name: exactStateName,
          },
        ]);
      }

      if (targetDistrict) {
        this.additionalForm.patchValue({ domicileDistrict: targetDistrict }, { emitEvent: false });
        if (
          !this.districts().some(
            (d) => (d.district_name || d.name)?.toLowerCase() === targetDistrict.toLowerCase(),
          )
        ) {
          this.districts.update((list) => [
            ...list,
            {
              _id: String(districtId || list.length + 1),
              district_name: targetDistrict,
              name: targetDistrict,
              state_id: String(stateId || '1'),
            },
          ]);
        }
      }

      this.loadDistrictsForState(exactStateName, targetDistrict, districtId);
    } else if (targetDistrict) {
      this.additionalForm.patchValue({ domicileDistrict: targetDistrict }, { emitEvent: false });
      if (
        !this.districts().some(
          (d) => (d.district_name || d.name)?.toLowerCase() === targetDistrict.toLowerCase(),
        )
      ) {
        this.districts.update((list) => [
          ...list,
          {
            _id: String(districtId || list.length + 1),
            district_name: targetDistrict,
            name: targetDistrict,
            state_id: '1',
          },
        ]);
      }
    }

    if (!this.isEditMode()) {
      this.additionalForm.disable();
    }

    // 8. Signature
    const sigPath = data.SignatureFilePath ?? data.signature_file_path;
    this.signaturePreview.set(this.getSignatureUrl(sigPath));
  }

  private loadUserProfile(currentUser: any): void {
    if (this.agniveerData()) return;
    const candidateName =
      currentUser?.name ||
      currentUser?.fullName ||
      currentUser?.full_name ||
      currentUser?.officer_name ||
      currentUser?.username ||
      'Authorized User';

    const serviceId =
      currentUser?.service_number ||
      currentUser?.service_id ||
      currentUser?.serviceNo ||
      currentUser?.userId ||
      currentUser?.username ||
      currentUser?.id ||
      '—';

    const defenceForce =
      currentUser?.defence_force ||
      currentUser?.branch ||
      currentUser?.organization ||
      currentUser?.designation ||
      currentUser?.roleName ||
      'Armed Forces';

    const userProfile: any = {
      _id: String(serviceId),
      name: candidateName,
      candidate_name: candidateName,
      father_name: currentUser?.father_name || currentUser?.fatherName || '—',
      mother_name: currentUser?.mother_name || currentUser?.motherName || '—',
      dob: currentUser?.dob || currentUser?.dateOfBirth || '—',
      gender: currentUser?.gender || '—',
      permanent_address:
        currentUser?.permanent_address ||
        currentUser?.address ||
        currentUser?.permanentAddress ||
        '—',
      mobile: currentUser?.phone || currentUser?.mobileNo || currentUser?.mobile || '—',
      phone: currentUser?.phone || currentUser?.mobileNo || currentUser?.mobile || '—',
      email: currentUser?.email || currentUser?.emailID || currentUser?.loginId || '—',
      educational_qualification:
        currentUser?.educational_qualification || currentUser?.qualification || '—',
      highest_civil_education: currentUser?.highest_civil_education || '—',
      armed_force: defenceForce,
      defence_force: defenceForce,
      trade: currentUser?.trade || '—',
      medical_category: currentUser?.medical_category || '—',
      medical_category_date: currentUser?.last_medical_exam_date || '—',
      enlistment_date: currentUser?.enrollment_date || currentUser?.date_of_enrolment || '—',
      height: currentUser?.height || '—',
      weight: currentUser?.weight || '—',
      chest_unexpanded: currentUser?.chest_size_unexp || '—',
      chest_expanded: currentUser?.chest_size_exp || '—',
      punishment: currentUser?.disciplinary_actions || '—',
      photo: '',
      personal_details: {
        name: candidateName,
        candidate_name: candidateName,
        father_name: currentUser?.father_name || currentUser?.fatherName || '—',
        mother_name: currentUser?.mother_name || currentUser?.motherName || '—',
        dob: currentUser?.dob || currentUser?.dateOfBirth || '—',
        gender: currentUser?.gender || '—',
        permanent_address:
          currentUser?.permanent_address ||
          currentUser?.address ||
          currentUser?.permanentAddress ||
          '—',
        mobile: currentUser?.phone || currentUser?.mobileNo || currentUser?.mobile || '—',
        phone: currentUser?.phone || currentUser?.mobileNo || currentUser?.mobile || '—',
        email: currentUser?.email || currentUser?.emailID || currentUser?.loginId || '—',
        domicile_state_or_ut:
          currentUser?.domicile_state_or_ut ||
          currentUser?.domicileState ||
          currentUser?.state ||
          '—',
        domicile_district:
          currentUser?.domicile_district ||
          currentUser?.domicileDistrict ||
          currentUser?.district ||
          '—',
      },
      service_details: {
        service_id: String(serviceId),
        service_number: String(serviceId),
        defence_force: defenceForce,
        branch: defenceForce,
        trade: currentUser?.trade || '—',
        date_of_enrolment: currentUser?.enrollment_date || currentUser?.date_of_enrolment || '—',
        enrollment_date: currentUser?.enrollment_date || currentUser?.date_of_enrolment || '—',
        date_of_discharge: currentUser?.date_of_discharge || '—',
        service_tenure: currentUser?.service_tenure || 'Active Service',
        character_assessed: currentUser?.character_assessed || 'Exemplary',
      },
      skill_and_education: {
        educational_qualification:
          currentUser?.educational_qualification || currentUser?.qualification || '—',
        highest_civil_education: currentUser?.highest_civil_education || '—',
        military_courses_passed: currentUser?.military_courses_passed || '—',
      },
      health_and_medical_details: {
        height: currentUser?.height || '—',
        weight: currentUser?.weight || '—',
        chest_size_unexp: currentUser?.chest_size_unexp || '—',
        chest_size_exp: currentUser?.chest_size_exp || '—',
        medical_category: currentUser?.medical_category || '—',
        last_medical_exam_date: currentUser?.last_medical_exam_date || '—',
      },
      performance_and_discipline_record: {
        disciplinary_actions: currentUser?.disciplinary_actions || '—',
      },
    };

    this.populateProfileData(userProfile);
  }

  private populateProfileData(p: AgniveerProfile): void {
    this.profile.set(p);

    const patchPayload: any = {};
    if (
      p.personal_details?.mother_name &&
      p.personal_details.mother_name !== '—' &&
      !this.additionalForm?.get('mothersName')?.value
    ) {
      patchPayload.mothersName = p.personal_details.mother_name;
    }
    if (
      p.personal_details?.domicile_state_or_ut &&
      p.personal_details.domicile_state_or_ut !== '—' &&
      !this.additionalForm?.get('domicileState')?.value
    ) {
      patchPayload.domicileState = p.personal_details.domicile_state_or_ut;
      const targetDist =
        p.personal_details.domicile_district && p.personal_details.domicile_district !== '—'
          ? p.personal_details.domicile_district
          : undefined;
      this.loadDistrictsForState(patchPayload.domicileState, targetDist);
    } else if (
      p.personal_details?.domicile_district &&
      p.personal_details.domicile_district !== '—' &&
      !this.additionalForm?.get('domicileDistrict')?.value
    ) {
      patchPayload.domicileDistrict = p.personal_details.domicile_district;
    }

    if (Object.keys(patchPayload).length > 0) {
      this.additionalForm.patchValue(patchPayload, { emitEvent: false });
      if (!this.isEditMode()) {
        this.additionalForm.disable();
      }
      this.cdr.detectChanges();
    }
  }

  getInitials(): string {
    const currentUser = this.authService.getCurrentUser();
    const name =
      this.agniveerData()?.Name ||
      this.profile()?.personal_details?.candidate_name ||
      this.profile()?.personal_details?.name;

    if (!name) return 'AP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
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

    const start =
      this.profile()?.service_details?.enrollment_date ||
      this.profile()?.service_details?.date_of_enrolment;
    const end = this.profile()?.service_details?.date_of_discharge;

    if (start && end) {
      const startYear = new Date(start).getFullYear();
      const endYear = new Date(end).getFullYear();
      if (!isNaN(startYear) && !isNaN(endYear)) {
        return `${startYear} - ${endYear}`;
      }
    }
    return '';
  }

  formatDob(dateStr?: string | null): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  onStateChange(): void {
    this.additionalForm.patchValue({
      domicileDistrict: '',
      policeStation: '',
    });
    const selectedStateName = this.additionalForm.get('domicileState')?.value;
    if (!selectedStateName) {
      this.districts.set([]);
      this.cdr.detectChanges();
      return;
    }

    if (this.stateRecords && this.stateRecords.length > 0) {
      const matchedState = this.stateRecords.find(
        (st: any) =>
          st.state_name &&
          st.state_name.trim().toLowerCase() === selectedStateName.trim().toLowerCase(),
      );

      if (matchedState && Array.isArray(matchedState.districts)) {
        const districtList: DomicileDistrict[] = matchedState.districts.map((d: any) => ({
          _id: String(d.district_cd),
          district_name: d.district_name,
          name: d.district_name,
          state_id: String(matchedState.state_cd),
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
      this.additionalForm.patchValue({ domicileDistrict: '' });
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
        }));
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
          } else if (isNaN(Number(wantedDistrict))) {
            this.additionalForm.patchValue({ domicileDistrict: wantedDistrict });
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
    const dist = this.additionalForm.get('domicileDistrict')?.value;
    const ps = this.additionalForm.get('policeStation')?.value;
    if (dist && !ps) {
      this.additionalForm.patchValue({
        policeStation: `${dist} City PS`,
      });
      this.cdr.detectChanges();
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

  onSignatureSelected(event: Event): void {
    if (!this.isEditMode()) return;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire('File Too Large', 'Signature file size must be less than 2MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        this.signaturePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeSignature(): void {
    if (!this.isEditMode()) return;
    this.signaturePreview.set(null);
  }

  buildUpdatePayload(draftSaveValue: number): AgniveerUpdateAdditionalDetailsPayload {
    const formVals = this.additionalForm.getRawValue();

    // 1. Nationality
    const natName = String(formVals.nationality || '').trim();
    const matchedNat = this.nationalities().find(
      (n) => (n.name || n.nationality)?.toLowerCase() === natName.toLowerCase(),
    );
    const nationalityId = Number(matchedNat?._id || this.rawPartBDetails?.NationalityId || 0);

    // 2. Religion
    const relName = String(formVals.religion || '').trim();
    const matchedRel = this.religions().find(
      (r) => (r.name || r.religion)?.toLowerCase() === relName.toLowerCase(),
    );
    const religionId = Number(matchedRel?._id || this.rawPartBDetails?.ReligionId || 0);

    // 3. Category
    const catName = String(formVals.category || '').trim();
    const matchedCat = this.categories().find(
      (c) => (c.code || c.name || c.category_name)?.toLowerCase() === catName.toLowerCase(),
    );
    const categoryId = Number(matchedCat?._id || this.rawPartBDetails?.CategoryId || 0);

    // 4. State
    const stateName = String(formVals.domicileState || '').trim();
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
        (s) => (s.state_name || s.name)?.toLowerCase() === stateName.toLowerCase(),
      );
      if (stateObj?._id && !isNaN(Number(stateObj._id))) {
        stateId = Number(stateObj._id);
      }
    }

    // 5. District
    const distName = String(formVals.domicileDistrict || '').trim();
    let districtId = Number(this.rawPartBDetails?.DistrictId || 0);
    const distObj = this.districts().find(
      (d) => (d.district_name || d.name)?.toLowerCase() === distName.toLowerCase(),
    );
    if (distObj?._id && !isNaN(Number(distObj._id))) {
      districtId = Number(distObj._id);
    }

    // 6. Police Station
    const psName = String(formVals.policeStation || '').trim();
    let psId = Number(this.rawPartBDetails?.PoliceStationId || 0);
    if (this.stateRecords && this.stateRecords.length > 0) {
      const matchedState = this.stateRecords.find(
        (st: any) =>
          st.state_name && st.state_name.trim().toLowerCase() === stateName.toLowerCase(),
      );
      if (matchedState && Array.isArray(matchedState.districts)) {
        const matchedDistrict = matchedState.districts.find(
          (d: any) =>
            d.district_name && d.district_name.trim().toLowerCase() === distName.toLowerCase(),
        );
        if (matchedDistrict && Array.isArray(matchedDistrict.police_stations)) {
          const matchedPs = matchedDistrict.police_stations.find(
            (p: any) => (p.ps_name || p.name)?.trim().toLowerCase() === psName.toLowerCase(),
          );
          if (matchedPs?.ps_cd) {
            psId = Number(matchedPs.ps_cd);
          }
        }
      }
    }

    // 7. Signature File Path (Static as requested: agniveer/agniveerId/signature/filename)
    const agniveerId = this.agniveerAutoid || 'agniveerId';
    const sigPath = `agniveer/${agniveerId}/signature/filename`;

    // 8. Rehabilitated status
    const isRehab =
      this.rawPartBDetails?.Rehabilitated ?? this.rawPartBDetails?.rehabilitated ?? false;

    const additionalDetails = {
      mother_name: String(formVals.mothersName || '').trim(),
      MotherName: String(formVals.mothersName || '').trim(),
      nationality_id: Number(nationalityId) || 0,
      NationalityId: Number(nationalityId) || 0,
      nationality: natName,
      Nationality: natName,
      religion_id: Number(religionId) || 0,
      ReligionId: Number(religionId) || 0,
      religion: relName,
      Religion: relName,
      category_id: Number(categoryId) || 0,
      CategoryId: Number(categoryId) || 0,
      category: catName,
      Category: catName,
      state_id: Number(stateId) || 0,
      StateId: Number(stateId) || 0,
      state: stateName,
      State: stateName,
      district_id: Number(districtId) || 0,
      DistrictId: Number(districtId) || 0,
      district: distName,
      District: distName,
      police_station_id: Number(psId) || 0,
      PoliceStationId: Number(psId) || 0,
      police_station: psName,
      PoliceStation: psName,
      signature_file_path: sigPath,
      SignatureFilePath: sigPath,
      draft_save: draftSaveValue,
      DraftSave: draftSaveValue,
      draftSave: draftSaveValue,
    };

    const autoId = Number(
      this.agniveerAutoid ||
        this.agniveerData()?.AgniveerAutoId ||
        this.agniveerData()?.AutoId ||
        0,
    );

    const payload: AgniveerUpdateAdditionalDetailsPayload = {
      agniveer_autoid: autoId,
      AgniveerAutoid: autoId,
      draft_save: draftSaveValue,
      DraftSave: draftSaveValue,
      draftSave: draftSaveValue,
      rehabilitated: Boolean(isRehab),
      Rehabilitated: Boolean(isRehab),
      additional_profile_details: additionalDetails,
      AdditionalProfileDetails: additionalDetails,
    };

    return payload;
  }

  private sendUpdateDetails(draftSaveValue: number): void {
    const rawPayload = this.buildUpdatePayload(draftSaveValue);
    if (!rawPayload) {
      this.isSaving.set(false);
      return;
    }
    const payload: AgniveerUpdateAdditionalDetailsPayload = rawPayload;

    this.isSaving.set(true);
    // return console.log(
    //   `[MyProfile] Calling AgniveerUpdateAdditionalDetails with DraftSave = ${draftSaveValue}:`,
    //   payload,
    // );

    this.myProfileService.agniveerUpdateAdditionalDetails(payload).subscribe({
      next: (response: any) => {
        this.isSaving.set(false);
        // console.log('AgniveerUpdateAdditionalDetails response:', response);
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

          // If existing database draft_save = 1 -> Update is NOT allowed. API returns: "Data already saved."
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

          // Successfully updated/saved
          this.isEditMode.set(false);
          this.additionalForm.disable();

          if (draftSaveValue === 1) {
            this.isDataAlreadySaved.set(true);
          }

          // Cache updated details in rawPartBDetails
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
              confirmButtonColor: '#0e2a5c',
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
        const errorText =
          typeof err === 'string' ? err : err?.message || 'Failed to update additional details.';
        if (errorText.toLowerCase().includes('already saved')) {
          this.isDataAlreadySaved.set(true);
          this.isEditMode.set(false);
          this.additionalForm.disable();
          Swal.fire({
            icon: 'info',
            title: 'Data Already Saved',
            text: 'Data already saved; update is not allowed.',
            confirmButtonColor: '#1C4587',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: errorText,
            confirmButtonColor: '#1C4587',
          });
        }
      },
    });
  }

  onSaveDraft(): void {
    if (this.isDataAlreadySaved()) {
      Swal.fire('Data Already Saved', 'Data already saved; update is not allowed.', 'info');
      this.isEditMode.set(false);
      this.additionalForm.disable();
      return;
    }
    this.sendUpdateDetails(0);
  }

  onSubmitDetails(): void {
    if (this.isDataAlreadySaved()) {
      Swal.fire('Data Already Saved', 'Data already saved; update is not allowed.', 'info');
      this.isEditMode.set(false);
      this.additionalForm.disable();
      return;
    }
    this.isSubmitted = true;
    if (this.additionalForm.invalid) {
      this.additionalForm.markAllAsTouched();
      const firstInvalid = Object.keys(this.fc).find((k) => this.fc[k].invalid);
      let label = 'all mandatory fields marked with (*)';
      if (firstInvalid === 'mothersName') label = "Mother's Name";
      else if (firstInvalid === 'nationality') label = 'Nationality';
      else if (firstInvalid === 'religion') label = 'Religion';
      else if (firstInvalid === 'category') label = 'Category';
      else if (firstInvalid === 'domicileState') label = 'Domicile State / UT';
      else if (firstInvalid === 'domicileDistrict') label = 'Domicile District';
      else if (firstInvalid === 'policeStation') label = 'Police Station';

      Swal.fire('Required Field', `Please fill ${label}.`, 'warning');
      return;
    }

    this.sendUpdateDetails(1);
  }
}
