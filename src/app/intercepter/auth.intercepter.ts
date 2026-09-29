// auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject your AuthService here
  const authService = inject(AuthService); 

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // If the backend says the token is invalid/expired
      if (error.status === 401) {
          debugger
        // Trigger the local cleanup immediately, skipping the API call
        authService.forceLocalLogout();
      }

      return throwError(() => error);
    })
  );
};