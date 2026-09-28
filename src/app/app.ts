import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { BackToTopComponent } from './shared/components/back-to-top/back-to-top';
import { UnauthorizedDialogComponent } from './shared/components/unauthorized-dialog/unauthorized-dialog';
import { AccessibilityService } from './core/services/accessibility';
import { IdleService } from './services/idle-service';
import { AuthService } from './services/auth';
import { LoginService } from './services/login-service';
import { CookieService } from 'ngx-cookie-service';
import { CryptoHelper } from './helpers/crypto-helper';
import { MenuService } from './core/services/menu';
import { WordLimitService } from './services/word-limit.service';
import { HtmlSanitizerService } from './services/html-sanitizer.service';
import { PublicMenuService } from './services/public-menu';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    NavbarComponent,
    FooterComponent,
    BackToTopComponent,
    UnauthorizedDialogComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly a11y = inject(AccessibilityService);
  private readonly wordLimitService = inject(WordLimitService);
  private readonly htmlSanitizerService = inject(HtmlSanitizerService);
  private readonly publicMenuService = inject(PublicMenuService);

  readonly isCheckingWebsiteAccess = signal(true);
  readonly hasWebsiteAccess = signal(false);

  /**
   * Disable right-click globally across the entire application
   */
  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent): void {
    event.preventDefault();
  }

  constructor(
    private idleService: IdleService,
    private authService: AuthService,
    private loginService: LoginService,
    private cookieService: CookieService,
    private router: Router,
    private menuService: MenuService,
  ) {
    if (this.authService.getToken() && this.authService.getRefreshToken()) {
      this.idleService.startWatching();
    }
  }

  ngOnInit(): void {
    this.checkWebsiteAccess();

    if (typeof window === 'undefined') return;

    this.wordLimitService.init();
    this.htmlSanitizerService.init();

    const params = new URLSearchParams(window.location.search);
    let code = params?.get('code');

    // Parse code from the hash if it uses hash routing (e.g. #/callback?code=...)
    if (!code && window.location.hash) {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        code = hashParams.get('code');
      }
    }

    if (code) {
      const codeVerifier = localStorage.getItem('codeVerifier');
      const payload = {
        code: code,
        codeVerifier: codeVerifier || '',
      };

      this.loginService.janParichayCallbackAPI(payload).subscribe({
        next: (res: any) => {
          if (res && res.code === 1) {
            // console.log(res, 'resjanparichar');

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
                  return;
                }
              }
            } else {
              loginData = encryptData;
              // If it's already an object, re-encrypt it to store in sessionStorage
              encryptData = CryptoHelper.encrypt(JSON.stringify(loginData));
            }

            // console.log('Processed JanParichay Login Data:', loginData);

            // Save tokens to cookies
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
            if (loginData?.janPar && loginData?.roles[0].RoleId === 11) {
              this.cookieService.set(
                'jpAccessToken',
                loginData?.janPar?.AccessToken,
                1,
                cookieOptions.path,
                undefined,
                cookieOptions.secure,
                cookieOptions.sameSite,
              );
              this.authService.setJpAccessToken(loginData?.janPar?.AccessToken);
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

            // Clear the verifier after successful authentication

            localStorage.removeItem('codeVerifier');

            // Handle roles (fallback for Agniveer where roles is empty array [])
            let effectiveRoles: any[] = loginData?.roles;

            const lowestRole = effectiveRoles[0];

            const roleIdToSet = lowestRole?.RoleId;
            const roleNameToSet = lowestRole?.RoleName ? String(lowestRole.RoleName) : '';

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
            if (roleNameToSet) {
              sessionStorage.setItem('role_name', roleNameToSet);
            }

            // Load menu for role
            const menuReqParam: any = {
              roleId: roleIdToSet,
              roleid: roleIdToSet,
              langId: 1,
            };
            // console.log(menuReqParam, 'menuparams', effectiveRoles, 'e');
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
                this.navigateAfterLogin(lowestRole, loginData);
              },
              error: () => {
                this.menuService.refresh(true);
                this.navigateAfterLogin(lowestRole, loginData);
              },
            });
          } else {
            localStorage.removeItem('codeVerifier');
            this.router.navigate(['/unauthrize'], { replaceUrl: true });
            console.error('JanParichay verification failed:', res?.message);
          }
        },
        error: (err: any) => {
          console.error('JanParichay Verify API HTTP error:', err);
        },
      });
    }
  }

  private checkWebsiteAccess(): void {
    const currentUrl = this.router.url;

    // Sirf home page par access check
    if (currentUrl !== '/') {
      this.hasWebsiteAccess.set(true);
      this.isCheckingWebsiteAccess.set(false);
      return;
    }

    this.isCheckingWebsiteAccess.set(true);

    this.publicMenuService.checkWebsiteAccess().subscribe({
      next: (response: any) => {
        if (response?.code === 1) {
          this.hasWebsiteAccess.set(true);
        } else {
          this.hasWebsiteAccess.set(false);
        }

        this.isCheckingWebsiteAccess.set(false);
      },

      error: (error) => {
        console.error('Website Access API Error:', error);

        this.hasWebsiteAccess.set(false);
        this.isCheckingWebsiteAccess.set(false);
      },
    });
  }

  private navigateAfterLogin(lowestRole: any, loginData?: any): void {
    const roleName = String(lowestRole?.RoleName || loginData?.userType).toLowerCase();
    const isAgniveer = lowestRole?.RoleId === 11 || loginData?.userType === 'Agniveer';

    if (isAgniveer) {
      // this.router.navigate(['/dashboard-agniveer'], { replaceUrl: true });
      this.router.navigate(['/career-progression/apply'], { replaceUrl: true });
    } else {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }
}
