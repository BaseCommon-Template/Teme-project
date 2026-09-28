import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  Nationality,
  Religion,
  Category,
  PostMaster,
  DomicileStateUT,
  DomicileDistrict,
  PoliceStation,
  DefencePost,
} from '../models/masters.model';
import { API_ENDPOINTS } from './api-config';
import { environment } from '../../../environments/environment';

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.nationalities)) return data.nationalities;
  if (Array.isArray(data?.religions)) return data.religions;
  if (Array.isArray(data?.categories)) return data.categories;
  if (Array.isArray(data?.posts)) return data.posts;
  if (Array.isArray(data?.states)) return data.states;
  if (Array.isArray(data?.districts)) return data.districts;
  if (Array.isArray(data?.policeStations)) return data.policeStations;
  if (Array.isArray(data?.result)) return data.result;
  return [];
}

@Injectable({
  providedIn: 'root',
})
export class MasterService {
  private readonly http = inject(HttpClient);
  apiURL: any = environment.apiUrl;
  headers = new HttpHeaders({ 'content-Type': 'application/json' });
  options = { headers: this.headers };
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

  // ── Nationality ──────────────────────────────────────────
  getAllNationalities(param: any = {}) {
    // return this.http
    //   .get<any>(API_ENDPOINTS.GET_ALL_NATIONALITIES)
    //   .pipe(map((res) => toArray(res)));
    return this.http
      .post(this.getEndpointUrl('/api/Nationality/GetAll'), param, this.options)
      .pipe(catchError(this.handleError));
  }
  getNationalities() {
    return this.getAllNationalities();
  }

  createNationality(menuId: string, payload: Partial<Nationality>): Observable<Nationality> {
    return this.http.post<Nationality>(API_ENDPOINTS.CREATE_NATIONALITY(menuId), payload);
  }

  createReligion(menuId: string, payload: Partial<Religion>): Observable<Religion> {
    return this.http.post<Religion>(API_ENDPOINTS.CREATE_RELIGION(menuId), payload);
  }

  createCategory(menuId: string, payload: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(API_ENDPOINTS.CREATE_CATEGORY(menuId), payload);
  }

  updateCategory(id: string, menuId: string, payload: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(API_ENDPOINTS.UPDATE_CATEGORY(id, menuId), payload);
  }

  deleteCategory(id: string, menuId?: string): Observable<any> {
    return this.http.delete(API_ENDPOINTS.DELETE_CATEGORY(id, menuId));
  }

  createPost(menuId: string, payload: Partial<PostMaster>): Observable<PostMaster> {
    return this.http.post<PostMaster>(API_ENDPOINTS.CREATE_POST(menuId), payload);
  }

  createDomicileState(
    menuId: string,
    payload: Partial<DomicileStateUT>,
  ): Observable<DomicileStateUT> {
    return this.http.post<DomicileStateUT>(API_ENDPOINTS.CREATE_DOMICILE_STATE_UT(menuId), payload);
  }

  createDomicileDistrict(
    menuId: string,
    payload: Partial<DomicileDistrict>,
  ): Observable<DomicileDistrict> {
    return this.http.post<DomicileDistrict>(
      API_ENDPOINTS.CREATE_DOMICILE_DISTRICT(menuId),
      payload,
    );
  }

  createPoliceStation(menuId: string, payload: Partial<PoliceStation>): Observable<PoliceStation> {
    return this.http.post<PoliceStation>(API_ENDPOINTS.CREATE_POLICE_STATION(menuId), payload);
  }

  createDefencePost(menuId: string, payload: Partial<DefencePost>): Observable<DefencePost> {
    return this.http.post<DefencePost>(API_ENDPOINTS.CREATE_DEFENCE_POST(menuId), payload);
  }

  // ── Master Generic Dispatchers ───────────────────────────
  createMaster(type: string, payload: any, menuId = '0'): Observable<any> {
    switch (type) {
      case 'nationality':
        return this.createNationality(menuId, {
          nationality: payload.name,
          short_name: payload.code,
          description: payload.description,
        });
      case 'religion':
        return this.createReligion(menuId, {
          religion: payload.name,
          short_name: payload.code,
          description: payload.description,
        });
      case 'category':
        return this.createCategory(menuId, {
          category_name: payload.name,
          category_code: payload.code,
          description: payload.description,
        });
      case 'post':
        return this.createPost(menuId, {
          post_name: payload.name,
          code: payload.code,
          description: payload.description,
        });
      case 'state':
        return this.createDomicileState(menuId, {
          state_name: payload.name,
          short_name: payload.code,
          description: payload.description,
        });
      case 'district':
        return this.createDomicileDistrict(menuId, {
          district_name: payload.name,
          state_id: payload.parent_id,
          description: payload.description,
        });
      case 'police-station':
        return this.createPoliceStation(menuId, {
          station_name: payload.name,
          district_id: payload.parent_id,
          description: payload.description,
        });
      case 'defence-post':
        return this.createDefencePost(menuId, {
          defence_post_name: payload.name,
          description: payload.description,
        });
      default:
        return this.createNationality(menuId, payload);
    }
  }
}
