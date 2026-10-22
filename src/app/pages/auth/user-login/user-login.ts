import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth';
import { CommonService } from '../../../services/common-service';
import { LoginService } from '../../../services/login-service';
import { MenuService } from '../../../core/services/menu';
import { SsoService } from '../../../core/services/sso';
import { CryptoHelper } from '../../../helpers/crypto-helper';
import { environment } from '../../../../environments/environment';
import { LandingPage } from '../../../services/landingPage/landing-page';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-login.html',
  styleUrl: './user-login.css',
})
export class UserLoginComponent implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly loginService = inject(LoginService);
  private readonly cookieService = inject(CookieService);
  private readonly menuService = inject(MenuService);
  private readonly landingPage = inject(LandingPage);
  private readonly ssoService = inject(SsoService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  username = '';
  password = '';
  showPassword = false;

  otp = '';
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpRequired = false;

  readonly otpTimer = signal(60);
  otpTimerInterval: any = null;
  readonly otpCancelEnabled = signal(false);

  uniqueOtpRefId = 0;

  readonly isChangePasswordModalOpen = signal<boolean>(false);

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  changePasswordLoading = false;
  changePasswordSubmitted = false;

  // CAPTCHA
  captchaCode = '';
  captchaKey = '';
  captchaInput = '';
  readonly isCaptchaLoading = signal<boolean>(false);

  private loginReqData: any;

  activeTab: 'login' | 'janparichay' = 'login';

  readonly loading = signal<boolean>(false);
  readonly ssoLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  @ViewChild('emailElement') emailElement!: ElementRef<HTMLInputElement>;

  setActiveTab(tab: 'login' | 'janparichay'): void {
    this.activeTab = tab;
    this.error.set(null);
    if (tab === 'login') {
      setTimeout(() => {
        this.emailElement?.nativeElement?.focus();
      }, 50);
    }
  }
  loadJobNotificationList(): void {
    const payload = {};
    // console.log('payload', payload);
    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const bodyToSend = JSON.stringify(encrypted);

    this.landingPage.getAllMenusPublic(bodyToSend).subscribe({
      next: (res: any) => {
        if (res && res.code) {
          try {
            const data = CryptoHelper.decrypt(res.data);
            const parsed = JSON.parse(data);
            const menus = parsed?.menus ?? parsed?.data ?? parsed;
            // console.log('[LandingComponent] getAllMenusPublic Raw Response:', menus);
            if (Array.isArray(menus) && menus.length > 0) {
              this.menuService.patchMenus(menus);
            }
          } catch (e) {
            console.error('[LandingComponent] Error parsing public menus:', e);
          }
        }
      },
      error: (err: any) => {
        console.error('[LandingComponent] getAllMenusPublic Error:', err);
      },
    });
    this.landingPage.loadPublicMenusOnce();
  }
  ngOnInit(): void {
    this.generateCaptcha();

    if (this.authService.getToken()) {
      this.router.navigate(['/dashboard']);
    } else {
      this.loadJobNotificationList();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.emailElement?.nativeElement?.focus();
    }, 0);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleOldPassword(): void {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isValidNewPassword(password: string): boolean {
    // Minimum 8 characters
    // At least one uppercase
    // At least one lowercase
    // At least one number
    // At least one special character

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

    return passwordRegex.test(password);
  }

  /**
   * Generate a new CAPTCHA using POST /api/GenerateCaptcha/GenerateCaptcha
   */
  generateCaptcha(): void {
    this.isCaptchaLoading.set(true);
    this.captchaInput = '';

    this.loginService.generateCaptchaAPI({}).subscribe({
      next: (res: any) => {
        this.isCaptchaLoading.set(false);
        let decryptedData: any = null;

        const rawData = res?.data ?? res;

        if (rawData) {
          try {
            let dec = typeof rawData === 'string' ? CryptoHelper.decrypt(rawData) : rawData;
            if (typeof dec === 'string') {
              try {
                dec = JSON.parse(dec);
              } catch (e) {}
            }
            if (typeof dec === 'string') {
              try {
                dec = JSON.parse(dec);
              } catch (e) {}
            }
            decryptedData = dec;
          } catch (e) {
            decryptedData = rawData;
          }
        }

        if (Array.isArray(decryptedData) && decryptedData.length > 0) {
          decryptedData = decryptedData[0];
        }

        const key = decryptedData?.key || decryptedData?.Key || decryptedData?.key_code || '';
        const captcha =
          decryptedData?.captcha || decryptedData?.Captcha || decryptedData?.captcha_code || '';

        if (key || captcha) {
          this.captchaKey = String(key || Date.now());
          this.captchaCode = String(captcha || '');
        }
      },
    });
  }

  /**
   * JanParichay SSO Login
   */
  onJanParichayLogin() {
    this.loginService.janParichayLoginAPI().subscribe({
      next: (res: any) => {
        /* console.log('JanParichay login API response:', res) */
        // Extract url and codeVerifier from response
        const url = res?.url;
        const codeVerifier = res?.codeVerifier;
        if (codeVerifier) {
          localStorage.setItem('codeVerifier', codeVerifier);
        }

        if (url) {
          window.location.href = url;
        } else {
          console.error('No redirect URL found in the API response.');
        }
      },
      error: (err: any) => {
        console.error('JanParichay login API error:', err);
      },
    });
  }

  private handleSuccessResponse(loginData: any, rawLoginRes?: any): void {
    // console.log('Login Response:', rawLoginRes ?? loginData);
    // console.log('Login Data:', loginData);

    // =====================================================
    // REFRESH TOKEN
    // =====================================================

    const refreshToken =
      loginData?.refreshToken || loginData?.RefreshToken || loginData?.refresh_token;

    if (refreshToken) {
      this.authService.setRefreshToken(refreshToken);
    }

    // =====================================================
    // TOKEN & CLEAR PUBLIC MENUS
    // =====================================================

    this.landingPage.clearPublicMenus();

    if (loginData?.token) {
      this.authService.setToken(loginData.token);
    } else {
      console.error('Login token not found in response');
      this.error.set('Unauthorized Access!');
      this.loading.set(false);
      return;
    }

    // =====================================================
    // USER DATA
    // =====================================================

    // Store complete login user data so Navbar can access current user
    this.authService.setCurrentUser(loginData);

    // =====================================================
    // ROLES
    // =====================================================

    let extractedRoleId: number = 0;
    const rawRoles = loginData?.roles || loginData?.rols || loginData?.role;

    if (Array.isArray(rawRoles) && rawRoles.length > 0) {
      const normalizedRoles = rawRoles.map((role: any) => ({
        roleId: Number(
          role.roleId ??
            role.roleid ??
            role.role_id ??
            role.rolId ??
            role.rolid ??
            role.rol_id ??
            (typeof role === 'number' ? role : 0),
        ),
        roleName:
          role.roleName ??
          role.rolename ??
          role.role_name ??
          role.rolName ??
          (typeof role === 'string' ? role : ''),
      }));

      // console.log('Normalized Roles from Login Response:', normalizedRoles);

      this.authService.setRoles(normalizedRoles);

      // Pick role with highest roleId / priority
      const selectedRole = normalizedRoles.reduce((prev: any, curr: any) => {
        return (curr.roleId ?? 0) > (prev.roleId ?? 0) ? curr : prev;
      });

      if (selectedRole?.roleId) {
        extractedRoleId = Number(selectedRole.roleId);
        this.authService.setRoleId(extractedRoleId, selectedRole?.roleName || '');
      }
    } else if (
      loginData?.roleId != null ||
      loginData?.role_id != null ||
      loginData?.roleid != null ||
      loginData?.rolId != null ||
      loginData?.rolid != null ||
      loginData?.rol_id != null
    ) {
      extractedRoleId = Number(
        loginData.roleId ??
          loginData.role_id ??
          loginData.roleid ??
          loginData.rolId ??
          loginData.rolid ??
          loginData.rol_id,
      );
      const fallbackRoleName = loginData.roleName || loginData.role_name;
      this.authService.setRoleId(extractedRoleId, fallbackRoleName);
      this.authService.setRoles([{ roleId: extractedRoleId, roleName: fallbackRoleName }]);
    }

    // =====================================================
    // CALL GET MENU ROLE BY ID API & PATCH MENUS
    // =====================================================

    let menuReqParam: any = {
      roleid: extractedRoleId,
    };

    // console.log('Calling Get Menu By Role API with payload:', menuReqParam);

    let encryptedMenuParam: any = JSON.stringify(menuReqParam);
    encryptedMenuParam = CryptoHelper.encrypt(encryptedMenuParam);
    encryptedMenuParam = JSON.stringify(encryptedMenuParam);

    this.loginService.getMenuByRoleAPI(encryptedMenuParam).subscribe({
      next: (menuRes: any) => {
        try {
          // =====================================================
          // CHECK API RESPONSE
          // =====================================================
          if (!menuRes || menuRes.code !== 1 || !menuRes.data) {
            console.warn('Get Menu By Role API returned no valid menu data.');

            this.loading.set(false);

            // No valid menu response = Unauthorized
            this.router.navigate(['/unauthrize']);
            return;
          }

          // =====================================================
          // DECRYPT MENU RESPONSE
          // =====================================================
          sessionStorage.removeItem('menudata');

          const decrypted = CryptoHelper.decrypt(menuRes.data);
          const parsed = JSON.parse(decrypted);

          // =====================================================
          // GET MENU LIST
          // =====================================================
          const menuContainer = parsed?.menus;
          const menuList = menuContainer?.Menus ?? [];

          // console.log('Get Menu By Role - Menu List:', menuList);

          // Store role menus
          sessionStorage.setItem('menudata', JSON.stringify(menuList));

          // Patch menus in MenuService
          if (Array.isArray(menuList)) {
            this.menuService.patchMenus(menuList, extractedRoleId);
          }

          if (loginData?.ispasswordchange === false) {
            this.loading.set(false);
            this.openChangePasswordModal();
            return;
          }

          // =====================================================
          // FIND FIRST LANDING MENU
          // =====================================================
          const landingMenu = Array.isArray(menuList)
            ? menuList.find((menu: any) => {
                const isLanding =
                  menu?.IsLanding === true ||
                  Number(menu?.IsLanding) === 1 ||
                  String(menu?.IsLanding).toLowerCase() === 'true' ||
                  String(menu?.IsLanding) === '1';

                const isActive =
                  menu?.Active !== false &&
                  String(menu?.Active).toLowerCase() !== 'false' &&
                  Number(menu?.Active) !== 0;

                const controllerName = String(menu?.ControllerName ?? '').trim();

                return isLanding && isActive && !!controllerName;
              })
            : null;

          // console.log('First Landing Menu:', landingMenu);

          // =====================================================
          // NO LANDING MENU = UNAUTHORIZED
          // =====================================================
          if (!landingMenu?.ControllerName) {
            // console.warn('No IsLanding=true menu found for current role.');

            this.loading.set(false);

            this.router.navigate(['/unauthrize']);
            return;
          }

          // =====================================================
          // LANDING MENU FOUND
          // NAVIGATE TO FIRST LANDING MENU
          // =====================================================
          const landingUrl = String(landingMenu.ControllerName).trim();

          // console.log('Navigating to first landing menu:', landingUrl);

          this.loading.set(false);

          // =====================================================
          // NAVIGATE FIRST
          // =====================================================
          this.router.navigateByUrl(landingUrl);
        } catch (e) {
          console.error('❌ Failed to parse/decrypt Get Menu By Role response:', e);

          this.menuService.refresh(false);
          this.loading.set(false);

          // Any menu parsing/decryption failure = Unauthorized
          this.router.navigate(['/unauthrize']);
        }
      },

      // =====================================================
      // GET MENU API ERROR
      // =====================================================
      error: (menuErr: any) => {
        console.error('❌ Get Menu By Role API Error:', menuErr);

        this.menuService.refresh(false);
        this.loading.set(false);

        // 401 / 403 OR any menu API failure
        this.router.navigate(['/unauthrize']);
      },
    });
  }

  preventUserIdInvalidCharacters(event: KeyboardEvent): void {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Only letters, numbers, _, - and @
    if (!/^[A-Za-z0-9_@-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  sanitizeUserId(): void {
    this.username = this.username.replace(/[^A-Za-z0-9_@-]/g, '').slice(0, 100);
  }

  performLogout(token: string): void {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    Swal.fire({
      title: 'Clearing session...',
      text: 'Please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const apiUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
    this.http.post(apiUrl + 'Users/logout', {}, { headers }).subscribe({
      next: () => {
        Swal.fire({
          title: 'Please wait...',
          text: 'Logging in...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        this.loginService.loginAPI(this.loginReqData).subscribe({
          next: (loginRes: any) => {
            Swal.close();
            // console.log('Login Response:', loginRes);
            if (loginRes && loginRes.code === 1 && loginRes.data) {
              try {
                let encryptData: any = loginRes.data;
                let decrypted = CryptoHelper.decrypt(encryptData);
                let loginData = JSON.parse(decrypted);
                this.handleSuccessResponse(loginData, loginRes);
              } catch (e) {
                this.error.set('Failed to parse login response');
                this.generateCaptcha();
              }
            } else {
              this.username = '';
              this.password = '';
              this.captchaInput = '';
              this.generateCaptcha();
              Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: loginRes?.message || 'Could not complete login request.',
              });
            }
          },
          error: (loginErr: any) => {
            Swal.close();
            this.username = '';
            this.password = '';
            this.captchaInput = '';
            this.generateCaptcha();
            Swal.fire({
              icon: 'error',
              title: 'Login Failed',
              text: loginErr?.error?.message || loginErr?.message || 'Server connection failed',
            });
          },
        });
      },
      error: (err: any) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Logout Failed',
          text: err?.error?.message || err?.message || 'Failed to clear previous session',
        });
      },
    });
  }

  openChangePasswordModal(): void {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    this.showOldPassword = false;
    this.showNewPassword = false;
    this.showConfirmPassword = false;

    this.changePasswordSubmitted = false;
    this.changePasswordLoading = false;

    this.isChangePasswordModalOpen.set(true);
  }

  closeChangePasswordModal(): void {
    this.isChangePasswordModalOpen.set(false);

    this.logoutAfterPasswordChange();
  }

  changePassword(): void {
    this.changePasswordSubmitted = true;

    if (!this.oldPassword.trim()) {
      return;
    }

    if (!this.newPassword.trim()) {
      return;
    }

    if (!this.confirmPassword.trim()) {
      return;
    }

    if (!this.isValidNewPassword(this.newPassword)) {
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      return;
    }

    const userid = this.username.trim();

    const payload = {
      userid: userid,
      oldpassword: this.oldPassword,
      newpassword: this.newPassword,
      confirmpassword: this.confirmPassword,
    };

    // console.log('Change Password Payload:', payload);

    let encryptedPayload: any = CryptoHelper.encrypt(JSON.stringify(payload));

    encryptedPayload = JSON.stringify(encryptedPayload);

    this.changePasswordLoading = true;

    const apiUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';

    this.loginService.changePassword(payload).subscribe({
      next: (res: any) => {
        this.changePasswordLoading = false;

        // console.log('Change Password Response:', res);

        if (res?.code === 1) {
          Swal.fire({
            icon: 'success',
            title: 'Password Changed',
            text: res?.message || 'Password changed successfully.',
            confirmButtonText: 'OK',
          }).then(() => {
            this.isChangePasswordModalOpen.set(false);
            this.logoutAfterPasswordChange();
          });

          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Change Password Failed',
          text: res?.message || res?.Message || 'Unable to change password.',
        });
      },

      error: (err: any) => {
        this.changePasswordLoading = false;

        console.error('Change Password API Error:', err);

        Swal.fire({
          icon: 'error',
          title: 'Change Password Failed',
          text:
            err?.error?.message ||
            err?.error?.Message ||
            err?.message ||
            'Unable to change password.',
        });
      },
    });
  }

  private logoutAfterPasswordChange(): void {
    const token = this.authService.getToken();

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.loginService.logoutAPI().subscribe({
      next: () => {
        this.clearLoginSession();
      },

      error: (err: any) => {
        console.error('Logout API Error:', err);

        // API fail ho tab bhi local session clear
        this.clearLoginSession();
      },
    });
  }

  onChangePassword(passwordData: {
    oldpassword: string;
    newpassword: string;
    confirmpassword: string;
  }): void {
    const currentUser = this.authService.getCurrentUser();

    const userid =
      currentUser?.userid ||
      currentUser?.userId ||
      currentUser?.username ||
      sessionStorage.getItem('userid') ||
      '';

    if (!userid) {
      Swal.fire({
        icon: 'error',
        title: 'Unable to Change Password',
        text: 'User ID not found.',
      });

      return;
    }

    const payload = {
      userid,
      ...passwordData,
    };

    this.loginService.changePassword(payload).subscribe({
      next: (res: any) => {
        // console.log('Change Password Response:', res);

        if (res?.code === 1) {
          Swal.fire({
            icon: 'success',
            title: 'Password Changed',
            text: res?.message || 'Password changed successfully.',
            confirmButtonText: 'OK',
          }).then(() => {
            // Password successfully changed
            // Now logout
            this.logoutAfterPasswordChange();
          });

          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Change Password Failed',
          text: res?.message || res?.Message || 'Unable to change password.',
        });
      },

      error: (error: any) => {
        console.error('Change Password API Error:', error);

        Swal.fire({
          icon: 'error',
          title: 'Change Password Failed',
          text:
            error?.error?.message ||
            error?.error?.Message ||
            error?.message ||
            'Unable to change password.',
        });
      },
    });
  }

  // =====================================================
  // OTP POPUP
  // =====================================================

  openOtpPopup(): void {
    this.otpRequired = true;

    this.otpDigits = ['', '', '', '', '', ''];
    this.otp = '';

    this.otpTimer.set(60);
    this.otpCancelEnabled.set(false);

    this.startOtpTimer();

    setTimeout(() => {
      document.getElementById('otp0')?.focus();
    }, 100);
  }

  // =====================================================
  // OTP TIMER
  // =====================================================

  startOtpTimer(): void {
    this.clearOtpTimer();

    this.otpTimer.set(60);
    this.otpCancelEnabled.set(false);

    this.otpTimerInterval = setInterval(() => {
      const remaining = this.otpTimer() - 1;

      if (remaining <= 0) {
        this.otpTimer.set(0);
        this.otpCancelEnabled.set(true);

        this.clearOtpTimer();
        return;
      }

      this.otpTimer.set(remaining);
    }, 1000);
  }

  clearOtpTimer(): void {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  }

  // =====================================================
  // OTP INPUT
  // =====================================================

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/\D/g, '').slice(0, 1);

    this.otpDigits[index] = input.value;
    this.otp = this.otpDigits.join('');

    if (input.value && index < 5) {
      document.getElementById(`otp${index + 1}`)?.focus();
    }
  }

  // =====================================================
  // OTP BACKSPACE
  // =====================================================

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && index > 0) {
      this.otpDigits[index - 1] = '';
      this.otp = this.otpDigits.join('');

      document.getElementById(`otp${index - 1}`)?.focus();
    }
  }

  // =====================================================
  // OTP PASTE
  // =====================================================

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6);

    if (!pasted) {
      return;
    }

    this.otpDigits = pasted.split('').concat(['', '', '', '', '', '']).slice(0, 6);

    this.otp = this.otpDigits.join('');

    setTimeout(() => {
      const nextIndex = Math.min(pasted.length, 5);
      document.getElementById(`otp${nextIndex}`)?.focus();
    });
  }

  // =====================================================
  // VERIFY INLINE OTP
  // =====================================================

  verifyInlineOtp(): void {
    const otp = this.otpDigits.join('');

    if (otp.length !== 6) {
      this.error.set('Please enter 6-digit OTP.');
      return;
    }

    this.error.set(null);

    this.verifyOTP(otp);
  }

  // =====================================================
  // CANCEL / RESET OTP
  // =====================================================

  cancelOtp(): void {
    if (!this.otpCancelEnabled()) {
      return;
    }

    this.clearOtpTimer();

    this.otpRequired = false;

    this.otpDigits = ['', '', '', '', '', ''];
    this.otp = '';

    this.otpTimer.set(60);
    this.otpCancelEnabled.set(false);

    this.error.set(null);

    setTimeout(() => {
      this.emailElement?.nativeElement?.focus();
    }, 100);
  }

  // =====================================================
  // VERIFY OTP API
  // =====================================================

  verifyOTP(otp: string): void {
    const payload = {
      UserId: this.username.trim(),
      OTP: Number(otp),
      Uniqueotprefid: Number(this.uniqueOtpRefId) || 0,
      ForceLogin: false,
    };

    let encryptedPayload: any = CryptoHelper.encrypt(JSON.stringify(payload));

    encryptedPayload = JSON.stringify(encryptedPayload);

    Swal.fire({
      title: 'Please wait...',
      text: 'Verifying OTP...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.loginService.verifyOTPAPI(encryptedPayload).subscribe({
      next: (res: any) => {
        Swal.close();

        // ============================================
        // ACTIVE SESSION
        // ============================================

        if (res?.code === 2) {
          Swal.fire({
            icon: 'warning',
            title: 'Active Session',
            text:
              res?.message ||
              res?.Message ||
              'An active session already exists. Do you want to logout from the previous session?',
            confirmButtonText: 'OK',
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then((result) => {
            if (result.isConfirmed) {
              this.resetOtpScreen();

              try {
                let data: any = CryptoHelper.decrypt(res.data);

                data = JSON.parse(data);

                this.performLogout(data.token);
              } catch (error) {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Failed to process previous session token.',
                });
              }
            }
          });

          return;
        }

        // ============================================
        // OTP SUCCESS
        // ============================================

        if (res?.code === 1 && res?.data) {
          try {
            const decrypted = CryptoHelper.decrypt(res.data);

            const loginData = JSON.parse(decrypted);

            this.resetOtpScreen();

            // IMPORTANT:
            // Existing project ka same login success flow
            this.handleSuccessResponse(loginData, res);
          } catch (error) {
            Swal.fire({
              icon: 'error',
              title: 'Login Failed',
              text: 'Unable to process OTP verification response.',
            });
          }

          return;
        }

        // ============================================
        // INVALID OTP
        // ============================================

        Swal.fire({
          icon: 'error',
          title: 'Invalid OTP',
          text: res?.message || res?.Message || 'Invalid or expired OTP.',
        });
      },

      error: (error: any) => {
        Swal.close();

        Swal.fire({
          icon: 'error',
          title: 'OTP Verification Failed',
          text: error?.error?.message || error?.message || 'Unable to verify OTP.',
        });
      },
    });
  }

  // =====================================================
  // RESET OTP SCREEN
  // =====================================================

  resetOtpScreen(): void {
    this.clearOtpTimer();

    this.otpRequired = false;

    this.otpDigits = ['', '', '', '', '', ''];
    this.otp = '';

    this.otpTimer.set(60);
    this.otpCancelEnabled.set(false);

    this.error.set(null);
  }

  // =====================================================
  // RESEND OTP
  // =====================================================

  resendOTP(): void {
    if (!this.loginReqData) {
      return;
    }

    this.loginService.loginAPI(this.loginReqData).subscribe({
      next: (res: any) => {
        if (res?.code === 1) {
          this.uniqueOtpRefId =
            Number(res?.uniqueotprefid ?? res?.Uniqueotprefid) || this.uniqueOtpRefId;

          this.startOtpTimer();

          Swal.fire({
            icon: 'success',
            title: 'OTP Sent',
            text: res?.message || 'OTP has been resent.',
            timer: 1500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Resend Failed',
            text: res?.message || 'Unable to resend OTP.',
          });
        }
      },

      error: (error: any) => {
        console.error('Resend OTP Error:', error);

        Swal.fire({
          icon: 'error',
          title: 'Resend Failed',
          text: 'Unable to resend OTP.',
        });
      },
    });
  }

  private clearLoginSession(): void {
    this.isChangePasswordModalOpen.set(false);

    this.username = '';
    this.password = '';
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';

    this.captchaInput = '';
    this.generateCaptcha();

    sessionStorage.clear();
    localStorage.removeItem('codeVerifier');
    localStorage.removeItem('menudata');

    this.router.navigate(['/login']);
  }

  /**
   * Username + Password Login
   */
  onSubmit(): void {
    this.error.set(null);

    if (!this.username || !this.username.trim()) {
      this.error.set('Please enter your User ID or Email ID.');
      return;
    }

    // Password validation
    if (!this.password) {
      this.error.set('Please enter your password.');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    // CAPTCHA validation
    if (!this.captchaInput || !this.captchaInput.trim()) {
      this.error.set('Please enter the CAPTCHA code.');
      return;
    }

    this.loading.set(true);

    // ==========================================
    // REAL ENCRYPTED API LOGIN (Users/login)
    // ==========================================
    let loginPayload: any = {
      userid: this.username.trim(),
      password: this.password,
      forceLogin: false,
      key: this.captchaKey,
      captcha: this.captchaInput.trim(),
    };
    let loginReqParam: any = JSON.stringify(loginPayload);
    loginReqParam = CryptoHelper.encrypt(loginReqParam);
    loginReqParam = JSON.stringify(loginReqParam);

    this.loginReqData = loginReqParam;

    this.loginService.loginAPI(loginReqParam).subscribe({
      next: (res: any) => {
        // console.log('Login Response:', res);
        if (res && res.code === 1 && res.data) {
          this.loading.set(false);

          try {
            const encryptData: any = res.data;

            const decrypted = CryptoHelper.decrypt(encryptData);

            const loginData = JSON.parse(decrypted);

            // =====================================================
            // GET OTP REFERENCE ID
            // =====================================================

            this.uniqueOtpRefId =
              Number(
                res?.uniqueotprefid ??
                  res?.Uniqueotprefid ??
                  loginData?.uniqueotprefid ??
                  loginData?.Uniqueotprefid,
              ) || 0;

            // =====================================================
            // CHECK OTP REQUIRED
            // =====================================================

            const isOtpRequired =
              res?.otp === true ||
              res?.OTP === true ||
              res?.otp === 1 ||
              res?.OTP === 1 ||
              String(res?.otp).toLowerCase() === 'true' ||
              String(res?.OTP).toLowerCase() === 'true' ||
              loginData?.otp === true ||
              loginData?.OTP === true ||
              loginData?.otp === 1 ||
              loginData?.OTP === 1 ||
              String(loginData?.otp).toLowerCase() === 'true' ||
              String(loginData?.OTP).toLowerCase() === 'true' ||
              String(res?.message ?? '')
                .toLowerCase()
                .includes('otp verification required');

            // =====================================================
            // OTP REQUIRED
            // =====================================================

            if (isOtpRequired) {
              this.openOtpPopup();

              return;
            }

            // =====================================================
            // OTP NOT REQUIRED
            // NORMAL LOGIN
            // =====================================================

            this.handleSuccessResponse(loginData, res);
          } catch (e) {
            this.loading.set(false);

            this.error.set('Failed to parse login response');

            this.generateCaptcha();
          }
        } else if (res && res.code === 2) {
          this.loading.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Login',
            text:
              res.message ||
              'Active session exists. Do you want to logout from all previous instances before logging in?',
            confirmButtonText: 'Login',
            showCancelButton: true,
          }).then((result) => {
            if (result.isConfirmed) {
              try {
                let data: any = CryptoHelper.decrypt(res.data);
                data = JSON.parse(data);
                this.performLogout(data.token);
              } catch (e) {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Failed to process previous session token.',
                });
              }
            } else {
              this.username = '';
              this.password = '';
              this.captchaInput = '';
              this.generateCaptcha();
            }
          });
        } else {
          this.loading.set(false);
          this.username = '';
          this.password = '';
          this.captchaInput = '';
          this.generateCaptcha();
          this.error.set(res?.message || 'Login failed. Please verify your credentials.');
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: res?.message || 'Login failed. Please verify your credentials.',
          });
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.username = '';
        this.password = '';
        this.captchaInput = '';
        this.generateCaptcha();
        this.error.set('Server connection failed. Please try again later.');
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: 'Server connection failed',
        });
      },
    });
  }
}
