import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { CryptoHelper } from '../helpers/crypto-helper';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl;

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    accept: '*/*',
  });

  // ============================================================
  // GET ALL CATEGORY
  // ============================================================
  getAllCategory(
    stateCd: number = 0,
    isDraft?: boolean,
    pageNumber: number = 1,
    recordPerPage: number = 20,
  ): Observable<any> {
    const payload: any = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
      StateCd: stateCd,
    };

    if (isDraft !== undefined) {
      payload.is_draft = isDraft;
    }
    // console.log(payload,"payload")

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http.post<any>(
      `${this.baseUrl}Category/GetReservationCategories`,
      JSON.stringify(encryptedPayload),
      {
        headers: this.headers,
      },
    );
  }

  getAllCategoryCondition(
    stateCd: number,
    isDraft?: boolean,
    pageNumber: number = 1,
    recordPerPage: number = 20,
  ): Observable<any> {
    const payload: any = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
      StateCd: stateCd,
    };

    if (isDraft !== undefined) {
      payload.is_draft = isDraft;
    }
    // console.log(payload,"payload")

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http.post<any>(
      `${this.baseUrl}Category/GetReservationCategoriesWithoutcondition`,
      JSON.stringify(encryptedPayload),
      {
        headers: this.headers,
      },
    );
  }

  // ============================================================
  // ADD CATEGORY TO STATE
  // ============================================================
  addStateCategory(
    autocategory_id: number,
    category: string = '',
    sub_categories: string[] = [],
    state_cds: number[] = [],
    isActive: boolean = true,
    isDraft: boolean = false,
  ): Observable<any> {
    const payload = {
      autocategory_id,
      category,
      sub_categories,
      state_cds,
      is_active: isActive,
      is_draft: isDraft,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http.post<any>(
      `${this.baseUrl}Category/Addstate_cdsOnBasisOfautocategory_id`,
      JSON.stringify(encryptedPayload),
      {
        headers: this.headers,
      },
    );
  }

  // ============================================================
  // GET CATEGORY BY ID
  // ============================================================
  getCategoryById(autocategory_id: number): Observable<any> {
    const payload = {
      autocategory_id: autocategory_id,
    };

    // console.log('GET CATEGORY BY ID PAYLOAD:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http.post<any>(
      `${this.baseUrl}Category/GetById`,
      JSON.stringify(encryptedPayload),
      {
        headers: this.headers,
      },
    );
  }

  // ============================================================
  // ADD CATEGORY
  // ============================================================
  addCategory(
    category: string,
    sub_categories: string[],
    isDraft: boolean = false,
  ): Observable<any> {
    const payload = {
      category: category,
      sub_categories: sub_categories,
      is_draft: isDraft,
    };

    // console.log('ADD CATEGORY PAYLOAD:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('ADD CATEGORY ENCRYPTED:', encryptedPayload);

    return this.http.post<any>(`${this.baseUrl}Category/Add`, JSON.stringify(encryptedPayload), {
      headers: this.headers,
    });
  }

  // ============================================================
  // UPDATE CATEGORY
  // ============================================================
  updateCategory(
    autocategory_id: number,
    category: string,
    sub_categories: string[],
    isDraft: boolean = false,
    isActive: boolean,
  ): Observable<any> {
    const payload = {
      autocategory_id: autocategory_id,
      category: category,
      sub_categories: sub_categories,
      is_draft: isDraft,
      is_active: isActive,
    };

    // console.log('UPDATE CATEGORY PAYLOAD:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('UPDATE CATEGORY ENCRYPTED:', encryptedPayload);

    return this.http.post<any>(`${this.baseUrl}Category/Update`, JSON.stringify(encryptedPayload), {
      headers: this.headers,
    });
  }

  // ============================================================
  // DELETE CATEGORY
  // ============================================================
  deleteCategory(autocategory_id: number): Observable<any> {
    const payload = {
      autocategory_id: autocategory_id,
    };

    // console.log('DELETE CATEGORY PAYLOAD:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('DELETE CATEGORY ENCRYPTED:', encryptedPayload);

    return this.http.post<any>(`${this.baseUrl}Category/Delete`, JSON.stringify(encryptedPayload), {
      headers: this.headers,
    });
  }

  // ============================================================
  // DECRYPT RESPONSE
  // ============================================================
  decryptResponse(encryptedData: string): any {
    if (!encryptedData) {
      throw new Error('Encrypted response is empty');
    }

    const decryptedText = CryptoHelper.decrypt(encryptedData);

    // console.log('CATEGORY DECRYPTED RESPONSE:', decryptedText);

    if (!decryptedText) {
      throw new Error('Unable to decrypt API response');
    }

    return JSON.parse(decryptedText);
  }
}
