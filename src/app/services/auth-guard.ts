import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot): boolean {
    const token = this.authService.getToken();
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
          queryParams: state?.url ? { returnUrl: state.url } : undefined,
        });
        return false;
      }
    }

    if (token || user || role) {
      return true;
    }

    // Redirect unauthenticated users to login page
    this.router.navigate(['/auth/userlogin'], {
      queryParams: state?.url ? { returnUrl: state.url } : undefined,
    });
    return false;
  }

  private getActiveRoleId(user: any, sessionRole: string | null): number {
    // 1. Check AuthService getRoleId (memory, session, cookie)
    const serviceRoleId = Number(this.authService.getRoleId());
    if (!isNaN(serviceRoleId) && serviceRoleId > 0) {
      return serviceRoleId;
    }

    // 2. Check sessionStorage 'role'
    if (sessionRole) {
      const parsedSession = Number(sessionRole);
      if (!isNaN(parsedSession) && parsedSession > 0) {
        return parsedSession;
      }
    }

    // 3. Check current user object
    if (user) {
      const userRoleId = Number(
        user.roleId ??
          user.roleid ??
          user.role_id ??
          user.rolId ??
          user.rolid ??
          user.rol_id ??
          user.currentRoleId ??
          user.activeRoleId,
      );
      if (!isNaN(userRoleId) && userRoleId > 0) {
        return userRoleId;
      }

      if (Array.isArray(user.roles) && user.roles.length > 0) {
        const firstRole = user.roles[0];
        const rId = Number(
          typeof firstRole === 'object'
            ? (firstRole?.roleId ??
                firstRole?.roleid ??
                firstRole?.role_id ??
                firstRole?.rolId ??
                firstRole?.rolid)
            : firstRole,
        );
        if (!isNaN(rId) && rId > 0) {
          return rId;
        }
      }
    }

    return 0;
  }
}
