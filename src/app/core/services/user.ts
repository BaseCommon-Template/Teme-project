import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { UserFromAPI, CreateUserPayload, UpdateUserPayload } from '../models/user.model';
import { API_ENDPOINTS } from './api-config';

function toArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  getAllUsers(
    menuId: string = '0',
    page: number = 1,
    limit: number = 50,
    searchQuery: string = '',
    getAll: boolean = true,
  ): Observable<UserFromAPI[]> {
    return this.http
      .get<any>(API_ENDPOINTS.GET_ALL_USERS(menuId), {
        params: {
          page: String(page),
          limit: String(limit),
          search: searchQuery,
          getAll: getAll ? 'true' : 'false',
        },
      })
      .pipe(map((res) => toArray(res)));
  }

  createUser(
    menuIdOrPayload: string | CreateUserPayload,
    payload?: CreateUserPayload,
  ): Observable<UserFromAPI> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http
      .post<any>(API_ENDPOINTS.CREATE_USER(menuId), body)
      .pipe(map((res) => res?.data ?? res));
  }

  updateUser(
    id: string,
    menuIdOrPayload: string | UpdateUserPayload,
    payload?: UpdateUserPayload,
  ): Observable<UserFromAPI> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http
      .put<any>(API_ENDPOINTS.UPDATE_USER(id, menuId), body)
      .pipe(map((res) => res?.data ?? res));
  }

  deleteUser(id: string, menuId: string = '0'): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.DELETE_USER(id, menuId));
  }
}
