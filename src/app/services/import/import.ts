import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError, BehaviorSubject, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { CommonService } from '../common-service';
import { environment } from '../../../environments/environment';

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

  /**
   * Fetch details / logs for a single import history batch
   */
  getImportById(id: string, menuId: string = '0'): Observable<any> {
    return this.getImportByIdAPI(id, menuId).pipe(map((res: any) => (res?.data ? res.data : res)));
  }

}
