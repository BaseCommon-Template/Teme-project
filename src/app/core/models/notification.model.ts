export interface PaginationData {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NotificationFromAPI {
  _id: string;
  advertisement_number: string;
  date_of_advertisement: string;
  application_opening_date: string;
  application_closing_date: string;
  notification_title: string;
  description: string;
  job_link_url?: string;
  entity_id: string | any;
  sub_entity_id: string | any;
  number_of_vacancies?: string | number;
  createdAt: string;
  updatedAt?: string;
  post_preference?: string[];
  is_vacancy_added?: boolean;
  is_vacancy_freezed?: boolean;
  job_type?: 'State' | 'Centre';
}

export interface CreateNotificationPayload {
  advertisement_number: string;
  date_of_advertisement: string;
  application_opening_date: string;
  application_closing_date: string;
  notification_title: string;
  description: string;
  job_link_url?: string;
  entity_id: string;
  sub_entity_id: string;
  number_of_vacancies?: string | number;
  post_preference: string[];
}

export interface UpdateNotificationPayload {
  advertisement_number: string;
  date_of_advertisement: string;
  application_opening_date: string;
  application_closing_date: string;
  notification_title: string;
  description: string;
  job_link_url?: string;
  entity_id: string;
  sub_entity_id: string;
  number_of_vacancies?: string | number;
  post_preference: string[];
}

export interface GetAllNotificationsResponse {
  notifications: NotificationFromAPI[];
  pagination: PaginationData;
}
