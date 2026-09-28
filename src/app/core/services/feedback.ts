import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Feedback, FeedbackFormData } from '../models/feedback.model';
import { API_ENDPOINTS } from './api-config';

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.feedbacks)) return data.feedbacks;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly http = inject(HttpClient);

  getAllFeedbacks(): Observable<Feedback[]> {
    return this.http
      .get<any>(API_ENDPOINTS.GET_ALL_FEEDBACK)
      .pipe(map((res) => toArray(res)));
  }

  createFeedback(menuIdOrPayload: string | FeedbackFormData, payload?: FeedbackFormData): Observable<Feedback> {
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http.post<Feedback>(API_ENDPOINTS.CREATE_FEEDBACK, body);
  }

  updateFeedback(id: string, payload: Partial<FeedbackFormData>): Observable<Feedback> {
    return this.http.put<Feedback>(API_ENDPOINTS.UPDATE_FEEDBACK(id), payload);
  }

  deleteFeedback(id: string): Observable<any> {
    return this.http.delete(API_ENDPOINTS.DELETE_FEEDBACK(id));
  }
}
