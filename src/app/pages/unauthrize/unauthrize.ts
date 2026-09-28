import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-unauthrize',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthrize.html',
  styleUrl: './unauthrize.css',
})
export class UnauthrizeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cookieService = inject(CookieService, { optional: true });

  ngOnInit(): void {
    this.clearAllAuthAndStorage();
  }

  private clearAllAuthAndStorage(): void {
    // 1. Clear AuthService state (in-memory tokens, roles, idle watcher, refresh timer)
    try {
      this.authService.clear();
    } catch (e) {
      console.error('[Unauthrize] Error clearing auth service state:', e);
    }

    // 2. Clear localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch (e) {
      console.error('[Unauthrize] Error clearing localStorage:', e);
    }

    // 3. Clear sessionStorage
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.error('[Unauthrize] Error clearing sessionStorage:', e);
    }

    // 4. Clear all cookies (both via CookieService and document.cookie across all paths/domains)
    try {
      if (this.cookieService) {
        try {
          this.cookieService.deleteAll('/');
          this.cookieService.deleteAll();
        } catch {}
      }

      if (typeof document !== 'undefined' && document.cookie) {
        const cookies = document.cookie.split(';');
        const hostname =
          typeof window !== 'undefined' && window.location ? window.location.hostname : '';
        const domainParts = hostname ? hostname.split('.') : [];

        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf('=');
          const name = (eqPos > -1 ? cookie.substring(0, eqPos) : cookie).trim();
          if (!name) continue;

          // Clear root and relative paths
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; max-age=0`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; max-age=0`;

          // Clear hostname variations
          if (hostname) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}; max-age=0`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; domain=${hostname}; max-age=0`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${hostname}; max-age=0`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; domain=.${hostname}; max-age=0`;
          }

          // Clear parent domain variations
          for (let d = 0; d < domainParts.length - 1; d++) {
            const domain = '.' + domainParts.slice(d).join('.');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}; max-age=0`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=; domain=${domain}; max-age=0`;
          }

          if (this.cookieService) {
            try {
              this.cookieService.delete(name, '/');
              this.cookieService.delete(name);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error('[Unauthrize] Error clearing cookies:', e);
    }
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/userlogin']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  get isLoggedIn(): boolean {
    return false;
  }
}

