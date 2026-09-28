import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, catchError, filter, switchMap, take, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { CryptoHelper } from './helpers/crypto-helper';
import { AuthService } from './services/auth';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function is403Status(val: any): boolean {
  return val === 403 || val === '403';
}

function has403Header(headers: any): boolean {
  if (!headers) return false;
  return (
    is403Status(headers.get('status')) ||
    is403Status(headers.get('status-code')) ||
    is403Status(headers.get('statusCode')) ||
    is403Status(headers.get('x-status-code'))
  );
}

function has403Body(body: any): boolean {
  if (!body) return false;
  if (typeof body === 'object') {
    if (
      is403Status(body.status) ||
      is403Status(body.statusCode) ||
      is403Status(body.code) ||
      is403Status(body.responseCode)
    ) {
      return true;
    }

    if (typeof body.data === 'string') {
      try {
        const decrypted = CryptoHelper.decrypt(body.data);
        if (decrypted && decrypted !== body.data) {
          const parsed = JSON.parse(decrypted);
          if (
            is403Status(parsed?.status) ||
            is403Status(parsed?.statusCode) ||
            is403Status(parsed?.code) ||
            is403Status(parsed?.responseCode)
          ) {
            return true;
          }
        }
      } catch (e) {}
    }
  }
  return false;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const cookieService = inject(CookieService);
  const router = inject(Router);
  const authService = inject(AuthService);

  const redirectToUnauthorized = () => {
    if (typeof window !== 'undefined' && !router.url.includes('/unauthrize')) {
      router.navigate(['/unauthrize']);
    }
  };

  let token = '';
  try {
    token =
      authService.getToken() ||
      cookieService.get('token') ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') || '' : '');
  } catch (e) {
    token = '';
  }

  let roleId = '';
  try {
    if (typeof sessionStorage !== 'undefined') {
      roleId =
        sessionStorage.getItem('role-id') ||
        sessionStorage.getItem('role') ||
        sessionStorage.getItem('roleId') ||
        '';

      if (!roleId) {
        const userDataStr = sessionStorage.getItem('userdata') || sessionStorage.getItem('user');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            const rId = userData?.roleId ?? userData?.role_id ?? userData?.role;
            if (rId !== undefined && rId !== null) {
              roleId = String(rId);
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    roleId = '';
  }

  const headersToSet: Record<string, string> = {};

  if (token && token !== 'undefined' && token !== 'null' && token !== '') {
    headersToSet['Authorization'] = `Bearer ${token}`;
  }

  if (roleId && roleId !== 'undefined' && roleId !== 'null' && roleId !== '') {
    headersToSet['role-id'] = String(roleId);
  }

  if (Object.keys(headersToSet).length > 0) {
    req = req.clone({
      setHeaders: headersToSet,
      withCredentials: true,
    });
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        if (is403Status(event.status) || has403Header(event.headers) || has403Body(event.body)) {
          redirectToUnauthorized();
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      const is403 =
        is403Status(error.status) || has403Header(error.headers) || has403Body(error.error);

      if (is403) {
        redirectToUnauthorized();
      }

      if (error.status === 401) {
        const isAuthOrMenuUrl =
          req.url.includes('Users/login') ||
          req.url.includes('Users/refresh') ||
          req.url.includes('Users/logout') ||
          req.url.includes('Menu/GetByRole') ||
          req.url.includes('GetByRole');

        const refreshToken = authService.getRefreshToken();

        if (!isAuthOrMenuUrl && refreshToken) {
          if (!isRefreshing) {
            isRefreshing = true;
            refreshTokenSubject.next(null);

            return authService.refreshAuthToken().pipe(
              switchMap(() => {
                isRefreshing = false;
                const newToken = authService.getToken() || '';
                refreshTokenSubject.next(newToken);
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                  withCredentials: true,
                });
                return next(retryReq);
              }),
              catchError((refreshErr) => {
                isRefreshing = false;
                refreshTokenSubject.next(null);
                authService.performLogout();
                return throwError(() => refreshErr);
              }),
            );
          } else {
            return refreshTokenSubject.pipe(
              filter((t) => t !== null),
              take(1),
              switchMap((t) => {
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${t}`,
                  },
                  withCredentials: true,
                });
                return next(retryReq);
              }),
            );
          }
        }

        if (!isAuthOrMenuUrl) {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          try {
            cookieService.deleteAll('/');
            cookieService.deleteAll();
          } catch (e) {}
        }
      }

      return throwError(() => error);
    }),
  );
};
