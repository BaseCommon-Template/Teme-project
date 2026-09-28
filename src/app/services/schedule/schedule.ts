import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ScheduleItem {
  Id?: string;
  id?: string;
  OpeningDate?: string | null;
  openingDate?: string | null;
  ClosingDate?: string | null;
  closingDate?: string | null;
  CreatedBy?: number | null;
  createdBy?: number | null;
  IsArmy?: boolean | null;
  isArmy?: boolean | null;
  IsNavy?: boolean | null;
  isNavy?: boolean | null;
  IsAirForce?: boolean | null;
  isAirForce?: boolean | null;
  CreatedAt?: string;
  createdAt?: string;
  UpdatedAt?: string;
  updatedAt?: string;
  Round?: number | string | null;
  round?: number | string | null;
  Active?: boolean | null;
  active?: boolean | null;
  IsActive?: boolean | null;
  isActive?: boolean | null;
  ScheduleAutoId?: number | null;
  scheduleAutoId?: number | null;
  schedule_autoid?: number | null;
  ProfileEditOpeningDate?: string | null;
  profileEditOpeningDate?: string | null;
  profileedit_opening_date?: string | null;
  ProfileEditClosingDate?: string | null;
  profileEditClosingDate?: string | null;
  profileedit_closing_date?: string | null;
  OpenPartB?: boolean | null;
  openPartB?: boolean | null;
  open_part_b?: boolean | null;
  OpenPartC?: boolean | null;
  openPartC?: boolean | null;
  open_part_c?: boolean | null;
  [key: string]: any;
}

export interface ActiveScheduleResponse {
  Schedule?: ScheduleItem | null;
  schedule?: ScheduleItem | null;
  data?: any;
  statusCode?: number;
  message?: string;
  isSuccess?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ScheduleService {
  private readonly http = inject(HttpClient);
  readonly apiURL: string = environment.apiUrl;
  readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  readonly options = { headers: this.headers };

  private handleError(error: HttpErrorResponse) {
    const errorMsg =
      error?.error?.message ||
      error?.message ||
      'An error occurred while communicating with Schedule API.';
    return throwError(() => error);
  }

  private getEndpointUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const base = this.apiURL.endsWith('/') ? this.apiURL : this.apiURL + '/';
    let path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // If base URL already includes 'api/' and path also starts with 'api/', avoid duplicate 'api/'
    if (base.endsWith('api/') && path.startsWith('api/')) {
      path = path.slice(4);
    }

    return base + path;
  }

  /**
   * Fetch Active Schedule from endpoint: api/Schedule/GetActiveSchedule
   * Supports both POST (default backend pattern) and GET (if 405 Method Not Allowed).
   */
  getActiveSchedule(param: any = {}): Observable<any> {
    const url = this.getEndpointUrl('Schedule/GetActiveSchedule');
    return this.http.post<any>(url, param, this.options).pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleError(err);
      }),
    );
  }
  getScheuleList(param: any = {}): Observable<any> {
    const url = this.getEndpointUrl('Schedule/GetScheuleList');
    return this.http.post<any>(url, param, this.options).pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleError(err);
      }),
    );
  }
  updateAndCreateSchedule(param: any = {}): Observable<any> {
    const url = this.getEndpointUrl('/Schedule/CreateSchedules');
    return this.http.post<any>(url, param, this.options).pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleError(err);
      }),
    );
  }
}
