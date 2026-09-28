import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { CryptoHelper } from '../helpers/crypto-helper';
import { environment } from '../../environments/environment';

// =====================================================
// TYPES — match the documented API payload shapes
// =====================================================

export interface Post {
  post_id: number;
  post: string;
  is_draft: boolean;
  is_active?: boolean;
}

export interface Organisation {
  organisation_id: number;
  organisation_name: string;
  short_name: string;
  hq_street_address: string;
  hq_pincode: number;
  hq_city: string;
  hq_state: string;
  official_website_url: string;
  is_draft: boolean;
  is_active?: boolean;
  posts?: Post[];
}

export interface OrganisationTypeMaster {
  organisation_type_id: number;
  organisation_type: string;
  short_name: string;
  description: string;
  type: string;
  is_draft: boolean;
  is_active?: boolean;
  is_postmapping?: boolean;
  organisations?: Organisation[];
}

export interface PagedResult<T> {
  records: T[];
  total_records?: number;
  page_number?: number;
  record_per_page?: number;
  total_pages?: number;
  status?: boolean;
  message?: string;
  data?: any;
}

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  private readonly http = inject(HttpClient);

  private readonly apiBase = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : environment.apiUrl + '/';

  private readonly baseUrl = `${this.apiBase}OrganisationMaster`;

  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
    accept: '*/*',
  });

  // =====================================================
  // ENCRYPTION & API POST WRAPPER
  // =====================================================

  private post<TRes>(endpoint: string, payload: unknown): Observable<TRes> {
    const jsonPayload = JSON.stringify(payload);
    const encryptedPayload = CryptoHelper.encrypt(jsonPayload);

    // console.log(`[OrganisationService] POST -> ${endpoint} Payload:`, payload);
    // console.log(`[OrganisationService] Encrypted Body:`, encryptedPayload);

    return this.http
      .post<any>(`${this.baseUrl}/${endpoint}`, JSON.stringify(encryptedPayload), {
        headers: this.headers,
      })
      .pipe(
        map((res) => {
          // console.log(`[OrganisationService] Response raw from ${endpoint}:`, res);

          let rawCipher: string = '';

          if (typeof res === 'string') {
            rawCipher = res;
          } else if (res && typeof res === 'object') {
            rawCipher = res.data ?? res.result ?? res.records ?? '';

            // If res is already unencrypted object (has OrganisationMaster, records, status, etc.)
            if (
              !rawCipher &&
              (res.OrganisationMaster !== undefined ||
                res.records !== undefined ||
                res.status !== undefined ||
                Array.isArray(res))
            ) {
              return res as TRes;
            }
          }

          if (!rawCipher) {
            return res as TRes;
          }

          const decryptedText = CryptoHelper.decrypt(rawCipher);
          // console.log(`[OrganisationService] Decrypted from ${endpoint}:`, decryptedText);

          if (!decryptedText) {
            return res as TRes;
          }

          try {
            const parsed = JSON.parse(decryptedText);
            if (res && typeof res === 'object' && !Array.isArray(res)) {
              if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return { ...res, ...parsed } as TRes;
              }
              return { ...res, decryptedData: parsed } as TRes;
            }
            return parsed as TRes;
          } catch (err) {
            console.error(`[OrganisationService] JSON parse error on decrypted text:`, err);
            if (res && typeof res === 'object' && !Array.isArray(res)) {
              return { ...res, decryptedData: decryptedText } as TRes;
            }
            return decryptedText as unknown as TRes;
          }
        }),
        catchError((err) => {
          console.error(`[OrganisationService] Error calling ${endpoint}:`, err);
          return throwError(() => err);
        }),
      );
  }

  // =====================================================
  // ORGANISATION TYPE (top-level master)
  // =====================================================

  getAll(
    isDraft?: boolean,
    pageNumber = 1,
    recordPerPage = 100,
  ): Observable<PagedResult<OrganisationTypeMaster>> {
    const body: Record<string, unknown> = {
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };
    if (isDraft !== undefined) body['is_draft'] = isDraft;
    return this.post<PagedResult<OrganisationTypeMaster>>('GetAll', body);
  }

  getById(organisationTypeId: number): Observable<OrganisationTypeMaster> {
    return this.post<OrganisationTypeMaster>('GetById', {
      organisation_type_id: organisationTypeId,
    });
  }

  addOrganisationType(payload: {
    organisation_type: string;
    short_name: string;
    description: string;
    type: string;
    is_draft: boolean;
    organisations: Array<Omit<Organisation, 'organisation_id'> & { organisation_id: 0 }>;
  }): Observable<unknown> {
    return this.post('Add', payload);
  }

  updateOrganisationType(payload: {
    organisation_type_id: number;
    organisation_type: string;
    short_name: string;
    description: string;
    type: string;
    is_draft: boolean;
    organisations: Organisation[];
  }): Observable<unknown> {
    return this.post('Update', payload);
  }

  deleteOrganisationType(organisationTypeId: number): Observable<unknown> {
    return this.post('Delete', { organisation_type_id: organisationTypeId });
  }

  // =====================================================
  // ORGANISATION (nested under a type)
  // =====================================================

  addOrganisation(
    organisationTypeId: number,
    organisation: Omit<Organisation, 'organisation_id'> & { organisation_id: 0 },
  ): Observable<unknown> {
    return this.post('AddOrganisation', {
      organisation_type_id: organisationTypeId,
      organisation,
    });
  }

  getOrganisation(organisationTypeId: number, organisationId: number): Observable<Organisation> {
    return this.post<Organisation>('GetOrganisation', {
      organisation_type_id: organisationTypeId,
      organisation_id: organisationId,
    });
  }

  getOrganisations(
    organisationTypeId: number,
    isDraft?: boolean,
    pageNumber = 1,
    recordPerPage = 100,
  ): Observable<PagedResult<Organisation>> {
    const body: Record<string, unknown> = {
      organisation_type_id: organisationTypeId,
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };
    if (isDraft !== undefined) body['is_draft'] = isDraft;
    return this.post<PagedResult<Organisation>>('GetOrganisations', body);
  }

  updateOrganisation(payload: {
    organisation_type_id: number;
    organisation_id: number;
    organisation_name: string;
    short_name: string;
    hq_street_address: string;
    hq_pincode: number;
    hq_city: string;
    hq_state: string;
    official_website_url: string;
    is_active: boolean;
    is_draft: boolean;
    posts: Post[];
  }): Observable<unknown> {
    return this.post('UpdateOrganisation', payload);
  }

  deleteOrganisation(organisationTypeId: number, organisationId: number): Observable<unknown> {
    return this.post('DeleteOrganisation', {
      organisation_type_id: organisationTypeId,
      organisation_id: organisationId,
    });
  }

  // =====================================================
  // POSTS (nested under an organisation)
  // =====================================================

  addPost(
    organisationTypeId: number,
    organisationId: number,
    post: string,
    isDraft: boolean,
  ): Observable<unknown> {
    return this.post('AddPost', {
      organisation_type_id: organisationTypeId,
      organisation_id: organisationId,
      post,
      is_draft: isDraft,
    });
  }

  getPosts(
    organisationTypeId: number,
    organisationId: number,
    isDraft?: boolean,
    pageNumber = 1,
    recordPerPage = 100,
  ): Observable<PagedResult<Post>> {
    const body: Record<string, unknown> = {
      organisation_type_id: organisationTypeId,
      organisation_id: organisationId,
      page_number: pageNumber,
      record_per_page: recordPerPage,
    };
    if (isDraft !== undefined) body['is_draft'] = isDraft;
    return this.post<PagedResult<Post>>('GetPosts', body);
  }

  updatePost(
    organisationTypeId: number,
    organisationId: number,
    postId: number,
    post: string,
    isDraft: boolean,
  ): Observable<unknown> {
    return this.post('UpdatePost', {
      organisation_type_id: organisationTypeId,
      organisation_id: organisationId,
      post_id: postId,
      post,
      is_draft: isDraft,
    });
  }

  deletePost(
    organisationTypeId: number,
    organisationId: number,
    postId: number,
  ): Observable<unknown> {
    return this.post('DeletePost', {
      organisation_type_id: organisationTypeId,
      organisation_id: organisationId,
      post_id: postId,
    });
  }
}
