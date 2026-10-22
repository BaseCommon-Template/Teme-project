import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  headers = new HttpHeaders({ 'content-Type': 'application/json' });
  options = { headers: this.headers };
  apiURL: string = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';

  constructor(private http: HttpClient) {}
  handleError(error: HttpErrorResponse) {
    const errorMsg = error?.error?.message || error?.message || 'An unknown error occurred';
    return throwError(() => errorMsg);
  }

  // Example: Get Dashboard Data
  getDashboardData(param: any = {}) {
    return this.http
      .post(`${this.apiURL}Dashboard/DashboardCount`, param, this.options)
      .pipe(catchError(this.handleError));
  }

  // Hit Count Listing
  getWebsiteHitListing(param: any = {}) {
    return this.http
      .post(`${this.apiURL}PublicMenu/Public_GetWebsiteHitListing`, param, this.options)
      .pipe(catchError(this.handleError));
  }

  // Department Session Listing
  getDepartmentSessionListing(param: any = {}) {
    return this.http
      .post(`${this.apiURL}PublicMenu/GetDepartmentSessionListing`, param, this.options)
      .pipe(catchError(this.handleError));
  }

  getWebsiteHitCount(param: any = {}) {
    return this.http
      .post(`${this.apiURL}PublicMenu/Public_GetWebsiteHitCount`, param, this.options)
      .pipe(catchError(this.handleError));
  }

}
