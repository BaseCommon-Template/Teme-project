// import { Injectable, inject } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { map, Observable } from 'rxjs';
// import {
//   NotificationFromAPI,
//   CreateNotificationPayload,
//   UpdateNotificationPayload,
//   GetAllNotificationsResponse,
// } from '../models/notification.model';
// import { API_ENDPOINTS } from './api-config';
// import { environment } from '../../../environments/environment';
// import { CryptoHelper } from '../../helpers/crypto-helper';

// @Injectable({
//   providedIn: 'root',
// })
// export class NotificationService {
//   private readonly http = inject(HttpClient);

//   // getAllNotifications(): Observable<NotificationFromAPI[]> {
//   //   return this.http
//   //     .get<any>(API_ENDPOINTS.GET_ALL_NOTIFICATIONS)
//   //     .pipe(map((res) => res?.notifications || (Array.isArray(res) ? res : [])));
//   // }

//   getActiveNotifications(
//     page: number = 1,
//     limit: number = 10,
//     searchQuery?: string,
//   ): Observable<GetAllNotificationsResponse> {
//     return this.http.get<GetAllNotificationsResponse>(
//       API_ENDPOINTS.GET_ALL_PAGINATED_NOTIFICATIONS,
//       {
//         params: {
//           page: String(page),
//           limit: String(limit),
//           ...(searchQuery ? { search: searchQuery } : {}),
//           is_archived: 'false',
//         },
//       },
//     );
//   }

//   getArchivedNotifications(
//     page: number = 1,
//     limit: number = 10,
//     searchQuery?: string,
//   ): Observable<GetAllNotificationsResponse> {
//     return this.http.get<GetAllNotificationsResponse>(
//       API_ENDPOINTS.GET_ALL_PAGINATED_NOTIFICATIONS,
//       {
//         params: {
//           page: String(page),
//           limit: String(limit),
//           ...(searchQuery ? { search: searchQuery } : {}),
//           is_archived: 'true',
//         },
//       },
//     );
//   }

//   getNotificationById(id: string): Observable<NotificationFromAPI> {
//     return this.http
//       .get<{ notification: NotificationFromAPI }>(API_ENDPOINTS.GET_NOTIFICATION_BY_ID(id))
//       .pipe(map((res) => res.notification));
//   }

//   updateNotification(
//     id: string,
//     payload: UpdateNotificationPayload,
//   ): Observable<NotificationFromAPI> {
//     const roleId = typeof window !== 'undefined' ? sessionStorage.getItem('role') : null;
//     return this.http
//       .post<{ notification: NotificationFromAPI }>(API_ENDPOINTS.UPDATE_NOTIFICATION(id), {
//         ...payload,
//         ...(roleId ? { role_id: roleId } : {}),
//       })
//       .pipe(map((res) => res.notification));
//   }

//   deleteNotification(id: string): Observable<NotificationFromAPI> {
//     const roleId = typeof window !== 'undefined' ? sessionStorage.getItem('role') : null;
//     return this.http
//       .post<{ notification: NotificationFromAPI }>(API_ENDPOINTS.DELETE_NOTIFICATION(id), {
//         ...(roleId ? { role_id: roleId } : {}),
//       })
//       .pipe(map((res) => res.notification));
//   }

//   freezeNotification(id: string, menuId: string): Observable<any> {
//     return this.http.post<any>(API_ENDPOINTS.FREEZE_NOTIFICATION(id, menuId), {});
//   }
// }
