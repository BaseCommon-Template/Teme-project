import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, throwError, Observable, tap, finalize, shareReplay } from 'rxjs';
import { CryptoHelper } from '../../helpers/crypto-helper';
import { MenuService } from '../../core/services/menu';

export const PUBLIC_MENUS_KEY = 'public_menus';

@Injectable({ providedIn: 'root' })
export class LandingPage {
  private readonly http = inject(HttpClient);
  private readonly menuService = inject(MenuService);

  apiURL: any = environment.apiUrl;
  headers = new HttpHeaders({ 'content-Type': 'application/json' });
  options = { headers: this.headers };

  private inFlightRequest$: Observable<any> | null = null;

  handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }

  getAllMenusPublic(param: any) {
    return this.http
      .post(this.apiURL + 'PublicMenu/Public_GetMenus', param, this.options)
      .pipe(catchError(this.handleError));
  }

  /**
   * Loads public menus only once and stores them in sessionStorage.
   * If already stored in session, loads from session without making any API call.
   */
  loadPublicMenusOnce(): void {
    if (typeof window === 'undefined') return;

    // 1. Check session storage cache
    const cached = sessionStorage.getItem(PUBLIC_MENUS_KEY);
    if (cached) {
      try {
        const menus = JSON.parse(cached);
        if (Array.isArray(menus) && menus.length > 0) {
          this.menuService.patchMenus(menus);
          return;
        }
      } catch (e) {
        sessionStorage.removeItem(PUBLIC_MENUS_KEY);
      }
    }

    // 2. Prevent duplicate concurrent in-flight requests
    if (this.inFlightRequest$) {
      this.inFlightRequest$.subscribe();
      return;
    }

    const payload = {};
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const bodyToSend = JSON.stringify(encrypted);

    this.inFlightRequest$ = this.getAllMenusPublic(bodyToSend).pipe(
      tap({
        next: (res: any) => {
          if (res && res.code) {
            try {
              const data = CryptoHelper.decrypt(res.data);
              const parsed = JSON.parse(data);
              const menus = parsed?.menus ?? parsed?.data ?? parsed;
              if (Array.isArray(menus) && menus.length > 0) {
                sessionStorage.setItem(PUBLIC_MENUS_KEY, JSON.stringify(menus));
                this.menuService.patchMenus(menus);
              }
            } catch (e) {
              console.error('[LandingPage] Error parsing public menus:', e);
            }
          }
        },
        error: (err: any) => {
          console.error('[LandingPage] getAllMenusPublic Error:', err);
        },
      }),
      finalize(() => {
        this.inFlightRequest$ = null;
      }),
      shareReplay(1),
    );

    this.inFlightRequest$.subscribe();
  }

  /**
   * Clear public menus from sessionStorage (e.g. after login)
   */
  clearPublicMenus(): void {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(PUBLIC_MENUS_KEY);
      } catch (e) {}
    }
  }
}
