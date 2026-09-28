import { Injectable, NgZone } from '@angular/core';
import Swal from 'sweetalert2';
import { AuthService } from './auth';
import { LoginService } from './login-service';
import { CookieService } from 'ngx-cookie-service';
import { CryptoHelper } from '../helpers/crypto-helper';

@Injectable({
  providedIn: 'root',
})
export class IdleService {
  private idleTimer: any;
  private autoLogoutTimer: any;
  private readonly IDLE_TIMEOUT = 8 * 60 * 1000; // 8 minutes
  private readonly AUTO_LOGOUT_TIMEOUT = 1.5 * 60 * 1000; // 1.5 minutes
  private isPopupOpen = false;
  private boundResetTimer: any;

  constructor(
    private authService: AuthService,
    private loginService: LoginService,
    private cookieService: CookieService,
    private zone: NgZone,
  ) {
    this.boundResetTimer = this.resetTimer.bind(this);
  }

  startWatching() {
    if (typeof window === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.boundResetTimer);
      window.addEventListener('click', this.boundResetTimer);
      window.addEventListener('keydown', this.boundResetTimer);
      window.addEventListener('scroll', this.boundResetTimer, true);
    });
    this.resetTimer();
  }

  stopWatching() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('mousemove', this.boundResetTimer);
    window.removeEventListener('click', this.boundResetTimer);
    window.removeEventListener('keydown', this.boundResetTimer);
    window.removeEventListener('scroll', this.boundResetTimer, true);
    this.clearTimers();
  }

  private clearTimers() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.autoLogoutTimer) clearTimeout(this.autoLogoutTimer);
    if (this.isPopupOpen) {
      this.isPopupOpen = false;
      try {
        Swal.close();
      } catch (e) {}
    }
  }

  private resetTimer() {
    if (typeof window === 'undefined') return;
    if (!this.authService.getToken()) {
      this.clearTimers();
      return;
    }

    if (this.isPopupOpen) {
      return;
    }

    this.clearTimers();
    this.idleTimer = setTimeout(() => this.showIdlePopup(), this.IDLE_TIMEOUT);
  }

  private showIdlePopup() {
    if (!this.authService.getToken()) {
      this.clearTimers();
      return;
    }
    this.isPopupOpen = true;

    this.zone.run(() => {
      Swal.fire({
        title: 'Session Expiring',
        text: 'No activity found. Do you want to continue your session?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Keep me signed in',
        cancelButtonText: 'Log Out',
        timer: this.AUTO_LOGOUT_TIMEOUT,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        this.isPopupOpen = false;

        if (result.isConfirmed) {
          this.refreshSession();
          this.resetTimer();
        } else {
          this.performLogout();
        }
      });
    });
  }

  private refreshSession() {
    const refreshToken =
      this.authService.getRefreshToken() ||
      (typeof window !== 'undefined' ? this.cookieService.get('refreshToken') : '');
    if (refreshToken) {
      let refreshReqParam: any = {
        refreshToken: refreshToken,
      };
      refreshReqParam = JSON.stringify(refreshReqParam);
      refreshReqParam = CryptoHelper.encrypt(refreshReqParam);
      refreshReqParam = JSON.stringify(refreshReqParam);

      this.loginService.refreshTokenAPI(refreshReqParam).subscribe({
        next: (res: any) => {
          if (res && res.code === 1 && res.data) {
            try {
              let encryptData: any = res.data;
              let decrypted = CryptoHelper.decrypt(encryptData);
              let parsedData = JSON.parse(decrypted);

              if (parsedData.token) {
                this.authService.setToken(parsedData.token);
                if (typeof window !== 'undefined') {
                  const isHttps = location.protocol === 'https:';
                  this.cookieService.set(
                    'token',
                    parsedData.token,
                    1,
                    '/',
                    undefined,
                    isHttps,
                    isHttps ? 'None' : 'Lax',
                  );
                }
              }
              if (parsedData.refreshToken || parsedData.RefreshToken) {
                let newRefresh = parsedData.refreshToken || parsedData.RefreshToken;
                this.authService.setRefreshToken(newRefresh);
                if (typeof window !== 'undefined') {
                  const isHttps = location.protocol === 'https:';
                  this.cookieService.set(
                    'refreshToken',
                    newRefresh,
                    1,
                    '/',
                    undefined,
                    isHttps,
                    isHttps ? 'None' : 'Lax',
                  );
                }
              }
            } catch (e) {}
          }
        },
        error: () => {},
      });
    }
  }

  private performLogout() {
    this.authService.performLogout();
    this.stopWatching();
  }
}
