import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  ENVIRONMENT_INITIALIZER,
  inject,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { CookieService } from 'ngx-cookie-service';
import { routes } from './app.routes';
import { authInterceptor } from './auth-interceptor';
import { WordLimitService } from './services/word-limit.service';
import { HtmlSanitizerService } from './services/html-sanitizer.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    CookieService,
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(),
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => {
        inject(WordLimitService).init();
        inject(HtmlSanitizerService).init();
      },
    },
  ],
};

