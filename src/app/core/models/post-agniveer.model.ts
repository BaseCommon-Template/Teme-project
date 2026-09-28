export interface Qualification {
  _id?: string;
  course?: string;
  degree_diploma?: string;
  board?: string;
  institution_board_university?: string;
  passing_year?: number | string;
  year_of_passing?: number | string;
  percentage?: string;
  percentage_grade?: string;
  major_specialization?: string;
}

export interface Employment {
  _id?: string;
  company_name?: string;
  organization_name?: string;
  designation?: string;
  employment_type?: string;
  duration?: string;
  from_date?: string;
  to_date?: string;
  job_description?: string;
  currently_working?: boolean;
}

export interface Training {
  _id?: string;
  training_title?: string;
  course_name?: string;
  training_agency?: string;
  institute_name?: string;
  duration_weeks?: number | string;
  duration?: string;
  start_date?: string;
  end_date?: string;
  skills_acquired?: string;
}

export interface Certification {
  _id?: string;
  certificate_title?: string;
  certificate_name?: string;
  issuing_authority?: string;
  issuing_organization?: string;
  issue_date?: string;
  valid_upto?: string;
  certificate_number?: string;
}

export interface PostAgniveerProfile {
  _id?: string;
  agniveer_profile_id?: string;
  agniveer_id?: string;
  qualifications?: Qualification[];
  employments?: Employment[];
  trainings?: Training[];
  certifications?: Certification[];
  createdAt?: string;
  updatedAt?: string;
}
