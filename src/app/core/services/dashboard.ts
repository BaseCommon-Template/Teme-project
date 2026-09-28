import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from './api-config';

export interface DashboardStats {
  entityCount: number;
  subEntityCount: number;
  agniveerCount: number;
  rehabCount: number;
  toBeRehabCount: number;
  userCount: number;
  openingCount: number;
  currentOpeningCount: number;
  archivedOpeningCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(API_ENDPOINTS.GET_DASHBOARD_STATS);
  }
}
