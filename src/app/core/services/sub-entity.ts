import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubEntityFromAPI, CreateSubEntityPayload } from '../models/sub-entity.model';
import { API_ENDPOINTS } from './api-config';

@Injectable({
  providedIn: 'root',
})
export class SubEntityService {
  private readonly http = inject(HttpClient);

  getAllSubEntities(): Observable<SubEntityFromAPI[]> {
    return this.http.get<SubEntityFromAPI[]>(API_ENDPOINTS.GET_ALL_SUB_ENTITIES);
  }

  createSubEntity(menuIdOrPayload: string | CreateSubEntityPayload, payload?: CreateSubEntityPayload): Observable<SubEntityFromAPI> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    const roleId = typeof window !== 'undefined' ? sessionStorage.getItem('role') : null;
    return this.http.post<SubEntityFromAPI>(API_ENDPOINTS.CREATE_SUB_ENTITY(menuId), {
      ...body,
      ...(roleId ? { role_id: roleId } : {}),
    });
  }

  updateSubEntity(id: string, menuIdOrPayload: string | CreateSubEntityPayload, payload?: CreateSubEntityPayload): Observable<SubEntityFromAPI> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    const roleId = typeof window !== 'undefined' ? sessionStorage.getItem('role') : null;
    return this.http.put<SubEntityFromAPI>(API_ENDPOINTS.UPDATE_SUB_ENTITY(id, menuId), {
      ...body,
      ...(roleId ? { role_id: roleId } : {}),
    });
  }

  deleteSubEntity(id: string, menuId = '0'): Observable<any> {
    return this.http.delete(API_ENDPOINTS.DELETE_SUB_ENTITY(id, menuId));
  }
}
