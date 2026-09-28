import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Role, RolesResponse, CreateRolePayload } from '../models/role.model';
import { API_ENDPOINTS } from './api-config';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly http = inject(HttpClient);

  getAllRoles(): Observable<Role[]> {
    return this.http
      .get<RolesResponse>(API_ENDPOINTS.GET_ALL_ROLES_NEW)
      .pipe(map((res) => res?.roles || (Array.isArray(res) ? res : [])));
  }

  getRoleById(id: string): Observable<Role> {
    return this.http.get<Role>(API_ENDPOINTS.GET_ROLE_BY_ID(id));
  }

  createRole(menuIdOrPayload: string | CreateRolePayload, payload?: CreateRolePayload): Observable<Role> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http.post<Role>(API_ENDPOINTS.CREATE_ROLE(menuId), body);
  }

  updateRole(id: string | number, menuIdOrPayload: string | CreateRolePayload, payload?: CreateRolePayload): Observable<Role> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http.put<Role>(API_ENDPOINTS.UPDATE_ROLE(String(id), menuId), body);
  }

  deleteRole(id: string | number, menuId = '0'): Observable<Role> {
    return this.http.delete<Role>(API_ENDPOINTS.DELETE_ROLE(String(id), menuId));
  }
}
