import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, throwError, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CryptoHelper } from '../../helpers/crypto-helper';

export interface NewNotificationItem {
  id?: string | null;
  notification_title: string;
  description: string;
  attachment_path: string;
  created_by: number;
  is_active: boolean;
  created_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NewnotificationService {
  private readonly http = inject(HttpClient);

  private get apiURL(): string {
    return environment.apiUrl.endsWith('/')
      ? environment.apiUrl
      : environment.apiUrl + '/';
  }

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private options = {
    headers: this.headers,
  };

  private handleError(error: any) {
    console.error('Newnotification API Error:', error);
    return throwError(() => error);
  }

  // =====================================================
  // GET ALL NOTIFICATIONS
  // POST /api/PublicMenu/Public_GetAll_Notifications
  // =====================================================
  getAll(): Observable<any> {
    const payload = {};
    let encryptedPayload: any = CryptoHelper.encrypt(JSON.stringify(payload));
    encryptedPayload = JSON.stringify(encryptedPayload);

    return this.http
      .post(this.apiURL + 'PublicMenu/Public_GetAll_Notifications', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // GET BY ID NOTIFICATION
  // POST /api/PublicMenu/Public_GetById_Notifications
  // =====================================================
  getById(id: string): Observable<any> {
    const payload = { id };
    let encryptedPayload: any = CryptoHelper.encrypt(JSON.stringify(payload));
    encryptedPayload = JSON.stringify(encryptedPayload);

    return this.http
      .post(this.apiURL + 'PublicMenu/Public_GetById_Notifications', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // ADD OR UPDATE NOTIFICATION
  // POST /api/Notification/AddOrUpdate
  // =====================================================
  addOrUpdate(payload: NewNotificationItem): Observable<any> {
    let encryptedPayload: any = CryptoHelper.encrypt(JSON.stringify(payload));
    encryptedPayload = JSON.stringify(encryptedPayload);

    return this.http
      .post(this.apiURL + 'Notification/AddOrUpdate', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // UPLOAD NOTIFICATION DOCUMENT
  // POST /api/Images/UploadLFile
  // =====================================================
  uploadNotificationDoc(param: FormData, encReq: any): Observable<any> {
    let ftype = 0;
    if (encReq) {
      try {
        const decryptedStr = CryptoHelper.decrypt(encReq);
        if (decryptedStr) {
          const payload = JSON.parse(decryptedStr);
          if (payload && payload.filepath) {
            const filename = payload.filepath.toLowerCase();
            const ext = filename.split('.').pop();

            if (ext === 'pdf') {
              ftype = 2;
            }
          }
        }
      } catch (e) {
        console.error('Error determining ftype in uploadNotificationDoc:', e);
      }
    }

    const headersConfig: any = {
      accept: '*/*',
      request: encReq || '',
    };
    if (ftype > 0) {
      headersConfig['ftype'] = String(ftype);
    }

    return this.http
      .post<any>(this.apiURL + 'Images/UploadLFile', param, {
        headers: new HttpHeaders(headersConfig),
      })
      .pipe(catchError(this.handleError.bind(this)));
  }
}

