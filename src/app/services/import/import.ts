import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError, BehaviorSubject, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { CommonService } from '../common-service';
import { environment } from '../../../environments/environment';
import {
  HistoryRecord,
  AgniveerForceType,
  AgniveerForceTypeResponse,
  AgniveerAttachmentRecord,
} from '../interfaces/import.model';

@Injectable({
  providedIn: 'root',
})
export class ImportService {
  headers = new HttpHeaders({ 'content-Type': 'application/json' });
  options = { headers: this.headers };
  apiURL: any = environment.apiUrl;

  // Shared import state / subject
  private importSubject = new BehaviorSubject<any | null>(null);
  import$ = this.importSubject.asObservable();

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookieService,
  ) {}

  handleError(error: HttpErrorResponse) {
    const errorMsg = error?.error?.message || error?.message || 'An unknown error occurred';
    /* console.error(errorMsg) */ return throwError(() => errorMsg);
  }

  clearImportSubject() {
    this.importSubject.next(null);
  }

  setImportSubject(data: any) {
    this.importSubject.next(data);
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

  // ==========================================
  // Extradition-style API Methods (...API)
  // ==========================================

  // Fetch all Agniveer XML Upload Attachments
  getAllAttachmentsAPI(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('AgniveerUpload/GetAllAttachment'), param, this.options)
      .pipe(catchError(this.handleError));
  }

  // Fetch all Agniveer Force Types
  getAllForceTypesAPI(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('AgniveerForceType/GetAll'), param, this.options)
      .pipe(catchError(this.handleError));
  }

  // Fetch Agniveer XML Import History
  getImportHistoryAPI(param: any = {}, menuId: string = '0') {
    return this.http
      .post(this.getEndpointUrl(`import/${menuId || '0'}/import-history`), param, this.options)
      .pipe(catchError(this.handleError));
  }

  // Fetch details / logs for a single import history batch
  getImportByIdAPI(id: any, menuId: string = '0', param: any = {}) {
    return this.http
      .post(
        this.getEndpointUrl(`import/${menuId || '0'}/import-history-details/${id}`),
        param,
        this.options,
      )
      .pipe(catchError(this.handleError));
  }

  // Upload Agniveer XML file with progress reporting
  uploadAgniveerXmlAPI(formData: FormData, menuId: string = '0') {
    return this.http
      .post(this.getEndpointUrl(`import/${menuId || '0'}/upload-xml`), formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(catchError(this.handleError));
  }

  // Upload XML directly to AgniveerUpload/UploadXml
  uploadXmlAPI(formData: FormData) {
    return this.http
      .post(this.getEndpointUrl('AgniveerUpload/UploadXml'), formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(catchError(this.handleError));
  }

  // ==========================================
  // Backward-Compatible Convenience Methods
  // ==========================================

  /**
   * Fetch all Agniveer XML Upload Attachments
   */
  getAllAttachments(): Observable<AgniveerAttachmentRecord[]> {
    return this.getAllAttachmentsAPI({}).pipe(
      map((res: any) => {
        return res;
      }),
      catchError((err) => {
        console.error('Error fetching all attachments:', err);
        return of([]);
      }),
    );
  }

  /**
   * Fetch all Agniveer Force Types (Armed Force Branches)
   */
  getAllForceTypes(): Observable<AgniveerForceTypeResponse> {
    return this.getAllForceTypesAPI({}).pipe(
      map((res: any) => {
        // console.log(res);

        return res;
      }),
    );
  }

  /**
   * Fetch all Agniveer XML import history records
   */
  getImportHistory(menuId: string = '0'): Observable<HistoryRecord[]> {
    return this.getImportHistoryAPI({}, menuId).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.history)) return res.history;
        if (Array.isArray(res?.importHistory)) return res.importHistory;
        if (Array.isArray(res?.result)) return res.result;
        return [];
      }),
    );
  }

  /**
   * Fetch details / logs for a single import history batch
   */
  getImportById(id: string, menuId: string = '0'): Observable<HistoryRecord> {
    return this.getImportByIdAPI(id, menuId).pipe(map((res: any) => (res?.data ? res.data : res)));
  }

  /**
   * Upload Agniveer XML file with progress reporting
   */
  uploadAgniveerXml(
    file: File,
    branch: string = 'Indian Army',
    menuId: string = '0',
    forceTypeId?: number | string,
  ): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('branch', branch);
    formData.append('Branch', branch);
    formData.append('attachment', file);
    formData.append('file', file);
    formData.append('XmlFile', file);

    if (forceTypeId !== undefined && forceTypeId !== null) {
      formData.append('forcTypeId', String(forceTypeId));
      formData.append('forceTypeId', String(forceTypeId));
      formData.append('agniveer_force_autoid', String(forceTypeId));
    }

    return this.uploadAgniveerXmlAPI(formData, menuId);
  }
}
