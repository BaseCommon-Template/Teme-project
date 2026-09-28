import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

import { CryptoHelper } from '../helpers/crypto-helper';
import { environment } from '../../environments/environment';
// IMPORTANT:
// If your CryptoHelper is in another folder,
// change ONLY the import path above.
// DO NOT change crypto-helper.ts itself.

@Injectable({
  providedIn: 'root',
})
export class ReligionService {
  private http = inject(HttpClient);

  // =====================================================
  // API BASE URL
  // =====================================================

  private baseUrl = environment.apiUrl;

  // =====================================================
  // HEADERS
  // =====================================================

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',

    accept: '*/*',
  });

  // =====================================================
  // GET ALL RELIGIONS
  // =====================================================

  getAllReligion(
    isDraft: boolean = false,

    pageNumber: number = 1,

    recordPerPage: number = 20,
  ): Observable<any> {
    const payload = {
      is_draft: isDraft,

      page_number: pageNumber,

      record_per_page: recordPerPage,
    };

    // console.log('GET ALL NORMAL PAYLOAD:', payload);

    // Convert object to JSON string

    const jsonPayload = JSON.stringify(payload);

    // Encrypt JSON string

    const encryptedPayload = CryptoHelper.encrypt(jsonPayload);

    // console.log('GET ALL ENCRYPTED PAYLOAD:', encryptedPayload);

    // API expects encrypted string as request body

    return this.http.post<any>(
      `${this.baseUrl}Religion/GetAll`,

      JSON.stringify(encryptedPayload),

      {
        headers: this.headers,
      },
    );
  }

  // =====================================================
  // GET RELIGION BY ID
  // =====================================================

  getReligionById(autoreligion_id: number): Observable<any> {
    const payload = {
      autoreligion_id: autoreligion_id,
    };

    // console.log('GET BY ID NORMAL PAYLOAD:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('GET BY ID ENCRYPTED PAYLOAD:', encryptedPayload);

    return this.http.post<any>(
      `${this.baseUrl}Religion/GetById`,

      JSON.stringify(encryptedPayload),

      {
        headers: this.headers,
      },
    );
  }

  // =====================================================
  // ADD RELIGION
  // =====================================================

  addReligion(
    religion: string,

    isDraft: boolean = false,
  ): Observable<any> {
    const payload = {
      religion: religion,

      is_draft: isDraft,
    };

    // console.log('ADD NORMAL PAYLOAD:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('ADD ENCRYPTED PAYLOAD:', encryptedPayload);

    return this.http.post<any>(
      `${this.baseUrl}Religion/Add`,

      JSON.stringify(encryptedPayload),

      {
        headers: this.headers,
      },
    );
  }

  // =====================================================
  // UPDATE RELIGION
  // =====================================================

  updateReligion(
    autoreligion_id: number,

    religion: string,

    isDraft: boolean = false,

    isActive: boolean,
  ): Observable<any> {
    const payload = {
      autoreligion_id: autoreligion_id,

      religion: religion,

      is_draft: isDraft,

      is_active: isActive,
    };

    // console.log('UPDATE NORMAL PAYLOAD:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('UPDATE ENCRYPTED PAYLOAD:', encryptedPayload);

    return this.http.post<any>(
      `${this.baseUrl}Religion/Update`,

      JSON.stringify(encryptedPayload),

      {
        headers: this.headers,
      },
    );
  }

  // =====================================================
  // DELETE RELIGION
  // =====================================================

  deleteReligion(autoreligion_id: number): Observable<any> {
    const payload = {
      autoreligion_id: autoreligion_id,
    };

    // console.log('DELETE NORMAL PAYLOAD:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('DELETE ENCRYPTED PAYLOAD:', encryptedPayload);

    return this.http.post<any>(
      `${this.baseUrl}Religion/Delete`,

      JSON.stringify(encryptedPayload),

      {
        headers: this.headers,
      },
    );
  }

  // =====================================================
  // DECRYPT RESPONSE
  // =====================================================

  decryptResponse(encryptedData: string): any {
    if (!encryptedData) {
      throw new Error('Encrypted response is empty');
    }

    const decryptedText = CryptoHelper.decrypt(encryptedData);

    // console.log('DECRYPTED RESPONSE TEXT:', decryptedText);

    if (!decryptedText) {
      throw new Error('Unable to decrypt API response');
    }

    try {
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('JSON PARSE ERROR:', error);

      throw new Error('Decrypted response is not valid JSON');
    }
  }
}
