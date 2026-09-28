import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../services/auth';
import { MenuService } from '../../../../core/services/menu';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profiledropdown.html',
  styleUrl: './profiledropdown.css',
})
export class ProfileDropdownComponent {
  @Input() isOpen = false;
  @Input() userName = '';
  @Input() userDesignation = '';
  @Input() userEmail = '';
  @Input() userPhone = '';
  @Input() roleName = '';
  @Input() currentRoleId = 0;
  @Input() user: any = null;

  @Output() closeDropdown = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();
  @Output() passwordChange = new EventEmitter<{
    oldpassword: string;
    newpassword: string;
    confirmpassword: string;
  }>();

  isChangePasswordModalOpen = false;
  passwordSubmitted = false;
  passwordLoading = false;
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  passwordFormData = {
    oldpassword: '',
    newpassword: '',
    confirmpassword: '',
  };

  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);

  get userRoles(): Array<{ roleId: number; roleName: string }> {
    const rawRoles =
      this.user?.roles ||
      this.user?.rols ||
      this.authService.getCurrentUser()?.roles ||
      this.authService.getCurrentUser()?.rols ||
      this.authService.getRoles() ||
      [];

    if (!Array.isArray(rawRoles)) return [];

    const result: Array<{ roleId: number; roleName: string }> = [];
    rawRoles.forEach((r: any) => {
      if (typeof r === 'object' && r !== null) {
        const id = r.roleId ?? r.roleid ?? r.role_id ?? r.id;
        const name = r.roleName ?? r.rolename ?? r.role_name ?? r.name ?? '';
        if (id !== undefined && id !== null && !isNaN(Number(id))) {
          if (!result.some((existing) => existing.roleId === Number(id))) {
            result.push({ roleId: Number(id), roleName: String(name || '') });
          }
        }
      }
    });

    return result;
  }

  get activeRoleId(): number {
    return this.currentRoleId || this.authService.getRoleId() || (this.userRoles[0]?.roleId ?? 0);
  }

  get canViewProfile(): boolean {
    const roleId = Number(this.activeRoleId);
    if (roleId === 11) return true;

    if (Number(this.currentRoleId) === 11) return true;
    if (Number(this.authService.getRoleId()) === 11) return true;

    if (typeof window !== 'undefined') {
      const sessionRole = Number(sessionStorage.getItem('role'));
      if (sessionRole === 11) return true;
    }

    return false;
  }

  getInitials(name: any): string {
    const effectiveName = String(name || this.roleName || '').trim();
    if (!effectiveName) {
      return '';
    }

    const parts = effectiveName.split(/\s+/);

    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    return effectiveName.slice(0, 2).toUpperCase();
  }

  onChangeRole(event: any): void {
    const newRoleId = Number(event?.target?.value);
    if (!newRoleId) return;

    const matchedRole = this.userRoles.find((r) => r.roleId === newRoleId);
    const newRoleName = matchedRole?.roleName || '';

    // Remove older role and menu data from sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('role-id');
        sessionStorage.removeItem('role_name');
        sessionStorage.removeItem('roleId');
        sessionStorage.removeItem('menudata');
      } catch (e) {}
    }

    this.authService.setRoleId(newRoleId, newRoleName);
    this.menuService.refresh(true);
    this.closeDropdown.emit();
    if (newRoleId === 6) {
      this.router.navigate(['/import']);
    } else if (newRoleId === 11) {
      this.router.navigate(['/dashboard-agniveer']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  openChangePasswordModal(): void {

    this.closeDropdown.emit();

    this.passwordFormData = {
      oldpassword: '',
      newpassword: '',
      confirmpassword: '',
    };

    this.passwordSubmitted = false;
    this.passwordLoading = false;

    this.showOldPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;

    this.isChangePasswordModalOpen = true;
  }
  closeChangePasswordModal(): void {
    this.isChangePasswordModalOpen = false;
    this.passwordSubmitted = false;
    this.passwordLoading = false;

    this.passwordFormData = {
      oldpassword: '',
      newpassword: '',
      confirmpassword: '',
    };
  }

  isValidNewPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    return passwordRegex.test(password);
  }

  submitChangePassword(form: any): void {
    this.passwordSubmitted = true;

    const { oldpassword, newpassword, confirmpassword } = this.passwordFormData;

    if (form.invalid || !oldpassword || !newpassword || !confirmpassword) {
      return;
    }

    if (!this.isValidNewPassword(newpassword)) {
      return;
    }

    if (newpassword !== confirmpassword) {
      return;
    }

    this.passwordLoading = true;

    this.passwordChange.emit({
      oldpassword,
      newpassword,
      confirmpassword,
    });
  }

  onPasswordOverlayClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onLogout(): void {
    this.logout.emit();
  }
}
