import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CryptoHelper } from '../helpers/crypto-helper';

@Injectable({
  providedIn: 'root',
})
export class NationalityService {

  private apiURL =
    environment.apiUrl.endsWith('/')
      ? environment.apiUrl
      : environment.apiUrl + '/';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private options = {
    headers: this.headers,
  };

  constructor(private http: HttpClient) {}

  private handleError(error: any) {
    console.error('Nationality API Error:', error);
    return throwError(() => error);
  }

  // =====================================================
  // GET ALL
  // =====================================================

  getAll(pageNumber: number, recordPerPage: number) {

    const payload = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    let encryptedPayload: any = CryptoHelper.encrypt(
      JSON.stringify(payload)
    );

    encryptedPayload = JSON.stringify(encryptedPayload);

    // console.log('========== NATIONALITY GET ALL ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);
    // console.log(
    //   'API:',
    //   this.apiURL + 'Nationality/GetAll'
    // );

    return this.http
      .post(
        this.apiURL + 'Nationality/GetAll',
        encryptedPayload,
        this.options
      )
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // =====================================================
  // GET BY ID
  // =====================================================

  getById(payload: {
    autonationality_id: number;
  }) {

    let encryptedPayload: any = CryptoHelper.encrypt(
      JSON.stringify(payload)
    );

    encryptedPayload = JSON.stringify(encryptedPayload);

    // console.log('========== NATIONALITY GET BY ID ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);
    // console.log(
    //   'API:',
    //   this.apiURL + 'Nationality/GetById'
    // );

    return this.http
      .post(
        this.apiURL + 'Nationality/GetById',
        encryptedPayload,
        this.options
      )
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // =====================================================
  // ADD
  // =====================================================

  add(payload: {
    nationality: string;
    is_draft: boolean;
  }) {

    let encryptedPayload: any = CryptoHelper.encrypt(
      JSON.stringify(payload)
    );

    encryptedPayload = JSON.stringify(encryptedPayload);

    // console.log('========== NATIONALITY ADD ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);
    // console.log(
    //   'API:',
    //   this.apiURL + 'Nationality/Add'
    // );

    return this.http
      .post(
        this.apiURL + 'Nationality/Add',
        encryptedPayload,
        this.options
      )
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // =====================================================
  // UPDATE
  // =====================================================

  update(payload: {
    autonationality_id: number;
    nationality: string;
    is_draft: boolean;
  }) {

    let encryptedPayload: any = CryptoHelper.encrypt(
      JSON.stringify(payload)
    );

    encryptedPayload = JSON.stringify(encryptedPayload);

    // console.log('========== NATIONALITY UPDATE ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);
    // console.log(
    //   'API:',
    //   this.apiURL + 'Nationality/Update'
    // );

    return this.http
      .post(
        this.apiURL + 'Nationality/Update',
        encryptedPayload,
        this.options
      )
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  // =====================================================
  // DELETE
  // =====================================================

  delete(payload: {
    autonationality_id: number;
  }) {

    let encryptedPayload: any = CryptoHelper.encrypt(
      JSON.stringify(payload)
    );

    encryptedPayload = JSON.stringify(encryptedPayload);

    // console.log('========== NATIONALITY DELETE ==========');
    // console.log('Original Payload:', payload);
    // console.log('Encrypted Payload:', encryptedPayload);
    // console.log(
    //   'API:',
    //   this.apiURL + 'Nationality/Delete'
    // );

    return this.http
      .post(
        this.apiURL + 'Nationality/Delete',
        encryptedPayload,
        this.options
      )
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }
}