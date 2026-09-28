export type JobApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_scrutiny'
  | 'shortlisted'
  | 'rejected'
  | 'selected'
  | 'withdrawn'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_SCRUTINY'
  | 'SHORTLISTED'
  | 'REJECTED'
  | 'ACCEPTED'
  | 'SELECTED'
  | string;

export interface JobPostPreference {
  preference_order: number;
  sub_entity_id?: string;
  sub_entity_name?: string;
  post?: string;
  post_name?: string;
}

export interface NotificationPost {
  post_preference_name?: string;
  post_preference_id?: string;
  number_of_vacancies?: number;
}

export interface NotificationPostVacancy {
  sub_entity_name?: string;
  sub_entity_id?: string;
  posts?: NotificationPost[];
}

export interface JobNotificationSnapshot {
  advertisement_number?: string;
  date_of_advertisement?: string;
  application_opening_date?: string;
  application_closing_date?: string;
  notification_title?: string;
  description?: string;
  job_link_url?: string;
  entity_id?: string;
  post_vacancies?: NotificationPostVacancy[];
}

export interface JobPersonalDetails {
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
  mobile?: string;
  email?: string;
}

export interface JobServiceDetails {
  service_id?: string;
  service_number?: string;
  branch?: string;
  unit?: string;
  enrollment_date?: string;
  trade_name?: string;
  trade?: string;
  service_tenure?: string;
}

export interface JobCertifications {
  Kaushal_Praman_Patra_through_NCVET?: string;
  NSQF_Level?: string;
  Kaushal_Praman_Patra_through_NCVET2?: string;
  NSQF_Level2?: string;
  Trade_Name_Skill_Job_Roll?: string;
}

export interface JobSkillAndEducation {
  certifications?: JobCertifications;
  educational_qualification?: string;
  Computer_IT_Skill_Certificate?: string;
}

export interface JobHealthAndMedicalDetails {
  height?: string;
  weight?: string;
  chest_size_exp?: string;
  chest_size_unexp?: string;
  blood_group?: string;
  medical_category?: string;
  last_medical_exam_date?: string;
  remarks?: string;
}

export interface JobPerformanceAndDisciplineRecord {
  disciplinary_actions?: string;
  commendations_awards?: string;
  outstanding_achievements?: string;
}

export interface AgniveerJobSnapshot {
  service_id?: string;
  personal_details?: JobPersonalDetails;
  service_details?: JobServiceDetails;
  skill_and_education?: JobSkillAndEducation;
  health_and_medical_details?: JobHealthAndMedicalDetails;
  performance_and_discipline_record?: JobPerformanceAndDisciplineRecord;
  image_url?: string;
  image_size?: string;
  image_path?: string | null;
  nationality?: string;
  religion?: string;
  category?: string;
  sub_category?: string;
  domicile_state?: string;
  domicile_district?: string;
  police_station?: string;
}

export interface JobApplication {
  _id: string;
  agniveer_id?: string | any;
  notification_id?: string | any;
  application_number?: string;
  application_status: JobApplicationStatus;
  submitted_at?: string | null;
  notification?: JobNotificationSnapshot;
  notification_snapshot?: JobNotificationSnapshot;
  agniveer?: AgniveerJobSnapshot;
  agniveer_snapshot?: AgniveerJobSnapshot;
  entity_id?: string | any;
  entity_name?: string;
  post_preferences?: (JobPostPreference & { sub_entity_id?: string | any })[];
  created_by?: string;
  updated_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobApplicationResponse {
  application: JobApplication;
  message: string;
}

export interface JobApplicationsPagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface GetAllJobApplicationsResponse {
  applications: JobApplication[];
  pagination: JobApplicationsPagination;
  message: string;
}

export interface CreateJobApplicationPayload {
  agniveer_id?: string;
  notification_id: string;
  entity_id?: string;
  entity_name?: string;
  post_preferences?: JobPostPreference[];
}

export interface DraftJobApplicationPayload {
  notification_id: string;
  entity_id?: string;
  entity_name?: string;
  post_preferences?: JobPostPreference[];
}

export interface UpdateJobApplicationStatusPayload {
  application_status: JobApplicationStatus;
}
