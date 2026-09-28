import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CryptoHelper } from '../helpers/crypto-helper';

export interface DefencePostMappingPayload {
  postname: string;
  branch: string;
  defence_autoid?: number;
}

export interface PostMasterPayload {
  postmaster_autoid?: number;
  post_autoid?: number;
  post_autoId?: number;
  post_id?: number;
  post_name: string;
  post_code?: string;
  defence_post_mappings: DefencePostMappingPayload[];
  organisation_type_id?: number;
  organisation_type?: string;
  short_name?: string;
  organisation_id?: number;
  organisation_name?: string;
  organisation_short_name?: string;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PostMasterService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : environment.apiUrl + '/';

  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    accept: '*/*',
  });

  private handleError(error: any) {
    console.error('PostMaster API Error:', error);
    return throwError(() => error);
  }

  // =====================================================
  // GET POSTMASTERS LIST
  // POST /api/PostMaster/postmastersList
  // Payload: { page_number, record_per_page }
  // =====================================================
  getPostMastersList(pageNumber: number = 1, recordPerPage: number = 20): Observable<any> {
    const payload = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    // console.log('========== POSTMASTER GET LIST ==========');
    // console.log('Original Payload:', payload);
    // console.log('API URL:', `${this.baseUrl}PostMaster/postmastersList`);

    return this.http
      .post<any>(`${this.baseUrl}PostMaster/postmastersList`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // GET POST MASTER BASED ON ORGANISATION ID
  // POST /api/PostMaster/GetPostMasterBasedOnOrganisationId
  // Payload: { organisation_id }
  // =====================================================
  getPostMasterBasedOnOrganisationId(organisationId: number): Observable<any> {
    const payload = {
      organisation_id: organisationId,
    };

    // console.log('========== GET POSTMASTER BASED ON ORGANISATION ID ==========');
    // console.log('Original Payload:', payload);
    // console.log('API URL:', `${this.baseUrl}PostMaster/GetPostMasterBasedOnOrganisationId`);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(
        `${this.baseUrl}PostMaster/GetPostMasterBasedOnOrganisationId`,
        JSON.stringify(encryptedPayload),
        { headers: this.headers },
      )
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // ADD POST MASTER
  // POST /api/PostMaster/AddPostMaster
  // =====================================================
  addPostMaster(payload: PostMasterPayload): Observable<any> {
    // console.log('========== POSTMASTER ADD ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}PostMaster/AddPostMaster`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // UPDATE POST MASTER
  // POST /api/PostMaster/UpdatePostMaster
  // =====================================================
  updatePostMaster(payload: PostMasterPayload): Observable<any> {
    // console.log('========== POSTMASTER UPDATE ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}PostMaster/UpdatePostMaster`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // DELETE POST MASTER
  // POST /api/PostMaster/DeletePostMaster
  // Payload: { postmaster_autoid }
  // =====================================================
  deletePostMaster(postmaster_autoid: number): Observable<any> {
    const payload = {
      postmaster_autoid: postmaster_autoid,
    };

    // console.log('========== POSTMASTER DELETE ==========');
    // console.log('Original Payload:', JSON.stringify(payload, null, 2));

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}PostMaster/DeletePostMaster`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // GET ALL ORGANISATIONS
  // POST /api/OrganisationMaster/GetAll
  // Payload: { page_number, record_per_page }
  // =====================================================
  getAllOrganisations(
    pageNumber: number = 1,
    recordPerPage: number = 50,
    organisation_type_id?: any,
  ): Observable<any> {
    const payload = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
      organisation_type_id,
    };

    // console.log('========== ORGANISATION MASTER GET ALL ==========');
    // console.log('Original Payload:', payload);
    // console.log('API URL:', `${this.baseUrl}OrganisationMaster/GetAll`);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}OrganisationMaster/GetAll`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // POST MASTER CRUD APIs (/api/Post/*)
  // =====================================================

  /**
   * GET ALL POSTS
   * POST /api/Post/GetAll
   * Payload: { page_number, record_per_page }
   */
  getAllPosts(
    pageNumber: number = 1,
    recordPerPage: number = 20,
    isActive?: boolean,
  ): Observable<any> {
    const payload: any = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };

    if (isActive !== undefined) {
      payload.is_active = isActive;
    }

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}Post/GetAll`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * ADD POST
   * POST /api/Post/Add
   * Payload: { post_name, post_code }
   */
  addPost(payload: { post_name: string; post_code: string }): Observable<any> {
    // console.log('========== POST ADD ==========');
    // console.log('Original Payload:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}Post/Add`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * UPDATE POST
   * POST /api/Post/Update
   * Payload: { post_autoid, post_name, post_code }
   */
  updatePost(payload: {
    post_autoid: number;
    post_name: string;
    post_code: string;
    is_active?: boolean;
  }): Observable<any> {
    // console.log('========== POST UPDATE ==========');
    // console.log('Original Payload:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}Post/Update`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  /**
   * DELETE POST
   * POST /api/Post/Delete
   * Payload: { post_autoid }
   */
  deletePost(post_autoid: number): Observable<any> {
    const payload = {
      post_autoid: post_autoid,
    };

    // console.log('========== POST DELETE ==========');
    // console.log('Original Payload:', payload);

    const encryptedPayload = CryptoHelper.encrypt(JSON.stringify(payload));

    return this.http
      .post<any>(`${this.baseUrl}Post/Delete`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  // =====================================================
  // DECRYPT RESPONSE HELPER
  // =====================================================
  decryptResponse(encryptedData: string): any {
    if (!encryptedData) {
      throw new Error('Encrypted response is empty');
    }

    const decryptedText = CryptoHelper.decrypt(encryptedData);

    if (!decryptedText) {
      throw new Error('Unable to decrypt API response');
    }

    return typeof decryptedText === 'string' ? JSON.parse(decryptedText) : decryptedText;
  }
}
