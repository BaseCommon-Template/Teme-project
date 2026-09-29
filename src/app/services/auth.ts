import { Injectable, NgZone, Injector, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { IdleService } from './idle-service';
import { CryptoHelper } from '../helpers/crypto-helper';
import { LoginService } from './login-service';
import { CommonService } from './common-service';
import { MenuService } from '../core/services/menu';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private roleId: number | null = null;
  private roles: any[] = [];
  private refreshTimer: any;
  private jpAccessToken: string | null = null;

  // =====================================================
  // AUTH STATE VERSION
  // Used by Navbar / other components to react to
  // login, logout and token changes
  // =====================================================

  readonly authVersion = signal<number>(0);

  constructor(
    private router: Router,
    private cookieService: CookieService,
    private zone: NgZone,
    private commonService: CommonService,
    private http: HttpClient,
    private injector: Injector,
  ) {
    if (this.getToken()) {
      this.startTokenRefreshTimer();
    }
  }

  // =====================================================
  // COOKIE
  // =====================================================

  private setCookie(name: string, value: string, days = 1): void {
    if (typeof window === 'undefined') return;

    try {
      this.cookieService.delete(name, '/');
      this.cookieService.delete(name);
    } catch (e) {}

    const isHttps = typeof location !== 'undefined' && location.protocol === 'https:';

    this.cookieService.set(name, value, days, '/', undefined, isHttps, isHttps ? 'None' : 'Lax');
  }

  // =====================================================
  // ROLES
  // =====================================================

  setRoles(roles: any[], notify = true): void {
    // 1. Remove older role data from sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('roles');
        sessionStorage.removeItem('userRoles');
        sessionStorage.removeItem('rols');
      } catch (e) {}
    }

    // 2. Remove older role data from cookies
    if (typeof window !== 'undefined') {
      try {
        this.cookieService.delete('roles', '/');
        this.cookieService.delete('roles');
      } catch (e) {}
    }

    const mixedRoles: any[] = [];

    if (Array.isArray(roles)) {
      roles.forEach((r) => {
        const roleId = r.roleId ?? r.roleid ?? r.role_id;
        const roleName = r.roleName ?? r.rolename ?? r.role_name;

        if (roleId !== undefined && roleId !== null) {
          mixedRoles.push(Number(roleId));
        }

        if (roleName) {
          mixedRoles.push(roleName);
        }
      });
    }

    this.roles = mixedRoles;

    try {
      const encryptedRoles = CryptoHelper.encrypt(JSON.stringify(this.roles));
      this.setCookie('roles', encryptedRoles);
    } catch (e) {
      this.setCookie('roles', JSON.stringify(this.roles));
    }

    if (typeof sessionStorage !== 'undefined') {
      try {
        const encrypted = CryptoHelper.encrypt(JSON.stringify(this.roles));
        sessionStorage.setItem('roles', encrypted);
      } catch (e) {
        sessionStorage.setItem('roles', JSON.stringify(this.roles));
      }
    }

    if (notify) {
      this.authVersion.update((v) => v + 1);
    }
  }

  getRoles(): any[] {
    if (this.roles.length) {
      return this.roles;
    }

    if (typeof window === 'undefined') {
      return [];
    }

    // 1. Check sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('roles');
      if (stored) {
        try {
          const dec = CryptoHelper.decrypt(stored);
          const parsed = dec ? JSON.parse(dec) : JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length) {
            this.roles = parsed;
            return this.roles;
          }
        } catch {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length) {
              this.roles = parsed;
              return this.roles;
            }
          } catch {}
        }
      }
    }

    // 2. Check Cookie
    const storedCookie = this.cookieService.get('roles');
    if (storedCookie) {
      try {
        const dec = CryptoHelper.decrypt(storedCookie);
        const roles = dec ? JSON.parse(dec) : JSON.parse(storedCookie);
        if (Array.isArray(roles) && roles.length) {
          this.roles = roles;
          return this.roles;
        }
      } catch (e) {
        try {
          const roles = JSON.parse(storedCookie);
          if (Array.isArray(roles) && roles.length) {
            this.roles = roles;
            return this.roles;
          }
        } catch (err) {}
      }
    }

    // 3. Fallback from currentUser (safely without writing to signals in computed)
    const user = this.getCurrentUser();
    if (user && Array.isArray(user.roles) && user.roles.length > 0) {
      const mixedRoles: any[] = [];
      user.roles.forEach((r: any) => {
        const roleId = r.roleId ?? r.roleid ?? r.role_id;
        const roleName = r.roleName ?? r.rolename ?? r.role_name;
        if (roleId !== undefined && roleId !== null) {
          mixedRoles.push(Number(roleId));
        }
        if (roleName) {
          mixedRoles.push(roleName);
        }
      });
      if (mixedRoles.length) {
        this.roles = mixedRoles;
        return this.roles;
      }
    }

    // 4. Fallback from user.roleId / user.role_id
    if (user) {
      const singleRoleId = user.roleId ?? user.role_id ?? user.roleid ?? user.RoleId;
      const singleRoleName = user.roleName ?? user.rolename ?? user.role_name ?? user.RoleName;

      if (singleRoleId !== undefined && singleRoleId !== null && !isNaN(Number(singleRoleId))) {
        this.roles = [Number(singleRoleId), singleRoleName].filter(Boolean);
        return this.roles;
      }
    }

    return [];
  }

  // =====================================================
  // CURRENT USER
  // =====================================================

  normalizeUserData(user: any): any {
    if (!user || typeof user !== 'object') return user;

    const displayName =
      user.name ||
      user.fullName ||
      user.full_name ||
      user.userName ||
      user.username ||
      user.empName ||
      (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '') ||
      user.userId ||
      user.userid ||
      '';

    const designation =
      user.designation ||
      user.userDesignation ||
      user.rank ||
      (Array.isArray(user.roles) && (user.roles[0]?.roleName || user.roles[0]?.role_name)) ||
      user.roleName ||
      user.rolename ||
      '';

    const email = user.email || user.emailID || user.loginId || '';
    const phone = user.phone || user.mobileNo || user.mobile || '';

    return {
      ...user,
      name: displayName,
      userName: user.userName || user.username || displayName,
      username: user.username || user.userName || displayName,
      designation: designation,
      email: email,
      phone: phone,
    };
  }

  getCurrentUser(): any {
    if (
      this.commonService.userdata &&
      typeof this.commonService.userdata === 'object' &&
      Object.keys(this.commonService.userdata).length > 0
    ) {
      return this.normalizeUserData(this.commonService.userdata);
    }

    if (typeof window === 'undefined') {
      return null;
    }

    let stored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userdata') : null;

    if (stored) {
      try {
        let user: any = null;
        try {
          const decrypted = CryptoHelper.decrypt(stored);
          user = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          if (typeof user === 'string') user = JSON.parse(user);
        } catch {
          user = JSON.parse(stored);
          if (typeof user === 'string') user = JSON.parse(user);
        }

        if (user && typeof user === 'object') {
          const normalized = this.normalizeUserData(user);
          this.commonService.userdata = normalized;
          return normalized;
        }
      } catch (err) {
        console.error('Failed to parse stored userdata:', err);
      }
    }

    const plainUser = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('user') : null;
    if (plainUser) {
      try {
        let user: any = JSON.parse(plainUser);
        if (typeof user === 'string') user = JSON.parse(user);
        if (user && typeof user === 'object') {
          const normalized = this.normalizeUserData(user);
          this.commonService.userdata = normalized;
          return normalized;
        }
      } catch {}
    }

    return null;
  }

  setCurrentUser(user: any): void {
    if (!user) {
      this.commonService.userdata = null;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('userdata');
        sessionStorage.removeItem('user');
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('userdata');
        localStorage.removeItem('user');
        localStorage.removeItem('user_session');
      }
      this.authVersion.update((v) => v + 1);
      return;
    }

    const normalizedUser = this.normalizeUserData(user);
    this.commonService.userdata = normalizedUser;

    if (typeof sessionStorage !== 'undefined') {
      try {
        const encrypted = CryptoHelper.encrypt(JSON.stringify(normalizedUser));
        sessionStorage.setItem('userdata', encrypted);
      } catch (e) {
        sessionStorage.setItem('userdata', JSON.stringify(normalizedUser));
      }
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
    }

    this.authVersion.update((v) => v + 1);
  }

  // =====================================================
  // SET TOKEN
  // =====================================================

  setToken(token: string): void {
    this.token = token;

    // Clear public menus from session storage upon login
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('public_menus');
      } catch (e) {}
    }

    // Update CommonService login state
    this.commonService.isLogin = true;
    this.commonService.token = token;

    this.setCookie('token', token);

    // Notify reactive components
    this.authVersion.update((v) => v + 1);

    const idleService = this.injector.get(IdleService);

    idleService.startWatching();

    this.startTokenRefreshTimer();
  }

  // =====================================================
  // SET REFRESH TOKEN
  // =====================================================

  setRefreshToken(token: string): void {
    if (!token) return;
    this.refreshToken = token;

    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('refreshToken', token);
        sessionStorage.setItem('refresh_token', token);
      } catch (e) {}
    }

    this.setCookie('refreshToken', token);
  }
  setJpAccessToken(token: string): void {
    if (!token) return;
    this.jpAccessToken = token;

    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('jpAccessToken', token);
      } catch (e) {}
    }

    this.setCookie('jpAccessToken', token);
  }

  // =====================================================
  // SET ROLE ID
  // =====================================================

  // =====================================================
  // SET ROLE ID
  // =====================================================

  setRoleId(roleId: number, roleName?: string): void {
    if (roleId === undefined || roleId === null) {
      // console.warn('Role ID is missing');
      return;
    }

    const numericRoleId = Number(roleId);

    if (isNaN(numericRoleId)) {
      // console.warn('Invalid Role ID:', roleId);
      return;
    }

    // 1. Remove older role data from sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('role-id');
        sessionStorage.removeItem('roleId');
        if (roleName) {
          sessionStorage.removeItem('role_name');
        }
      } catch (e) {}
    }

    // 2. Remove older role data from cookies
    if (typeof window !== 'undefined') {
      try {
        this.cookieService.delete('roleId', '/');
        this.cookieService.delete('roleId');
        this.cookieService.delete('role-id', '/');
        this.cookieService.delete('role-id');
        this.cookieService.delete('role', '/');
        this.cookieService.delete('role');
      } catch (e) {}
    }

    this.roleId = numericRoleId;

    // Session Storage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('role', numericRoleId.toString());
      sessionStorage.setItem('role-id', numericRoleId.toString());
      sessionStorage.setItem('roleId', numericRoleId.toString());
      if (roleName) {
        sessionStorage.setItem('role_name', roleName);
      }
    }

    // Cookie
    try {
      const encryptedRoleId = CryptoHelper.encrypt(numericRoleId.toString());
      this.setCookie('roleId', encryptedRoleId);
    } catch (e) {
      this.setCookie('roleId', numericRoleId.toString());
    }

    // Notify Navbar / MenuService
    this.authVersion.update((v) => v + 1);

    // console.log('========== ROLE SET ==========');
    // console.log('Role ID:', numericRoleId);
    // console.log('Session Role:', sessionStorage.getItem('role'));
    // console.log('==============================');
  }

  // =====================================================
  // GET TOKEN
  // =====================================================

  getToken(): string | null {
    if (this.token) {
      return this.token;
    }

    if (typeof window !== 'undefined') {
      const stored = this.cookieService.get('token');

      return stored || null;
    }

    return null;
  }

  // =====================================================
  // GET ROLE ID
  // =====================================================

  getRoleId(): number {
    // 1. Memory
    if (this.roleId !== null) {
      return this.roleId;
    }

    // 2. SSR safety
    if (typeof window === 'undefined') {
      return 0;
    }

    // 3. Session Storage
    const sessionRole =
      sessionStorage.getItem('role-id') ||
      sessionStorage.getItem('role') ||
      sessionStorage.getItem('roleId');

    if (sessionRole) {
      const roleId = Number(sessionRole);

      if (!isNaN(roleId)) {
        this.roleId = roleId;
        return roleId;
      }
    }

    // 4. Cookie
    const stored = this.cookieService.get('roleId');

    if (!stored) {
      return 0;
    }

    try {
      const decrypted = CryptoHelper.decrypt(stored);
      const roleId = Number(decrypted);

      if (!isNaN(roleId)) {
        this.roleId = roleId;
        return roleId;
      }
    } catch (e) {
      // Cookie may be plain text
    }

    // 5. Plain cookie fallback
    const roleId = Number(stored);

    if (!isNaN(roleId)) {
      this.roleId = roleId;
      return roleId;
    }

    return 0;
  }

  // =====================================================
  // GET REFRESH TOKEN
  // =====================================================

  getRefreshToken(): string | null {
    if (this.refreshToken) {
      return this.refreshToken;
    }

    if (typeof window !== 'undefined') {
      try {
        const storedSession =
          sessionStorage.getItem('refreshToken') || sessionStorage.getItem('refresh_token');
        if (storedSession) {
          this.refreshToken = storedSession;
          return storedSession;
        }
      } catch (e) {}

      const stored =
        this.cookieService.get('refreshToken') || this.cookieService.get('refresh_token');

      if (stored) {
        this.refreshToken = stored;
        return stored;
      }
    }

    return null;
  }

  // =====================================================
  // GET JAN PARICHAY ACCESS TOKEN
  // =====================================================

  getJpAccessToken(): string | null {
    if (this.jpAccessToken) {
      return this.jpAccessToken;
    }

    if (typeof window !== 'undefined') {
      try {
        const storedSession = sessionStorage.getItem('jpAccessToken');
        if (storedSession) {
          this.jpAccessToken = storedSession;
          return storedSession;
        }
      } catch (e) {}

      try {
        const storedLocal = localStorage.getItem('jpAccessToken');
        if (storedLocal) {
          this.jpAccessToken = storedLocal;
          return storedLocal;
        }
      } catch (e) {}

      const stored = this.cookieService.get('jpAccessToken');
      if (stored) {
        this.jpAccessToken = stored;
        return stored;
      }
    }

    return null;
  }

  // =====================================================
  // GET ROLE ID
  // =====================================================

  // =====================================================
  // =====================================================
  // STORAGE & COOKIES CLEANUP
  // =====================================================

  private clearAllCookies(): void {
    if (typeof window === 'undefined') return;

    // 1. Delete all using CookieService with and without path
    try {
      this.cookieService.deleteAll('/');
      this.cookieService.deleteAll();
    } catch (e) {}

    // Explicitly delete known cookie names across paths
    const knownCookies = [
      'token',
      'refreshToken',
      'jpAccessToken',
      'roleId',
      'role-id',
      'roles',
      'userId',
      'user_id',
      'access_token',
      'refresh_token',
      'login_type',
      'role',
      'role_name',
      'userdata',
      'user',
      'ASP.NET_SessionId',
      '.AspNetCore.Session',
      '.AspNetCore.Cookies',
      '.AspNetCore.Identity.Application',
    ];

    knownCookies.forEach((name) => {
      try {
        this.cookieService.delete(name, '/');
        this.cookieService.delete(name);
      } catch (e) {}
    });

    // 2. Iterate through all document.cookie entries and expire them
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

  private clearAllStorage(): void {
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
  }

  // =====================================================
  // CLEAR SESSION
  // =====================================================

  clear(): void {
    this.token = null;
    this.refreshToken = null;
    this.jpAccessToken = null;
    this.roleId = null;
    this.roles = [];

    this.clearAllCookies();
    this.clearAllStorage();

    this.stopTokenRefreshTimer();

    const idleService = this.injector.get(IdleService);
    idleService.stopWatching();

    this.zone.run(() => {
      this.commonService.isLogin = false;
      this.commonService.menuList = [];
      this.commonService.userdata = null;
      this.commonService.langData = [];
      this.commonService.token = '';

      try {
        const menuService = this.injector.get(MenuService);
        menuService.refresh(true);
      } catch {}

      // Notify Navbar
      this.authVersion.update((v) => v + 1);
    });
  }

  // =====================================================
  // LOGOUT API
  // =====================================================

  performLogout(): void {
    const user = this.commonService.userdata || {};
    const userId = user && user.userautoId ? user.userautoId : 'unknown';
    const token = this.getToken();

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const apiUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';

    this.http.post(apiUrl + 'Users/logout', {}, { headers }).subscribe({
      next: () => {
        this.clearLocalData(userId);
      },

      error: () => {
        // Even if API fails, logout locally and clear everything
        this.clearLocalData(userId);
      },
    });
  }

  // =====================================================
  // CLEAR LOCAL DATA
  // =====================================================

  // Add this inside your AuthService
forceLocalLogout(): void {
  const user = this.commonService.userdata || {};
  const userId = user && user.userautoId ? user.userautoId : 'unknown';
  
  // Call your existing robust cleanup method!
  this.clearLocalData(userId);
}


  private clearLocalData(userId: string): void {
    const idleService = this.injector.get(IdleService);
    idleService.stopWatching();

    this.stopTokenRefreshTimer();

    // Clear all storage and cookies completely
    this.clearAllCookies();
    this.clearAllStorage();

    this.zone.run(() => {
      this.commonService.isLogin = false;
      this.commonService.menuList = [];
      this.commonService.userdata = null;
      this.commonService.langData = [];
      this.commonService.token = '';

      this.token = null;
      this.refreshToken = null;
      this.jpAccessToken = null;
      this.roleId = null;
      this.roles = [];

      const menuService = this.injector.get(MenuService);

      menuService.refresh(true);

      // Navbar computed values update
      this.authVersion.update((v) => v + 1);
    });

    this.router.navigate(['/']);
  }

  // =====================================================
  // TOKEN REFRESH TIMER
  // =====================================================

  startTokenRefreshTimer(): void {
    this.stopTokenRefreshTimer();

    // Proactively refresh every 5 minutes (300000ms)
    this.refreshTimer = setInterval(() => {
      this.refreshAuthToken().subscribe({
        error: () => {},
      });
    }, 300000);
  }

  // =====================================================
  // STOP TOKEN REFRESH TIMER
  // =====================================================

  stopTokenRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);

      this.refreshTimer = null;
    }
  }

  // =====================================================
  // REFRESH AUTH TOKEN
  // =====================================================

  refreshAuthToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    let refreshReqParam: any = {
      refreshToken: refreshToken,
    };

    const encrypted = CryptoHelper.encrypt(JSON.stringify(refreshReqParam));
    const bodyToSend = JSON.stringify(encrypted);

    const loginService = this.injector.get(LoginService);

    return loginService.refreshTokenAPI(bodyToSend).pipe(
      tap({
        next: (res: any) => {
          if (res && res.code === 1 && res.data) {
            try {
              const encryptData: any = res.data;
              const decrypted = CryptoHelper.decrypt(encryptData);
              const parsedData = JSON.parse(decrypted);

              const newToken = parsedData.token || parsedData.accessToken;
              if (newToken) {
                this.setToken(newToken);
              }

              const newRefresh =
                parsedData.refreshToken || parsedData.RefreshToken || parsedData.refresh_token;

              if (newRefresh) {
                this.setRefreshToken(newRefresh);
              }
            } catch (e) {
              console.error('[AuthService] Error parsing refresh response:', e);
            }
          }
        },
        error: (err: any) => {
          console.error('[AuthService] Refresh token API error:', err);
        },
      }),
    );
  }
}
