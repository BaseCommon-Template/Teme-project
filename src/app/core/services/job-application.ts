import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  JobApplication,
  JobApplicationResponse,
  GetAllJobApplicationsResponse,
  CreateJobApplicationPayload,
  DraftJobApplicationPayload,
  UpdateJobApplicationStatusPayload,
  JobApplicationStatus,
} from '../models/job-application.model';
import { API_ENDPOINTS } from './api-config';

@Injectable({
  providedIn: 'root',
})
export class JobApplicationService {
  private readonly http = inject(HttpClient);

  getAllJobApplications(params?: {
    page?: number;
    limit?: number;
    search?: string;
    notification_id?: string;
    agniveer_id?: string;
    entity_id?: string;
    application_status?: JobApplicationStatus;
    is_export?: boolean;
  }): Observable<GetAllJobApplicationsResponse> {
    return this.http.get<GetAllJobApplicationsResponse>(
      API_ENDPOINTS.GET_ALL_JOB_APPLICATIONS,
      { params: params as any }
    );
  }

  getJobApplicationById(id: string): Observable<JobApplication> {
    return this.http
      .get<JobApplicationResponse>(API_ENDPOINTS.GET_JOB_APPLICATION_BY_ID(id))
      .pipe(map((res) => res.application));
  }

  getMyJobApplications(params?: {
    page?: number;
    limit?: number;
    application_status?: JobApplicationStatus;
  }): Observable<GetAllJobApplicationsResponse> {
    return this.http.get<GetAllJobApplicationsResponse>(
      API_ENDPOINTS.GET_MY_JOB_APPLICATIONS,
      { params: params as any }
    );
  }

  createJobApplication(menuId: string, payload: CreateJobApplicationPayload): Observable<JobApplication> {
    return this.http
      .post<JobApplicationResponse>(API_ENDPOINTS.CREATE_JOB_APPLICATION(menuId), payload)
      .pipe(map((res) => res.application));
  }

  draftJobApplication(payload: DraftJobApplicationPayload): Observable<JobApplication> {
    return this.http
      .post<JobApplicationResponse>(API_ENDPOINTS.DRAFT_JOB_APPLICATION, payload)
      .pipe(map((res) => res.application));
  }

  submitJobApplication(id: string): Observable<JobApplication> {
    return this.http
      .put<JobApplicationResponse>(API_ENDPOINTS.SUBMIT_JOB_APPLICATION(id), {})
      .pipe(map((res) => res.application));
  }

  withdrawJobApplication(id: string): Observable<JobApplication> {
    return this.http
      .put<JobApplicationResponse>(API_ENDPOINTS.WITHDRAW_JOB_APPLICATION(id), {})
      .pipe(map((res) => res.application));
  }

  deleteJobApplication(id: string): Observable<string> {
    return this.http
      .delete<{ message: string }>(API_ENDPOINTS.DELETE_JOB_APPLICATION(id))
      .pipe(map((res) => res.message));
  }

  updateJobApplicationStatus(
    id: string,
    menuId: string,
    payload: UpdateJobApplicationStatusPayload
  ): Observable<JobApplication> {
    return this.http
      .put<JobApplicationResponse>(
        API_ENDPOINTS.UPDATE_JOB_APPLICATION_STATUS(id, menuId),
        payload
      )
      .pipe(map((res) => res.application));
  }

  getMyJobApplicationByNotification(notificationId: string): Observable<JobApplication | null> {
    return this.http
      .put<any>(
        API_ENDPOINTS.GET_MY_JOB_APPLICATION_BY_NOTIFICATION(notificationId),
        {}
      )
      .pipe(map((res) => res?.application ?? null));
  }
}
