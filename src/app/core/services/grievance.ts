import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Grievance, GrievanceFormData } from '../models/grievance.model';
import { API_ENDPOINTS } from './api-config';

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.grievances)) return data.grievances;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

@Injectable({
  providedIn: 'root',
})
export class GrievanceService {
  private readonly http = inject(HttpClient);

  getAllGrievances(): Observable<Grievance[]> {
    return this.http
      .get<any>(API_ENDPOINTS.GET_ALL_GRIEVANCE)
      .pipe(map((res) => toArray(res)));
  }

  getGrievancesByUser(userId: string): Observable<Grievance[]> {
    return this.http
      .get<any>(API_ENDPOINTS.GET_GRIEVANCES_BY_USER(userId))
      .pipe(map((res) => toArray(res)));
  }

  createGrievance(menuId: string, payload: GrievanceFormData): Observable<Grievance> {
    return this.http.post<Grievance>(API_ENDPOINTS.CREATE_GRIEVANCE(menuId), payload);
  }

  updateGrievance(id: string, menuId: string, payload: Partial<GrievanceFormData>): Observable<Grievance> {
    return this.http.put<Grievance>(API_ENDPOINTS.UPDATE_GRIEVANCE(id, menuId), payload);
  }

  addGrievanceMessage(id: string, menuId: string, message: string): Observable<any> {
    return this.http.post(API_ENDPOINTS.ADD_GRIEVANCE_MESSAGE(id, menuId), { message });
  }

  deleteGrievance(id: string): Observable<any> {
    return this.http.delete(API_ENDPOINTS.DELETE_GRIEVANCE(id));
  }
}
