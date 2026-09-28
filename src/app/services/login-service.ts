import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CryptoHelper } from '../helpers/crypto-helper';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  apiURL: string = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
  headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  options = { headers: this.headers };

  constructor(private http: HttpClient) {}

  handleError(error: HttpErrorResponse) {
    const errorMsg = error?.error?.message || error?.message || 'An unknown error occurred';
    return throwError(() => error);
  }

  generateCaptchaAPI(param: any = {}) {
    return this.http
      .post(this.apiURL + 'GenerateCaptcha/GenerateCaptcha', param, this.options)
      .pipe(catchError(this.handleError));
  }

  loginAPI(param: any) {
    return this.http
      .post(this.apiURL + 'Users/login', param, this.options)
      .pipe(catchError(this.handleError));
  }

  verifyOTPAPI(param: any) {
    return this.http
      .post(this.apiURL + 'Users/VerifyLoginOTP', param, this.options)
      .pipe(catchError(this.handleError));
  }

  logoutAPI() {
    return this.http
      .post(this.apiURL + 'Users/logout', {}, this.options)
      .pipe(catchError(this.handleError));
  }

  janParichayLogoutAPI(param: any) {
    return this.http
      .post(this.apiURL + 'JanParichay/revoke', param, this.options)
      .pipe(catchError(this.handleError));
  }

  changePassword(payload: any) {
    let encryptedPayload: any = CryptoHelper.encrypt(JSON.stringify(payload));

    encryptedPayload = JSON.stringify(encryptedPayload);

    return this.http.post<any>(
      `${this.apiURL}Users/ChangePassword`,
      encryptedPayload,
      this.options,
    );
  }

  refreshTokenAPI(param: any) {
    return this.http
      .post(this.apiURL + 'Users/refresh', param, this.options)
      .pipe(catchError(this.handleError));
  }

  janParichayLoginAPI(param: any = {}) {
    return this.http
      .post(this.apiURL + 'JanParichay/login', param, this.options)
      .pipe(catchError(this.handleError));
  }

  janParichayCallbackAPI(param: any) {
    return this.http
      .post(this.apiURL + 'JanParichay/callback', param, this.options)
      .pipe(catchError(this.handleError));
  }

  validateSessionAPI(param: any = {}, options?: any) {
    let reqOptions = this.options;
    if (options instanceof HttpHeaders) {
      reqOptions = { headers: options };
    } else if (options && options.headers) {
      reqOptions = options;
    } else if (options) {
      reqOptions = { headers: new HttpHeaders(options) };
    }

    return this.http
      .get(this.apiURL + 'Users/ValidateSession', reqOptions)
      .pipe(catchError(this.handleError));
  }

  getMenuByRoleAPI(param: any) {
    return this.http
      .post(this.apiURL + 'Menu/GetByRole', param, this.options)
      .pipe(catchError(this.handleError));
  }

  getMenuRoleByIdAPI(param: any) {
    return this.getMenuByRoleAPI(param);
  }

  clearSession() {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  }
}
