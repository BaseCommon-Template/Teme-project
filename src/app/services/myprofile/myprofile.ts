import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CryptoHelper } from '../../helpers/crypto-helper';

@Injectable({
  providedIn: 'root',
})
export class MyProfileService {
  headers = new HttpHeaders({ 'content-Type': 'application/json' });
  options = { headers: this.headers };
  apiURL: any = environment.apiUrl;

  constructor(private http: HttpClient) {}

  handleError(error: HttpErrorResponse) {
    const errorMsg = error?.error?.message || error?.message || 'An unknown error occurred';
    return throwError(() => errorMsg);
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
  getAgniveerdetailsByAgniveer_autoid(param: any = {}) {
    return this.http
      .post(
        this.getEndpointUrl('Agniveer/GetAgniveerdetailsByAgniveer_autoid'),
        param,
        this.options,
      )
      .pipe(catchError(this.handleError));
  }
  GetOrganisationsByAgniveer(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('/api/Vacancies/GetOrganisationsByAgniveer'), param, this.options)
      .pipe(catchError(this.handleError));
  }

  // ============================================================
  // UPDATE ADDITIONAL DETAILS
  // POST /api/Agniveer/AgniveerUpdateAdditionalDetails
  // ============================================================
  agniveerUpdateAdditionalDetails(param: any) {
    let body: any;
    if (typeof param === 'string') {
      body = param;
    } else {
      const encrypted = CryptoHelper.encrypt(JSON.stringify(param));
      body = JSON.stringify(encrypted);
    }
    return this.http
      .post(this.getEndpointUrl('Agniveer/AgniveerUpdateAdditionalDetails'), body, this.options)
      .pipe(catchError(this.handleError));
  }

  updateAdditionalDetails(param: any) {
    return this.agniveerUpdateAdditionalDetails(param);
  }
  GetReservationCategories(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('/api/Category/GetReservationCategories'), param, this.options)
      .pipe(catchError(this.handleError));
  }

  getAllReligions(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('/api/Religion/GetAll'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  getReligions() {
    return this.getAllReligions();
  }

  // ============================================================
  searchAgniveerById(param: any) {
    let body: any;
    if (typeof param === 'string') {
      body = param;
    } else {
      const encrypted = CryptoHelper.encrypt(JSON.stringify(param));
      body = JSON.stringify(encrypted);
    }
    return this.http
      .post(this.getEndpointUrl('ProfileUpdate/SearchAgniveerById'), body, this.options)
      .pipe(catchError(this.handleError));
  }

  updateAgniveerName(param: any) {
    let body: any;
    if (typeof param === 'string') {
      body = param;
    } else {
      const encrypted = CryptoHelper.encrypt(JSON.stringify(param));
      body = JSON.stringify(encrypted);
    }
    return this.http
      .post(this.getEndpointUrl('ProfileUpdate/UpdateAgniveerName'), body, this.options)
      .pipe(catchError(this.handleError));
  }

  updateWebsiteStatus(param: any) {
    let body: any;
    if (typeof param === 'string') {
      body = param;
    } else {
      const encrypted = CryptoHelper.encrypt(JSON.stringify(param));
      body = JSON.stringify(encrypted);
    }
    return this.http
      .post(this.getEndpointUrl('Users/UpdateWebsiteStatus'), body, this.options)
      .pipe(catchError(this.handleError));
  }
  AgniveerPreferenceAdd(param: any = {}) {
    let body: any;
    if (typeof param === 'string') {
      body = param;
    } else {
      const encrypted = CryptoHelper.encrypt(JSON.stringify(param));
      body = JSON.stringify(encrypted);
    }
    return this.http
      .post(this.getEndpointUrl('AgniveerPreference/AddOrUpdate'), body, this.options)
      .pipe(catchError(this.handleError));
  }

  AgniveerPreferenceAddOrUpdate(param: any = {}) {
    return this.AgniveerPreferenceAdd(param);
  }

  // GetAgniveerPreferenceByAgniveerAndRound(param: any = {}) {
  //   return this.http
  //     .post(this.getEndpointUrl('AgniveerPreference/GetByAgniveerAndRound'), param, this.options)
  //     .pipe(catchError(this.handleError));
  // }

  GetAgniveerPreferenceByAgniveerAndRound(param: any = {}): Observable<any> {
    const url = this.getEndpointUrl('AgniveerPreference/GetByAgniveerAndRound');
    return this.http.post<any>(url, param, this.options).pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleError(err);
      }),
    );
  }
}

export { MyProfileService as Myprofile };
export { MyProfileService as MyprofileService };
