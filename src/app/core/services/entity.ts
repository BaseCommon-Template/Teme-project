import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Entity, CreateEntityPayload } from '../models/entity.model';
import { API_ENDPOINTS } from './api-config';

@Injectable({
  providedIn: 'root',
})
export class EntityService {
  private readonly http = inject(HttpClient);

  getAllEntities(): Observable<Entity[]> {
    return this.http.get<Entity[]>(API_ENDPOINTS.GET_ALL_ENTITIES);
  }

  createEntity(menuIdOrPayload: string | CreateEntityPayload, payload?: CreateEntityPayload): Observable<Entity> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http.post<Entity>(API_ENDPOINTS.CREATE_ENTITY(menuId), body);
  }

  updateEntity(id: string, menuIdOrPayload: string | CreateEntityPayload, payload?: CreateEntityPayload): Observable<Entity> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http.put<Entity>(API_ENDPOINTS.UPDATE_ENTITY(id, menuId), body);
  }

  deleteEntity(id: string, menuId = '0'): Observable<any> {
    return this.http.delete(API_ENDPOINTS.DELETE_ENTITY(id, menuId));
  }
}
