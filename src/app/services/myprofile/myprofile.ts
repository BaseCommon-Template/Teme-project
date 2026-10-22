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
}

export { MyProfileService as Myprofile };
export { MyProfileService as MyprofileService };
