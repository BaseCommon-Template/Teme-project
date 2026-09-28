import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CryptoHelper } from '../helpers/crypto-helper';

@Injectable({
  providedIn: 'root',
})
export class MenuManagementService {
  private apiURL = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private options = {
    headers: this.headers,
  };

  constructor(private http: HttpClient) {}

  private encryptPayload(payload: any): string {
    let encrypted: any = CryptoHelper.encrypt(JSON.stringify(payload));

    return JSON.stringify(encrypted);
  }

  private handleError(error: any) {
    console.error('Menu API Error:', error);
    return throwError(() => error);
  }

  // =====================================================
  // GET ALL MENU
  // =====================================================

  getAllMenu(pageNumber: number = 1, recordPerPage: number = 1000) {
    const payload = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    const encryptedPayload = this.encryptPayload(payload);

    // console.log('========== MENU GET ALL ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);
    // console.log('API:', this.apiURL + 'Menu/GetAllMenu');

    return this.http
      .post(this.apiURL + 'Menu/GetAllMenu', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // GET MENU BY ROLE
  // =====================================================

  getByRole(roleId: number, pageNumber: number = 1, recordPerPage: number = 1000) {
    const payload = {
      role_id: roleId,
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    const encryptedPayload = this.encryptPayload(payload);

    // console.log('========== MENU GET BY ROLE ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);

    return this.http
      .post(this.apiURL + 'Menu/GetByRole', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // ADD MENU
  // =====================================================

  addMenu(payload: any) {
    const encryptedPayload = this.encryptPayload(payload);

    // console.log('========== MENU ADD ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);

    return this.http
      .post(this.apiURL + 'Menu/AddMenu', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // UPDATE MENU
  // =====================================================

  updateMenu(payload: any) {
    const encryptedPayload = this.encryptPayload(payload);

    // console.log('========== MENU UPDATE ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);

    return this.http
      .post(this.apiURL + 'Menu/UpdateMenu', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // DELETE MENU
  // =====================================================

  deleteMenu(payload: any) {
    const encryptedPayload = this.encryptPayload(payload);

    // console.log('========== MENU DELETE ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);

    return this.http
      .post(this.apiURL + 'Menu/DeleteMenu', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getAllRoles() {
    // console.log('========== GET ALL ROLES ==========');
    // console.log('API:', this.apiURL + 'Users/GetALLRole');

    return this.http
      .post<any>(this.apiURL + 'Users/GetALLRole', this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }
}
