import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { LoginService } from '../../../services/login-service';
import { AuthService } from '../../../services/auth';
import { IdleService } from '../../../services/idle-service';
import { MenuService } from '../../../core/services/menu';
import { CryptoHelper } from '../../../helpers/crypto-helper';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-callback.html',
  styleUrl: './auth-callback.css',
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly authService = inject(AuthService);
  private readonly idleService = inject(IdleService);
  private readonly cookieService = inject(CookieService);
  private readonly menuService = inject(MenuService);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      let code = params['code'];

      if (!code && window.location.hash) {
        const hashParts = window.location.hash.split('?');
        if (hashParts.length > 1) {
          const hashParams = new URLSearchParams(hashParts[1]);
          code = hashParams.get('code') || undefined;
        }
      }

      if (!code) {
        this.error.set('Authorization code missing.');
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/auth/userlogin']), 2500);
        return;
      }

      const codeVerifier = localStorage.getItem('codeVerifier');
      const payload = {
        code: code,
        codeVerifier: codeVerifier || '',
      };

      this.loginService.janParichayCallbackAPI(payload).subscribe({
        next: (res: any) => {
          if (res && res.code === 1) {
            let encryptData = res.data;
            let loginData: any = {};

            if (typeof encryptData === 'string') {
              try {
                const decrypted = CryptoHelper.decrypt(encryptData);
                loginData = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
                if (typeof loginData === 'string') {
                  loginData = JSON.parse(loginData);
                }
              } catch (e) {
                console.error('Failed to decrypt JanParichay login data:', e);
                try {
                  loginData = JSON.parse(encryptData);
                } catch {
                  this.error.set('Failed to decrypt Jan Parichay credentials.');
                  this.loading.set(false);
                  return;
                }
              }
            } else {
              loginData = encryptData;
              encryptData = CryptoHelper.encrypt(JSON.stringify(loginData));
            }

            // console.log('Processed JanParichay Login Data (auth-callback):', loginData);

            const isHttps = typeof location !== 'undefined' && location.protocol === 'https:';
            const cookieOptions = {
              path: '/',
              secure: isHttps,
              sameSite: (isHttps ? 'None' : 'Lax') as 'None' | 'Lax',
            };

            if (loginData.token) {
              this.cookieService.set(
                'token',
                loginData.token,
                1,
                cookieOptions.path,
                undefined,
                cookieOptions.secure,
                cookieOptions.sameSite,
              );
              this.authService.setToken(loginData.token);
            }
            if (loginData.refreshToken) {
              this.cookieService.set(
                'refreshToken',
                loginData.refreshToken,
                1,
                cookieOptions.path,
                undefined,
                cookieOptions.secure,
                cookieOptions.sameSite,
              );
              this.authService.setRefreshToken(loginData.refreshToken);
            }
            if (loginData?.janPar && (loginData?.roles?.[0]?.RoleId === 11 || loginData?.roles?.[0]?.roleId === 11)) {
              const jpToken = loginData?.janPar?.AccessToken || loginData?.janPar?.accessToken;
              if (jpToken) {
                this.cookieService.set(
                  'jpAccessToken',
                  jpToken,
                  1,
                  cookieOptions.path,
                  undefined,
                  cookieOptions.secure,
                  cookieOptions.sameSite,
                );
                this.authService.setJpAccessToken(jpToken);
              }
            }

            // Normalize user data and store in AuthService and Storage
            const normalizedUser = {
              ...loginData,
              name: loginData.userName || loginData.name || '',
              userName: loginData.userName || loginData.userId || '',
              username: loginData.userName || loginData.userId || '',
              userautoId: loginData.userautoId,
              agniveer_autoid: loginData.userautoId,
              autoid: loginData.userautoId,
              id: loginData.userautoId,
              userId: loginData.userId,
              agniveerId: loginData.agniveerId || loginData.userId,
              forceTypeId: loginData.forceTypeId,
              forceType: loginData.forceType,
              userType: loginData.userType || '',
              phone: loginData.mobileNo || loginData.phone || '',
              mobileNo: loginData.mobileNo || '',
            };

            this.authService.setCurrentUser(normalizedUser);

            if (typeof sessionStorage !== 'undefined') {
              if (loginData.userautoId != null) {
                sessionStorage.setItem('userautoId', String(loginData.userautoId));
                sessionStorage.setItem('agniveer_autoid', String(loginData.userautoId));
                sessionStorage.setItem('agniveerAutoid', String(loginData.userautoId));
              }
              if (loginData.userId != null) {
                sessionStorage.setItem('userId', String(loginData.userId));
              }
              if (loginData.agniveerId != null) {
                sessionStorage.setItem('agniveerId', String(loginData.agniveerId));
              }
              if (loginData.forceTypeId != null) {
                sessionStorage.setItem('forceTypeId', String(loginData.forceTypeId));
              }
              if (loginData.forceType != null) {
                sessionStorage.setItem('forceType', String(loginData.forceType));
              }
              if (loginData.userType != null) {
                sessionStorage.setItem('userType', String(loginData.userType));
              }
            }

            this.idleService.startWatching();

            localStorage.removeItem('codeVerifier');

            // Handle roles (fallback for Agniveer where roles is empty array [])
            let effectiveRoles: any[] = [];
            if (Array.isArray(loginData.roles) && loginData.roles.length > 0) {
              effectiveRoles = loginData.roles.map((r: any) => ({
                roleId: r.roleId ?? r.roleid ?? r.role_id ?? r.id,
                roleName: r.roleName ?? r.rolename ?? r.role_name,
              }));
            }

            const lowestRole = effectiveRoles.reduce((prev: any, curr: any) => {
              return (curr.roleId ?? 0) > (prev.roleId ?? 0) ? curr : prev;
            }, effectiveRoles[0]);

            const roleIdToSet = lowestRole?.roleId ?? 1;
            const roleNameToSet = lowestRole?.roleName ? String(lowestRole.roleName) : '';

            // Clean older role data from session and cookies
            if (typeof sessionStorage !== 'undefined') {
              try {
                sessionStorage.removeItem('role');
                sessionStorage.removeItem('roleId');
                sessionStorage.removeItem('role_name');
                sessionStorage.removeItem('roles');
                sessionStorage.removeItem('menudata');
              } catch (e) {}
            }
            try {
              this.cookieService.delete('roleId', '/');
              this.cookieService.delete('roleId');
              this.cookieService.delete('roles', '/');
              this.cookieService.delete('roles');
            } catch (e) {}

            this.cookieService.set(
              'roleId',
              String(roleIdToSet),
              1,
              cookieOptions.path,
              undefined,
              cookieOptions.secure,
              cookieOptions.sameSite,
            );
            this.authService.setRoles(effectiveRoles);
            this.authService.setRoleId(roleIdToSet, roleNameToSet);
            sessionStorage.setItem('role', String(roleIdToSet));
            sessionStorage.setItem('role-id', String(roleIdToSet));
            if (roleNameToSet) {
              sessionStorage.setItem('role_name', roleNameToSet);
            }

            // Load menu for role
            const menuReqParam: any = {
              roleId: roleIdToSet,
              roleid: roleIdToSet,
              langId: 1,
            };

            let encryptedMenuParam: any = JSON.stringify(menuReqParam);
            encryptedMenuParam = CryptoHelper.encrypt(encryptedMenuParam);
            encryptedMenuParam = JSON.stringify(encryptedMenuParam);

            this.loginService.getMenuByRoleAPI(encryptedMenuParam).subscribe({
              next: (menuRes: any) => {
                if (menuRes && menuRes.code === 1 && menuRes.data) {
                  try {
                    sessionStorage.removeItem('menudata');
                    sessionStorage.setItem('menudata', menuRes.data);
                    const decMenu = CryptoHelper.decrypt(menuRes.data);
                    const parsedMenus = JSON.parse(decMenu);
                    this.menuService.patchMenus(parsedMenus, roleIdToSet);
                  } catch (e) {
                    this.menuService.refresh(true);
                  }
                } else {
                  this.menuService.refresh(true);
                }
                this.loading.set(false);
                this.navigateAfterLogin(lowestRole, loginData);
              },
              error: () => {
                this.menuService.refresh(true);
                this.loading.set(false);
                this.navigateAfterLogin(lowestRole, loginData);
              },
            });
          } else {
            this.error.set(res?.message || 'Jan Parichay verification failed.');
            this.loading.set(false);
            setTimeout(() => this.router.navigate(['/auth/userlogin']), 3000);
          }
        },
        error: (err: any) => {
          console.error('JanParichay Callback Error:', err);
          this.error.set('Failed to verify Jan Parichay authorization.');
          this.loading.set(false);
          setTimeout(() => this.router.navigate(['/auth/userlogin']), 3000);
        },
      });
    });
  }

  private navigateAfterLogin(lowestRole: any, loginData?: any): void {
    const roleName = String(lowestRole?.roleName || loginData?.userType || '').toLowerCase();
    const isAgniveer =
      lowestRole?.roleId === 1 ||
      roleName.includes('agniveer') ||
      loginData?.userType === 'Agniveer' ||
      loginData?.agniveerId;

    if (isAgniveer) {
      this.router
        .navigate(['/career-progression'], { replaceUrl: true })
        .catch(() => this.router.navigate(['/dashboard'], { replaceUrl: true }));
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
