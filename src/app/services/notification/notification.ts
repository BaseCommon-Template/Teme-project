import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CryptoHelper } from '../../helpers/crypto-helper';

export interface JobNotificationListPayload {
  page_number: number;
  record_per_page: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class JobNotificationService {
  private readonly http = inject(HttpClient);
  readonly apiURL: string = environment.apiUrl;
  readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  readonly options = { headers: this.headers };

  handleError(error: HttpErrorResponse) {
    const errorMsg =
      error?.error?.message ||
      error?.message ||
      'An error occurred while communicating with JobNotification API.';
    console.error('[JobNotificationService] Error:', errorMsg, error);
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

  getJobNotificationList(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('JobNotification/job_notification_list'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  getAllCategories(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('Category/GetAll'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  GetReservationCategories(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('/api/Category/GetReservationCategories'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  getJobNotificationById(param: any = {}) {
    return this.http
      .post(
        this.getEndpointUrl('JobNotification/Get_job_notification_by_job_notification_autoid'),
        param,
        this.options,
      )
      .pipe(catchError(this.handleError));
  }
  AddVacancies(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('Vacancies/AddVacancies'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  Getvacanciesbyvacancies_autoid(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('Vacancies/Getvacanciesbyvacancies_autoid'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  GetvacanciesbyJobNotificationAutoid(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('Vacancies/Getvacanciesbynotification_autoid'), param, this.options)
      .pipe(catchError(this.handleError));
  }

  freezeJobNotifications(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('JobNotification/freeze_job_notifications'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  publishJobNotifications(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('JobNotification/publish_job_notifications'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  createNotification(menuId: string, payload: any): Observable<any> {
    const url = `${environment.apiUrl}JobNotification/Create_job_notification`;
    // console.log('[NotificationService] Original Payload:', payload);

    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const bodyToSend = JSON.stringify(encrypted);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: '*/*',
    });

    // console.log('[NotificationService] POST Encrypted Body ->', url);

    return this.http.post<any>(url, bodyToSend, { headers });
  }

  //uploade file
  UploadNotificationDocAPI(param: FormData, encReq: any) {
    let ftype = 0;
    if (encReq) {
      try {
        const decryptedStr = CryptoHelper.decrypt(encReq);
        if (decryptedStr) {
          const payload = JSON.parse(decryptedStr);
          if (payload && payload.filepath) {
            const filename = payload.filepath.toLowerCase();
            const ext = filename.split('.').pop();

            if (ext) {
              if (ext === 'pdf') {
                ftype = 2;
              }
            }
          }
        }
      } catch (e) {
        console.error('Error determining ftype in UploadProfilePhotoAPI:', e);
      }
    }

    const headersConfig: any = {
      accept: '*/*',
      request: encReq || '',
    };
    if (ftype > 0) {
      headersConfig['ftype'] = String(ftype);
    }

    const baseUrl = this.apiURL.endsWith('/') ? this.apiURL : this.apiURL + '/';
    return this.http
      .post<any>(`${baseUrl}Images/UploadLFile`, param, {
        headers: new HttpHeaders(headersConfig),
      })
      .pipe(catchError(this.handleError));
  }
}
