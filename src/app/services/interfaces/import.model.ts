export interface ImportLogEntry {
  _id: string;
  import_id: string;
  service_id?: string;
  success_message?: string;
  error_message?: string;
  affected_field?: string;
  data_received?: unknown;
  status: 'INSERTED' | 'UPDATED' | 'FAILED' | 'SKIPPED' | 'DUPLICATE';
  createdAt?: string;
}

export interface HistoryRecord {
  _id: string;
  branch?: string;
  date?: string;
  time?: string;
  file_name?: string;
  file_url?: string;
  imported_by?: {
    officer_name?: string;
    name?: string;
    role?: string;
    designation?: string;
  };
  passed?: number;
  inserted?: number;
  updated?: number;
  failed?: number | any[];
  skipped?: number;
  attachment_size?: string;
  total_records?: number;
  status?: 'success' | 'partial' | 'failed' | string;
  createdAt?: string;
  logs?: ImportLogEntry[];
}

export interface AgniveerForceType {
  agniveer_force_autoid: number;
  agniveer_force_type: string;
  createdAt?: string;
  updatedAt?: string;
  is_active?: boolean;
  is_draft?: boolean;
}

export interface AgniveerForceTypeResponse {
  records: AgniveerForceType[];
  total_records?: number;
  page_number?: number;
  record_per_page?: number;
  total_pages?: number;
}

export interface AgniveerAttachmentRecord {
  Id?: string;
  _id?: string;
  AttachmentAutoId?: number;
  AgniveerForceType?: string;
  AgniveerForceTypeId?: number;
  EmailId?: string;
  Attachment?: string;
  AttachmentUrl?: string;
  AttachmentType?: string;
  Process?: number;
  TotalCount?: number;
  ValidCount?: number;
  InvalidCount?: number;
  DuplicateCount?: number;
  InsertedCount?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}
