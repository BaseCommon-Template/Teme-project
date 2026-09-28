import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles = route.data?.['roles'];

    if (!allowedRoles || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return true;
    }

    const currentRoleId = Number(this.authService.getRoleId());
    const sessionRole = typeof window !== 'undefined' ? Number(sessionStorage.getItem('role')) : 0;
    const activeRoleId = currentRoleId > 0 ? currentRoleId : sessionRole;

    const hasAccess = allowedRoles.some((expectedRole: any) => {
      const expectedNum = Number(expectedRole);
      return !isNaN(expectedNum) && activeRoleId === expectedNum;
    });

    if (hasAccess) {
      return true;
    } else {
      if (this.authService.getToken() || activeRoleId > 0) {
        this.router.navigate(['/dashboard']);
        return false;
      }
      this.router.navigate(['/auth/userlogin']);
      return false;
    }
  }
}
