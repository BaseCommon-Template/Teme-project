import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PublicMenuService {
  private readonly apiURL = environment.apiUrl.endsWith('/')
    ? environment.apiUrl
    : environment.apiUrl + '/';

  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  private readonly options = {
    headers: this.headers,
  };

  constructor(private http: HttpClient) { }

  checkWebsiteAccess() {
    return this.http
      .post(
        `${this.apiURL}PublicMenu/Public_CheckWebsiteAccess`,
        {},
        this.options
      )
      .pipe(
        catchError((error) => {
          console.error('Website Access API Error:', error);
          return throwError(() => error);
        })
      );
  }

  getTicker(): Observable<any> {
    return this.http
      .post(`${this.apiURL}PublicMenu/GetTicker`, {}, this.options)
      .pipe(
        catchError((error) => {
          console.error('GetTicker API Error:', error);
          return throwError(() => error);
        })
      );
  }
}
