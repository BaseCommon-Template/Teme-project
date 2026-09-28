import { Component } from '@angular/core';
import { LoginService } from '../../services/login-service';
import { CryptoHelper } from '../../helpers/crypto-helper';

@Component({
  selector: 'app-login-jan-parichay',
  standalone: true,
  imports: [],
  templateUrl: './login-jan-parichay.html',
  styleUrl: './login-jan-parichay.css',
})
export class LoginJanParichay {
  constructor(private loginService: LoginService) {}

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
          const newWindow = window.open(url, '_blank');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            window.location.href = url;
          }
        } else {
          console.error('No redirect URL found in the API response.');
        }
      },
      error: (err: any) => {
        console.error('JanParichay login API error:', err);
      },
    });
  }
}
