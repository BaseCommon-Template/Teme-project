import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CryptoHelper } from '../helpers/crypto-helper';

export interface UserApiItem {
  userautoid?: number | string | null;
  userAutoId?: number | string | null;
  id?: number | string | null;
  Id?: number | string | null;

  userid?: string | null;
  userId?: string | null;
  username?: string | null;
  user_name?: string | null;

  name?: string | null;
  full_name?: string | null;
  fullName?: string | null;

  designation?: string | null;
  Designation?: string | null;
  post?: string | null;

  rank?: string | null;
  Rank?: string | null;

  role?: string | null;
  roleName?: string | null;

  email?: string | null;
  emailid?: string | null;

  phone?: string | null;
  mobile?: string | null;
  mobileno?: string | null;

  contact?: {
    emailid?: string | null;
    mobileno?: string | null;
    countrycode?: number | string | null;
    helpdeskContactNo?: string | null;
    helpdeskEmailId?: string | null;
    nodalOfficerLandlineNo?: string | null;
  } | null;

  organization_type?: string | null;
  organizationType?: string | null;
  organization?: string | null;
  organization_name?: string | null;

  agency?: {
    agency_id?: string | number | null;
    agency_name?: string | null;
    agency_name_hindi?: string | null;
    agencytype?: string | null;
  } | null;

  is_active?: boolean | number | string | null;
  isActive?: boolean | number | string | null;
  isactive?: boolean | number | string | null;

  created_at?: string | null;
  createdAt?: string | null;
  entry_date?: string | null;
  entryDate?: string | null;

  roles?: Array<{
    roleid?: number | string | null;
    roleId?: number | string | null;
    rolename?: string | null;
    roleName?: string | null;
    name?: string | null;
    priority?: number | string | null;
    isactive?: boolean | number | string | null;
    PAdd?: string | null;
    PDelete?: string | null;
    PEdit?: string | null;
    PView?: string | null;
  }>;
}

export interface UserRoleOption {
  roleid: number;
  rolename: string;
  isactive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private readonly apiURL = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : environment.apiUrl + '/';

  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private readonly options = {
    headers: this.headers,
  };

  constructor(private readonly http: HttpClient) {}

  private encryptPayload(payload: any): string {
    const encrypted: any = CryptoHelper.encrypt(JSON.stringify(payload));
    return JSON.stringify(encrypted);
  }

  /**
   * GET ALL USERS
   *
   * User master API:
   * /api/Users/GetAll
   *
   * The component expects an encrypted response in res.data,
   * but the parser also supports a direct array/object response.
   */
  getAllUsers() {
    const payload = {};

    const encryptedPayload = this.encryptPayload(payload);

    return this.http
      .post<any>(this.apiURL + 'Users/GetAll', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * ADD / UPDATE USER
   */
  addOrUpdateUser(payload: any) {
    const encryptedPayload = this.encryptPayload(payload);

    return this.http
      .post<any>(this.apiURL + 'Users/Add_Update_User', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * REMOVE USER
   */
  removeUser(payload: any) {
    const encryptedPayload = this.encryptPayload(payload);

    return this.http
      .post<any>(this.apiURL + 'Users/Remove', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * ACTIVE ROLE MASTER
   *
   * Same role API already used by Menu Management.
   */
  getAllRoles() {
    const payload = {};

    const encryptedPayload = this.encryptPayload(payload);

    return this.http
      .post<any>(this.apiURL + 'Users/GetALLRole', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  getAllOrganizations(pageNumber: number = 1, recordPerPage: number = 20) {
    const payload = {
      is_draft: false,
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    const encryptedPayload = this.encryptPayload(payload);

    return this.http
      .post<any>(this.apiURL + 'OrganisationMaster/GetAll', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * GET USER ACCESS INFO
   */
  getUserAccessInfo(payload: { userid: string }) {
    const encryptedPayload = this.encryptPayload(payload);

    return this.http
      .post<any>(this.apiURL + 'Users/GetUserAccessInfo', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * UPDATE USER ACCESS INFO
   */
  updateUserAccessInfo(payload: any) {
    const encryptedPayload = this.encryptPayload(payload);

    return this.http
      .post<any>(this.apiURL + 'Users/UpdateUserAccessInfo', encryptedPayload, this.options)
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * Exposed only so component can reuse the same response decrypt logic.
   */
  decryptResponse(value: string): any {
    return CryptoHelper.decrypt(value);
  }

  private handleError(error: any) {
    console.error('UserManagementService API Error:', error);
    return throwError(() => error);
  }
}
