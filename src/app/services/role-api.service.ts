import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { CryptoHelper } from '../helpers/crypto-helper';
import { environment } from '../../environments/environment';

export interface RoleApiPayload {
  Action: 'Add' | 'Update';
  RoleId: number;
  RoleName: string;
  EntryDate: string | null;
  IsActive: boolean;
  Priority: number;
  OtpBased: 'Y' | 'N';
  IpBased: 'Y' | 'N';
}

export interface GetRolesPayload {
  RoleId: number;
}

export interface RoleRecord {
  roleId?: number;
  RoleId?: number;
  role_id?: number;
  roleName?: string;
  RoleName?: string;
  role_name?: string;
  priority?: number;
  Priority?: number;
  isActive?: boolean;
  IsActive?: boolean;
  is_active?: boolean;
  otpBased?: string;
  OtpBased?: string;
  otp_based?: string;
  ipBased?: string;
  IpBased?: string;
  ip_based?: string;
  entryDate?: string | null;
  EntryDate?: string | null;
  entry_date?: string | null;
  status?: boolean | string;
  otp?: boolean | string;
  ip?: boolean | string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class RoleApiService {
  private readonly http = inject(HttpClient);

  private get apiBase(): string {
    const url = environment.apiUrl;
    return url.endsWith('/') ? url : url + '/';
  }

  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    accept: '*/*',
  });

  /**
   * Helper to encrypt payload and post to encrypted endpoint
   */
  private postEncrypted<T>(endpoint: string, rawPayload: any): Observable<T> {
    const jsonPayload = JSON.stringify(rawPayload);
    const encryptedPayload = CryptoHelper.encrypt(jsonPayload);

    // console.log(`[RoleApiService] POST -> ${endpoint} Raw Payload:`, rawPayload);
    // console.log(`[RoleApiService] Encrypted Payload:`, encryptedPayload);

    const fullUrl = `${this.apiBase}Role/${endpoint}`;

    return this.http
      .post<any>(fullUrl, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(
        map((res) => {
          // console.log(`[RoleApiService] Raw response from ${endpoint}:`, res);
          const decrypted = this.decryptResponse(res);
          // console.log(`[RoleApiService] Decrypted response from ${endpoint}:`, decrypted);
          return decrypted as T;
        }),
        catchError((err) => {
          console.error(`[RoleApiService] Error on ${endpoint}:`, err);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Decrypt API response (handles string cipher, wrapped data/result object, or plain JS objects)
   */
  decryptResponse(res: any): any {
    if (res === null || res === undefined) {
      return res;
    }

    let cipherText = '';

    if (typeof res === 'string') {
      cipherText = res;
    } else if (typeof res === 'object') {
      cipherText = res.data ?? res.result ?? res.records ?? res.dataResult ?? '';

      // If res is already unencrypted object (e.g. status, records array, direct payload object)
      if (
        !cipherText &&
        (res.status !== undefined ||
          res.records !== undefined ||
          res.RoleId !== undefined ||
          res.role_id !== undefined ||
          res.roleId !== undefined ||
          Array.isArray(res))
      ) {
        return res;
      }
    }

    if (!cipherText || typeof cipherText !== 'string') {
      return res;
    }

    try {
      const decryptedText = CryptoHelper.decrypt(cipherText);
      if (!decryptedText) return res;
      try {
        return JSON.parse(decryptedText);
      } catch {
        return decryptedText;
      }
    } catch (err) {
      console.warn('[RoleApiService] Failed to decrypt response string, returning raw:', err);
      return res;
    }
  }

  /**
   * Call /api/Role/AddUpdateRole endpoint
   * @param payload Add/Update Role payload
   */
  addUpdateRole(payload: RoleApiPayload): Observable<any> {
    return this.postEncrypted<any>('AddUpdateRole', payload);
  }

  /**
   * Call /api/Role/GetRoles endpoint
   * @param roleId 0 for Get All, specific roleId for Get By ID
   */
  getRoles(roleId: number = 0): Observable<any> {
    const payload: GetRolesPayload = { RoleId: roleId };
    return this.postEncrypted<any>('GetRoles', payload);
  }

  /**
   * Convenience method to fetch single role by ID
   */
  getRoleById(roleId: number): Observable<any> {
    return this.getRoles(roleId);
  }
}
