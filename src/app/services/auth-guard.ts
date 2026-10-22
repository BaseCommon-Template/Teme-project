import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth';

export interface ValidateSessionResponse {
  success?: boolean;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async canActivate(route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot): Promise<boolean> {
    const token =
      this.authService.getToken() ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null);
    const user = this.authService.getCurrentUser();
    const role = typeof window !== 'undefined' ? sessionStorage.getItem('role') : null;

    

    // Check role restrictions if defined on route data (e.g., data: { roles: [1, 13] })
    const rawRoles = route?.data?.['roles'] ?? route?.data?.['role'];
    const allowedRoles: any[] = Array.isArray(rawRoles)
      ? rawRoles
      : rawRoles !== undefined && rawRoles !== null
        ? [rawRoles]
        : [];

    if (allowedRoles.length > 0) {
      const activeRoleId = this.getActiveRoleId(user, role);

      const hasAccess = allowedRoles.some((expectedRole: any) => {
        const expectedNum = Number(expectedRole);
        return !isNaN(expectedNum) && activeRoleId === expectedNum;
      });

      // console.log(
      //   `[AuthGuard] Route: ${route?.routeConfig?.path}, Allowed Roles: [${allowedRoles}], Active Role ID: ${activeRoleId}, Access: ${hasAccess}`
      // );

      if (!hasAccess) {
        // console.warn(
        //   `[AuthGuard] Access denied for route /${route?.routeConfig?.path}. Required: [${allowedRoles}], Active: ${activeRoleId}`,
        // );
        // If already logged in but unauthorized for this role, redirect to dashboard
        if (token || user || role) {
          this.router.navigate(['/dashboard']);
          return false;
        }
        this.router.navigate(['/auth/userlogin'], {
          queryParams: state?.url ? { returnUrl: state?.url } : undefined,
        });
        return false;
      }
    }

    if (token || user || role) {
      return true;
    }

    // Redirect unauthenticated users to login page
    this.router.navigate(['/auth/userlogin'], {
      queryParams: state?.url ? { returnUrl: state?.url } : undefined,
    });
    return false;
  }

  private getActiveRoleId(user: any, sessionRole: string | null): number {
    // 1. AuthService
    const serviceRoleId = Number(this.authService.getRoleId());

    if (!isNaN(serviceRoleId) && serviceRoleId > 0) {
      return serviceRoleId;
    }

    // 2. sessionStorage
    if (sessionRole) {
      const parsedSession = Number(sessionRole);

      if (!isNaN(parsedSession) && parsedSession > 0) {
        return parsedSession;
      }
    }

    // 3. Current user object
    if (user) {
      const userRoleId = Number(
        user?.RoleId ??
          user?.roleId ??
          user?.roleid ??
          user?.role_id ??
          user?.rolId ??
          user?.rolid ??
          user?.rol_id ??
          user?.currentRoleId ??
          user?.activeRoleId,
      );

      if (!isNaN(userRoleId) && userRoleId > 0) {
        return userRoleId;
      }

      // 4. Roles array
      if (Array.isArray(user?.roles) && user.roles.length > 0) {
        const roleIds = user.roles
          .map((role: any) => {
            if (typeof role === 'number') {
              return Number(role);
            }

            return Number(
              role?.RoleId ??
                role?.roleId ??
                role?.roleid ??
                role?.role_id ??
                role?.rolId ??
                role?.rolid ??
                role?.rol_id,
            );
          })
          .filter((id: number) => !isNaN(id) && id > 0);

        if (roleIds.length > 0) {
          return roleIds[0];
        }
      }
    }

    return 0;
  }

  private clearSessionAndCookies(): void {
    try {
      this.authService.clear();
    } catch (e) {}

    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.clear();
      } catch (e) {}
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear();
      } catch (e) {}
    }

    if (typeof document !== 'undefined' && document.cookie) {
      try {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf('=');
          const name = (eqPos > -1 ? cookie.substring(0, eqPos) : cookie).trim();
          if (name) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; max-age=0`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; max-age=0`;
          }
        }
      } catch (e) {}
    }
  }
}
