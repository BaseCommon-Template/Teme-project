import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CryptoHelper } from '../../helpers/crypto-helper';

export interface UploadXmlResponse {
  statusCode?: number;
  message?: string;
  isSuccess?: boolean;
  data?: any;
  summary?: {
    inserted?: number;
    updated?: number;
    failed?: any[];
    skipped?: number;
    total?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AgniveerUploadService {
  private readonly http = inject(HttpClient);
  headers = new HttpHeaders({ 'content-Type': 'application/json' });
  options = { headers: this.headers };
  apiURL: any = environment.apiUrl;
  private getApiUrl(): string {
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
    // If base already contains 'api/', avoid duplicating it
    if (base.endsWith('api/')) {
      return base + 'AgniveerUpload/UploadXml';
    }
    return base + 'api/AgniveerUpload/UploadXml';
  }

  handleError(error: HttpErrorResponse) {
    const errorMsg =
      error?.error?.message || error?.message || 'XML Upload failed. Please try again.';
    return throwError(() => error);
  }

  /**
   * Upload Agniveer XML File to endpoint: /api/AgniveerUpload/UploadXml
   * @param file - The XML File selected by the user
   * @param branch - The Armed Force Branch (ARMY, NAVY, AIR_FORCE)
   * @param additionalFields - Optional additional form payload fields
   */
  uploadXml(
    file: File,
    branch: string = 'ARMY',
    additionalFields?: Record<string, any>,
  ): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachment', file);
    formData.append('XmlFile', file);
    formData.append('branch', branch);
    formData.append('Branch', branch);

    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
    }

    const endpoint = this.getApiUrl();
    return this.http.post<any>(endpoint, formData).pipe(catchError(this.handleError));
  }

  /**
   * Upload Agniveer XML with progress reporting and encrypted forceTypeId payload
   */
  uploadXmlWithProgress(
    file: File,
    branch: string = 'ARMY',
    forceTypeId?: number | string,
    encryptedPayload?: string,
  ): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachment', file);
    formData.append('XmlFile', file);
    formData.append('branch', branch);
    formData.append('Branch', branch);

    if (forceTypeId !== undefined && forceTypeId !== null) {
      formData.append('forcTypeId', String(forceTypeId));
      formData.append('forceTypeId', String(forceTypeId));
      formData.append('agniveer_force_autoid', String(forceTypeId));
    }

    // Encrypted payload containing { forceTypeId: agniveer_force_autoid }
    const encPayload =
      encryptedPayload ||
      (forceTypeId !== undefined && forceTypeId !== null
        ? CryptoHelper.encrypt(
            JSON.stringify({
              forceTypeId: Number(forceTypeId),
              forcTypeId: Number(forceTypeId),
              agniveer_force_autoid: Number(forceTypeId),
            }),
          )
        : '');

    if (encPayload) {
      formData.append('payload', encPayload);
      formData.append('Payload', encPayload);
      formData.append('data', encPayload);
      formData.append('Data', encPayload);
      formData.append('encryptedPayload', encPayload);
    }

    const endpoint = this.getApiUrl();
    return this.http
      .post<any>(endpoint, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Fetch Agniveer Post Master list
   * POST /api/AgniveerUpload/GetPostMaster
   */
  getPostMaster(payload: any = {}): Observable<any> {
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
    let endpoint = base.endsWith('api/')
      ? base + 'AgniveerUpload/GetPostMaster'
      : base + 'api/AgniveerUpload/GetPostMaster';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      accept: '*/*',
    });

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(endpoint, JSON.stringify(encryptedPayload), { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Upload Agniveer Merit List Excel file
   * POST /api/AgniveerUpload/UploadMeritExcel
   * @param file - The Excel file (.xlsx / .xls)
   * @param additionalFields - Optional extra form fields
   */
  uploadMeritExcel(file: File, additionalFields?: Record<string, any>): Observable<any> {
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
    const endpoint = base.endsWith('api/')
      ? base + 'AgniveerUpload/UploadMeritExcel'
      : base + 'api/AgniveerUpload/UploadMeritExcel';

    const formData = new FormData();
    formData.append('MeritFile', file, file.name);
    formData.append('meritFile', file, file.name);
    formData.append('file', file, file.name);
    formData.append('File', file, file.name);

    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          formData.append(key, String(val));
        }
      });
    }

    return this.http.post<any>(endpoint, formData).pipe(catchError(this.handleError));
  }

  /**
   * Upload Agniveer Merit List Excel with progress reporting
   * POST /api/AgniveerUpload/UploadMeritExcel
   */
  uploadMeritExcelWithProgress(file: File): Observable<HttpEvent<any>> {
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
    const endpoint = base.endsWith('api/')
      ? base + 'AgniveerUpload/UploadMeritExcel'
      : base + 'api/AgniveerUpload/UploadMeritExcel';

    const formData = new FormData();
    formData.append('MeritFile', file, file.name);
    formData.append('meritFile', file, file.name);
    formData.append('file', file, file.name);
    formData.append('File', file, file.name);

    return this.http
      .post<any>(endpoint, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(catchError(this.handleError));
  }

  //uploade file
  UploadProfilePhotoAPI(param: FormData, encReq: any) {
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
              if (['jpg', 'jpeg', 'png'].includes(ext)) {
                ftype = 1;
              } else if (ext === 'pdf') {
                ftype = 2;
              } else {
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
      .post<any>(`${baseUrl}Images/UploadLImages`, param, {
        headers: new HttpHeaders(headersConfig),
      })
      .pipe(catchError(this.handleError));
  }
  // ✅ GET PDF FILE (BASE64 RESPONSE)
  // GetAlbumFileAPI(param: any) {
  //   return this.http
  //     .post<any>(`${this.apiURL}Images/GetAlbumFile`, param, this.options)
  //     .pipe(catchError(this.handleError));
  // }
}
