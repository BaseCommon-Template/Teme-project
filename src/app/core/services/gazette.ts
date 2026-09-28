import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { GazetteItem, CreateGazettePayload } from '../models/gazette.model';
import { API_ENDPOINTS } from './api-config';

@Injectable({
  providedIn: 'root',
})
export class GazetteService {
  private readonly http = inject(HttpClient);

  getAllGazetteNotifications(): Observable<GazetteItem[]> {
    return this.http.get<any>(API_ENDPOINTS.GET_ALL_GAZETTE_NOTIFICATIONS).pipe(
      map((res) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.gazetteNotifications)) return res.gazetteNotifications;
        if (Array.isArray(res?.data)) return res.data;
        return [];
      })
    );
  }

  createGazetteNotification(menuId: string, payload: CreateGazettePayload): Observable<GazetteItem> {
    return this.http.post<GazetteItem>(API_ENDPOINTS.CREATE_GAZETTE_NOTIFICATION(menuId), payload);
  }

  updateGazetteNotification(id: string, menuId: string, payload: CreateGazettePayload): Observable<GazetteItem> {
    return this.http.put<GazetteItem>(API_ENDPOINTS.UPDATE_GAZETTE_NOTIFICATION(id, menuId), payload);
  }

  deleteGazetteNotification(id: string, menuId?: string): Observable<any> {
    return this.http.delete(API_ENDPOINTS.DELETE_GAZETTE_NOTIFICATION(id, menuId));
  }
}
