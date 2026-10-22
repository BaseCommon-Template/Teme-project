import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
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

}
