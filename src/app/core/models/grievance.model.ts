export type GrievanceStatus = 'CREATED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface GrievanceUser {
  user_id?: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface GrievanceTimeline {
  status: GrievanceStatus;
  remarks?: string;
  created_at: string;
  created_by?: GrievanceUser;
}

export interface GrievanceMessage {
  _id?: string;
  message: string;
  created_by?: GrievanceUser;
  created_at: string;
}

export interface Grievance {
  _id?: string;
  grievance_ticket_id?: string;
  grievance_type: string;
  description: string;
  status?: GrievanceStatus;
  remarks?: string;
  created_by?: GrievanceUser;
  updated_by?: GrievanceUser;
  timeline?: GrievanceTimeline[];
  messages?: GrievanceMessage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GrievanceFormData {
  grievance_type: string;
  description: string;
  status: GrievanceStatus;
  remarks: string;
}
