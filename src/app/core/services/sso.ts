import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_ENDPOINTS } from './api-config';

@Injectable({
  providedIn: 'root',
})
export class SsoService {
  private readonly http = inject(HttpClient);

  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  getJanParichayAuthUrl(): Observable<any> {
    return this.http.get<any>(API_ENDPOINTS.GET_JANPARICHAY_AUTH_URL);
  }

  redirectToJanParichay(): Observable<string> {
    return this.getJanParichayAuthUrl().pipe(
      map((res) => {
        if (res?.authUrl) {
          if (res.codeVerifier) {
            sessionStorage.setItem('pkce_code_verifier', res.codeVerifier);
          }
          return res.authUrl;
        }
        return res?.url;
      }),
    );
  }

  exchangeCodeForToken(authorizationCode: string, codeVerifier: string): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.JANPARICHAY_LOGIN, {
      code: authorizationCode,
      code_verifier: codeVerifier,
    });
  }
}
