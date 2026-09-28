import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from './api-config';
import { Session, SessionUser } from '../models/user.model';

const SESSION_KEY = 'agniveer_session';
const USER_SESSION_KEY = 'user_session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSignal = signal<SessionUser | null>(null);
  readonly currentUser = this.userSignal.asReadonly();
  readonly authVersion = signal<number>(0);

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.syncUserFromStorage();
  }

  syncUserFromStorage(): void {
    if (typeof window === 'undefined') return;
    const user = this.getCurrentUser();
    this.userSignal.set(user);
    this.authVersion.update((v) => v + 1);
  }

  // ── Token Getters / Setters ──────────────────────────────
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    const ssoToken = sessionStorage.getItem('access_token');
    if (ssoToken) return ssoToken;
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('refresh_token');
  }

  setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('refresh_token', refreshToken);
    }
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return;

    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {}

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (e) {}

    if (typeof document !== 'undefined' && document.cookie) {
      const cookies = document.cookie.split(';');
      const hostname = window.location ? window.location.hostname : '';
      const domainParts = hostname ? hostname.split('.') : [];

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = (eqPos > -1 ? cookie.substring(0, eqPos) : cookie).trim();
        if (!name) continue;

        // Path variations
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; max-age=0`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; max-age=0`;

        // Hostname variations
        if (hostname) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}; max-age=0`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; domain=${hostname}; max-age=0`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${hostname}; max-age=0`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; domain=.${hostname}; max-age=0`;
        }

        // Higher-level domains
        for (let d = 0; d < domainParts.length - 1; d++) {
          const domain = '.' + domainParts.slice(d).join('.');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}; max-age=0`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; domain=${domain}; max-age=0`;
        }
      }
    }
  }

  // ── Authentication Checks ────────────────────────────────
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.getAccessToken()) return true;
    if (this.getSession() !== null) return true;
    return false;
  }

  getLoginType(): 'direct' | 'SSO' | 'agniveer' | null {
    if (typeof window === 'undefined') return null;
    const type = sessionStorage.getItem('login_type');
    if (type === 'direct' || type === 'SSO' || type === 'agniveer') return type;
    return null;
  }

  getSession(): Session | null {
    if (typeof window === 'undefined') return null;
    const userSessionStr = sessionStorage.getItem(USER_SESSION_KEY);
    if (userSessionStr) {
      try {
        const parsed = JSON.parse(userSessionStr);
        const session: Session = { user: parsed.user, loginTime: parsed.loginTime };
        if (Date.now() - session.loginTime > SESSION_TIMEOUT) {
          sessionStorage.removeItem(USER_SESSION_KEY);
          return null;
        }
        return session;
      } catch (e) {
        console.error('Error parsing user_session:', e);
      }
    }

    const sessionStr = sessionStorage.getItem(SESSION_KEY);
    if (sessionStr) {
      try {
        const session: Session = JSON.parse(sessionStr);
        if (Date.now() - session.loginTime > SESSION_TIMEOUT) {
          this.logout();
          return null;
        }
        return session;
      } catch (e) {
        console.error('Error parsing agniveer_session:', e);
      }
    }
    return null;
  }

  getCurrentUser(): SessionUser | null {
    if (typeof window === 'undefined') return null;
    const loginType = sessionStorage.getItem('login_type');

    if (loginType === 'direct') {
      const userSessionStr = sessionStorage.getItem(USER_SESSION_KEY);
      if (userSessionStr) {
        try {
          const parsed = JSON.parse(userSessionStr);
          return parsed.user ?? null;
        } catch {}
      }
    }

    if (loginType === 'SSO') {
      const ssoToken = sessionStorage.getItem('access_token');
      const role = sessionStorage.getItem('role');
      const roleName = sessionStorage.getItem('role_name');
      if (ssoToken) {
        return {
          username: roleName || 'SSO User',
          name: roleName || 'SSO User',
          email: '',
          role: role ?? 'mha_user',
        };
      }
    }

    if (loginType === 'agniveer') {
      const agniveerSessionStr = sessionStorage.getItem(SESSION_KEY);
      if (agniveerSessionStr) {
        try {
          const parsed = JSON.parse(agniveerSessionStr);
          return parsed.user ?? null;
        } catch {}
      }
    }

    // Fallback: Check direct cookie / storage
    if (this.getAccessToken()) {
      const userSessionStr = sessionStorage.getItem(USER_SESSION_KEY);
      if (userSessionStr) {
        try {
          return JSON.parse(userSessionStr).user ?? null;
        } catch {}
      }
    }

    const ssoToken = sessionStorage.getItem('access_token');
    if (ssoToken) {
      const role = sessionStorage.getItem('role');
      const roleName = sessionStorage.getItem('role_name');
      return {
        username: roleName || 'SSO User',
        name: roleName || 'SSO User',
        email: '',
        role: role ?? 'mha_user',
      };
    }

    const session = this.getSession();
    if (session) return session.user;

    return null;
  }

  // ── Auth Actions ─────────────────────────────────────────
  directLogin(
    usernameOrPayload: string | { email?: string; mobile?: string; password: string; username?: string },
    passwordParam?: string
  ): Observable<any> {
    let payload: any;
    if (typeof usernameOrPayload === 'string') {
      const isNum = /^[0-9]+$/.test(usernameOrPayload.trim());
      payload = isNum
        ? { mobile: usernameOrPayload.trim(), password: passwordParam }
        : { email: usernameOrPayload.trim(), password: passwordParam };
    } else {
      payload = usernameOrPayload;
    }

    return this.http.post<any>(API_ENDPOINTS.DIRECT_LOGIN, payload).pipe(
      tap((res) => {
        if (res?.access_token) {
          this.setTokens(res.access_token, res.refresh_token);
        }
        if (res?.user) {
          sessionStorage.setItem(
            USER_SESSION_KEY,
            JSON.stringify({ user: res.user, loginTime: Date.now() })
          );
          if (res.user.role_id) {
            const roleId = typeof res.user.role_id === 'object' ? res.user.role_id.role_id : res.user.role_id;
            sessionStorage.removeItem('role');
            sessionStorage.removeItem('role-id');
            sessionStorage.setItem('role', String(roleId));
            sessionStorage.setItem('role-id', String(roleId));
          }
          if (res.user.role_name) {
            sessionStorage.removeItem('role_name');
            sessionStorage.setItem('role_name', res.user.role_name);
          }
        }
        sessionStorage.setItem('login_type', 'direct');
        this.syncUserFromStorage();
      })
    );
  }

  setSsoSession(res: any): void {
    if (res?.access_token) {
      this.setTokens(res.access_token, res.refresh_token);
    }
    sessionStorage.setItem('login_type', 'SSO');
    if (res?.role) {
      const roleIdVal = String(typeof res.role === 'object' ? res.role.role_id : res.role);
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('role-id');
      sessionStorage.setItem('role', roleIdVal);
      sessionStorage.setItem('role-id', roleIdVal);
    }
    if (res?.role_name) {
      sessionStorage.removeItem('role_name');
      sessionStorage.setItem('role_name', res.role_name);
    }
    this.syncUserFromStorage();
  }

  getJanParichayAuthUrl(): Observable<{ authUrl: string; codeVerifier: string }> {
    return this.http.get<{ authUrl: string; codeVerifier: string }>(API_ENDPOINTS.GET_JANPARICHAY_AUTH_URL);
  }

  handleJanParichayCallback(code: string, codeVerifier: string): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.JANPARICHAY_LOGIN, { code, code_verifier: codeVerifier }).pipe(
      tap((res) => {
        this.setSsoSession(res);
      })
    );
  }

  setAgniveerSession(userOrSession: any, profileId?: string, profileData?: any): void {
    const user: SessionUser = userOrSession.user ? userOrSession.user : userOrSession;
    const session: Session = { user, loginTime: Date.now() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (profileId) {
      sessionStorage.setItem('agniveer_profile_id', profileId);
    }
    if (profileData) {
      sessionStorage.setItem('agniveer_profile', JSON.stringify(profileData));
    }
    sessionStorage.setItem('login_type', 'agniveer');
    this.syncUserFromStorage();
  }

  updateUserRole(roleId: number, roleName: string): Observable<any> {
    return this.http.post<any>(API_ENDPOINTS.UPDATE_USER_ROLE, { role_id: roleId }).pipe(
      tap(() => {
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('role-id');
        sessionStorage.removeItem('role_name');
        sessionStorage.setItem('role', String(roleId));
        sessionStorage.setItem('role-id', String(roleId));
        sessionStorage.setItem('role_name', roleName);
        this.syncUserFromStorage();
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this.userSignal.set(null);
    this.authVersion.update((v) => v + 1);
    this.router.navigate(['/auth/userlogin']);
  }
}
