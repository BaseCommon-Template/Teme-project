export interface Feedback {
  _id?: string;
  service_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  comments?: string;
  subject?: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeedbackFormData {
  service_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  comments?: string;
  subject?: string;
  rating?: number;
}
