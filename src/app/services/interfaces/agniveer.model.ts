export interface ImportSummary {
  inserted: number;
  updated: number;
  skipped: number;
  failed: { service_id: string; error: string }[];
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
}

export interface PersonalDetails {
  name?: string;
  candidate_name?: string;
  dob?: string;
  gender?: string;
  aadhar_masked?: string;
  father_name?: string;
  mother_name?: string;
  permanent_address?: string;
  current_address?: string;
  state?: string;
  domicile_state_or_ut?: string;
  domicile_district?: string;
  mobile?: string;
  phone?: string;
  email?: string;
}

export interface ServiceDetails {
  service_id?: string;
  service_number?: string;
  branch?: string;
  defence_force?: string;
  unit?: string;
  rank?: string;
  trade?: string;
  enrollment_date?: string;
  date_of_enrolment?: string;
  date_of_discharge?: string;
  service_tenure?: string;
  character_assessed?: string;
}

export interface Certifications {
  Kaushal_Praman_Patra_through_NCVET?: string;
  NSQF_Level?: string;
  Kaushal_Praman_Patra_through_NCVET2?: string;
  NSQF_Level2?: string;
  Trade_Name_Skill_Job_Roll?: string;
}

export interface SkillAndEducation {
  educational_qualification?: string;
  highest_civil_education?: string;
  military_courses_passed?: string;
  kaushal_praman_patra_issued?: boolean;
  Computer_IT_Skill_Certificate?: string;
  certifications?: Certifications;
}

export interface HealthAndMedicalDetails {
  height?: string;
  weight?: string;
  chest_size_exp?: string;
  chest_size_unexp?: string;
  blood_group?: string;
  medical_category?: string;
  last_medical_exam_date?: string;
  remarks?: string;
}

export interface PerformanceAndDisciplineRecord {
  disciplinary_actions?: string;
  commendations_awards?: string;
  outstanding_achievements?: string;
}

export interface ForcePreference {
  force?: string;
  force_name?: string;
  preference_order?: number;
  posts?: string[];
}

export interface AgniveerProfile {
  _id?: string;
  service_id?: string;
  name?: string;
  father_name?: string;
  dob?: string;
  gender?: string;
  permanent_address?: string;
  mobile?: string;
  email?: string;
  educational_qualification?: string;
  armed_force?: string;
  trade?: string;
  medical_category?: string;
  medical_category_date?: string;
  enlistment_date?: string;
  height?: string;
  weight?: string;
  chest_unexpanded?: string;
  chest_expanded?: string;
  punishment?: string;
  photo?: string;
  personal_details: PersonalDetails;
  service_details: ServiceDetails;
  skill_and_education?: SkillAndEducation;
  health_and_medical_details?: HealthAndMedicalDetails;
  performance_and_discipline_record?: PerformanceAndDisciplineRecord;
  rehab_status?: string;
  interested_in_rehab?: boolean;
  image_url?: string;
  mother_name_temp?: string;
  current_address_temp?: string;
  chest_size_exp_temp?: string;
  chest_size_unexp_temp?: string;
  Trade_Name_Skill_Job_Roll_temp?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  sub_category?: string;
  domicile_state?: string;
  domicile_district?: string;
  police_station?: string;
  force_preferences?: ForcePreference[];
  is_add_details_submitted?: boolean;
  is_add_details_approved?: boolean;
  is_add_details_rejected?: boolean;
  [key: string]: any;
}

export interface AgniveerResponse {
  agniveerProfile: AgniveerProfile;
  message: string;
}

export interface SubmitAdditionalDetailsPayload {
  _id?: string;
  personal_details?: PersonalDetails;
  service_details?: ServiceDetails;
  force_preferences?: ForcePreference[];
  mother_name?: string;
  chest_size_exp?: string;
  chest_size_unexp?: string;
  Trade_Name_Skill_Job_Roll?: string;
  current_address?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  sub_category?: string;
  domicile_state?: string;
  domicile_district?: string;
  police_station?: string;
}

export interface ApprovalSubmittedDetails {
  mother_name?: string;
  chest_size_exp?: string;
  chest_size_unexp?: string;
  Trade_Name_Skill_Job_Roll?: string;
  nationality?: string;
  religion?: string;
  category?: string;
  sub_category?: string;
  domicile_state?: string;
  domicile_district?: string;
  police_station?: string;
  force_preferences?: ForcePreference[];
  personal_details?: PersonalDetails;
}

export interface AgniveerProfileApproval {
  _id: string;
  agniveer_profile_id: string | AgniveerProfile;
  service_id?: string;
  service_number?: string;
  candidate_name?: string;
  defence_force?: string;
  submitted_details?: ApprovalSubmittedDetails;
  additional_details?: ApprovalSubmittedDetails;
  status: 'Pending' | 'Approved' | 'Rejected';
  reviewed_by?:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
      };
  reviewed_at?: string;
  review_remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalPagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetAgniveerApprovalsResponse {
  approvals: AgniveerProfileApproval[];
  pagination: ApprovalPagination;
}

export interface VerifyAgniveerApprovalPayload {
  status: 'Approved' | 'Rejected';
  remarks?: string;
  review_remarks?: string;
}

export interface VerifyAgniveerApprovalResponse {
  approval: AgniveerProfileApproval;
  agniveerProfile: AgniveerProfile;
  message: string;
}

// ============================================================
// AGNIVEER UPDATE ADDITIONAL DETAILS API PAYLOAD
// POST /api/Agniveer/AgniveerUpdateAdditionalDetails
// ============================================================
export interface AdditionalProfileDetailsPayload {
  mother_name: string;
  MotherName?: string;
  nationality_id: number;
  NationalityId?: number;
  nationality: string;
  Nationality?: string;
  religion_id: number;
  ReligionId?: number;
  religion: string;
  Religion?: string;
  category_id: number;
  CategoryId?: number;
  category: string;
  Category?: string;
  state_id: number;
  StateId?: number;
  state: string;
  State?: string;
  district_id: number;
  DistrictId?: number;
  district: string;
  District?: string;
  police_station_id: number;
  PoliceStationId?: number;
  police_station: string;
  PoliceStation?: string;
  signature_file_path: string;
  SignatureFilePath?: string;
  draft_save?: number;
  DraftSave?: number;
  draftSave?: number;
  [key: string]: any;
}

export interface AgniveerUpdateAdditionalDetailsPayload {
  agniveer_autoid: number;
  AgniveerAutoid?: number;
  draft_save: number; // 0 = Allow update; 1 = Data already saved (update NOT allowed)
  DraftSave?: number;
  draftSave?: number;
  rehabilitated: boolean;
  Rehabilitated?: boolean;
  additional_profile_details: AdditionalProfileDetailsPayload;
  AdditionalProfileDetails?: AdditionalProfileDetailsPayload;
  [key: string]: any;
}
