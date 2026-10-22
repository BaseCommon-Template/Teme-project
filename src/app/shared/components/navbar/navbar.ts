import { Component, computed, inject, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { MenuService } from '../../../core/services/menu';
import { AuthService } from '../../../services/auth';
import { ProfileDropdownComponent } from './profiledropdown/profiledropdown';
import Swal from 'sweetalert2';
import { LoginService } from '../../../services/login-service';
import { CryptoHelper } from '../../../helpers/crypto-helper';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ProfileDropdownComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  @Output() passwordChange = new EventEmitter<{
    oldpassword: string;
    newpassword: string;
    confirmpassword: string;
  }>();
  readonly menuService = inject(MenuService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly loginService = inject(LoginService);

  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly isProfileDropdownOpen = signal<boolean>(false);

  // =====================================================
  // LOGIN STATUS
  // =====================================================

  readonly isLoggedIn = computed(() => {
    this.authService.authVersion();

    return !!this.authService.getToken();
  });

  readonly currentUser = computed(() => {
    this.authService.authVersion();

    return this.authService.getCurrentUser();
  });

  readonly currentRoleId = computed(() => {
    this.authService.authVersion();

    const roleId = this.authService.getRoleId();

    return roleId || 0;
  });

  readonly userRoles = computed<Array<any>>(() => {
    this.authService.authVersion();

    const user = this.currentUser();

    const roles = user?.roles || user?.rols || this.authService.getRoles() || [];

    if (!Array.isArray(roles)) {
      return [];
    }

    return roles.map((role: any) => ({
      ...role,
      roleId: Number(role?.RoleId ?? role?.roleId ?? role?.roleid ?? role?.role_id ?? 0),
      roleName: role?.RoleName ?? role?.roleName ?? role?.rolename ?? role?.role_name ?? '',
    }));
  });

  readonly activeRoleId = computed<number>(() => {
    const currentId = Number(this.currentRoleId());

    if (currentId > 0) {
      return currentId;
    }

    const roles = this.userRoles();

    if (Array.isArray(roles) && roles.length > 0) {
      return Number(roles[0]?.RoleId ?? roles[0]?.roleId ?? roles[0]?.roleid ?? 0);
    }

    return 0;
  });

  readonly roleName = computed(() => {
    this.authService.authVersion();

    const currentId = this.currentRoleId();
    const matchedRole = this.userRoles().find(
      (r) => Number(r?.RoleId ?? r?.roleId ?? r?.roleid) === Number(currentId),
    );

    if (matchedRole) {
      return matchedRole?.RoleName ?? matchedRole?.roleName ?? matchedRole?.rolename ?? '';
    }

    const roles = this.authService.getRoles();

    if (roles?.length) {
      const roleName = roles.find((role) => typeof role === 'string' && isNaN(Number(role)));
      if (roleName) return roleName;
    }

    const user = this.currentUser();
    return user?.RoleName ?? user?.roleName ?? user?.rolename ?? user?.role_name ?? '';
  });

  onChangeRole(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newRoleId = Number(target?.value);

    if (!newRoleId) return;

    const matchedRole = this.userRoles().find(
      (r) => Number(r?.RoleId ?? r?.roleId ?? r?.roleid) === newRoleId,
    );

    const newRoleName = matchedRole?.RoleName ?? matchedRole?.roleName ?? '';

    // console.log('🔄 ROLE CHANGE');
    // console.log('New Role ID:', newRoleId);
    // console.log('New Role Name:', newRoleName);

    // Role change
    this.authService.setRoleId(newRoleId, newRoleName);

    // console.log('✅ Auth Role After Set:', this.authService.getRoleId());

    this.menuService.refresh(true);

    this.router.navigate(['/dashboard']);
  }

  // =====================================================
  // MOBILE MENU
  // =====================================================

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  // =====================================================
  // NAVIGATION
  // =====================================================

  onNavigate(path: string | null | undefined, event?: Event): void {
    this.isMobileMenuOpen.set(false);
    this.isProfileDropdownOpen.set(false);

    if (!path || path === '#' || path === 'javascript:void(0)') {
      if (event && (!path || path === '#')) {
        event.preventDefault();
      }
      return;
    }

    let targetPath = path.trim();

    if (targetPath.startsWith('http://') || targetPath.startsWith('https://')) {
      if (event) event.preventDefault();
      window.open(targetPath, '_blank');
      return;
    }

    if (!targetPath.startsWith('/')) {
      targetPath = '/' + targetPath;
    }

    if (targetPath) {
      this.router.navigateByUrl(targetPath).catch((err) => {
        // console.warn('Navigation error for path:', targetPath, err);
      });
    }
  }

  // =====================================================
  // PROFILE DROPDOWN
  // =====================================================

  toggleProfileDropdown(): void {
    this.isProfileDropdownOpen.update((v) => !v);
  }

  onChangePassword(passwordData: {
    oldpassword: string;
    newpassword: string;
    confirmpassword: string;
  }): void {
    const user = this.currentUser();

    const userId = user?.userid ?? user?.userId ?? user?.userautoid ?? user?.id;

    const payload = {
      userid: userId,
      oldpassword: passwordData.oldpassword,
      newpassword: passwordData.newpassword,
      confirmpassword: passwordData.confirmpassword,
    };

    this.loginService.changePassword(payload).subscribe({
      next: (response: any) => {
        // console.log('🔥 Change Password Response:', response);

        // ============================================
        // API HTTP 200 but BUSINESS ERROR
        // ============================================
        if (response?.code !== 1) {
          Swal.fire({
            icon: 'error',
            title: 'Password Change Failed',
            text: response?.message || 'Unable to change password. Please try again.',
            confirmButtonColor: '#1C4587',
          });

          return;
        }

        // ============================================
        // SUCCESS
        // ============================================
        Swal.fire({
          icon: 'success',
          title: 'Password Changed Successfully',
          text: 'Your password has been changed. You will be logged out.',
          confirmButtonColor: '#1C4587',
        }).then(() => {
          this.loginService.logoutAPI().subscribe({
            next: () => {
              this.authService.performLogout();

              this.isProfileDropdownOpen.set(false);
              this.isMobileMenuOpen.set(false);

              this.router.navigate(['/auth/userlogin']);
            },

            error: (logoutError: any) => {
              console.error('Logout API Error:', logoutError);

              // Logout locally even if logout API fails
              this.authService.performLogout();

              this.isProfileDropdownOpen.set(false);
              this.isMobileMenuOpen.set(false);

              this.router.navigate(['/auth/userlogin']);
            },
          });
        });
      },

      // ============================================
      // HTTP ERROR: 400 / 401 / 500 etc.
      // ============================================
      error: (error: any) => {
        console.error('❌ Change Password HTTP Error:', error);

        Swal.fire({
          icon: 'error',
          title: 'Password Change Failed',
          text:
            error?.error?.message ||
            error?.message ||
            'Unable to change password. Please try again.',
          confirmButtonColor: '#1C4587',
        });
      },
    });
  }

  // =====================================================
  // USER INITIALS
  // =====================================================

  getUserInitials(): string {
    const user = this.currentUser();

    const rawName =
      user?.name ||
      user?.fullName ||
      user?.userName ||
      user?.username ||
      user?.userId ||
      this.roleName() ||
      '';

    const name = String(rawName || '').trim();
    if (!name) {
      return '';
    }

    const parts = name.split(/\s+/);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  onLogout(): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to sign out from the portal?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'No',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.isProfileDropdownOpen.set(false);
      this.isMobileMenuOpen.set(false);

      const jpAccessToken = this.authService.getJpAccessToken();

      if (jpAccessToken && this.currentUser().roles[0].RoleId === 11) {
        const payload = {
          accessToken: jpAccessToken,
        };
        let encPayload = CryptoHelper.encrypt(JSON.stringify(payload));
        this.loginService.janParichayLogoutAPI(JSON.stringify(encPayload)).subscribe({
          next: (res: any) => {
            // console.log('JanParichay Logout API Success:', res);
            this.proceedNormalLogout();
          },
          error: (jpError: any) => {
            console.error('JanParichay Logout API Error:', jpError);
            // Proceed to normal logout even if JanParichay logout fails
            // this.proceedNormalLogout();
          },
        });
      } else {
        this.proceedNormalLogout();
      }
    });
  }

  private proceedNormalLogout(): void {
    // Logout API
    this.authService.performLogout();
  }
}
