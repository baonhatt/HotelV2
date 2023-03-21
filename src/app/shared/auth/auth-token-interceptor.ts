import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { AuthService } from './auth.service';
import { TokenModel } from './token-model';
import { User } from '../../user/user';
import { Token } from '@angular/compiler';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  constructor(
    private jwtHelper: JwtHelperService,
    private authService: AuthService,
    private router: Router
  ) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    let authReq = req;
    const localStorageTokens = localStorage.getItem('token');
    if (localStorageTokens != null) {
      const token = JSON.parse(localStorageTokens) as TokenModel;
      authReq = req.clone({
        headers: req.headers.set(
          'Authorization',
          `bearer ${token.accessToken}`
        ),
      });
    }
    console.log(1);

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!authReq.url.includes('Login') && error.status === 401) {
          console.log(2);
          return this.handle401Error(authReq, next);
        }
        return throwError(error);
      })
    );
  }
  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      const localStorageTokens = localStorage.getItem('token');
      var token: TokenModel;
      if (localStorageTokens != null) {
        token = JSON.parse(localStorageTokens) as TokenModel;
        return this.authService.refreshToken(token).pipe(
          switchMap((tokenNew: TokenModel) => {
            this.isRefreshing = false;
            localStorage.setItem('token', JSON.stringify(tokenNew));
            this.refreshTokenSubject.next(tokenNew.accessToken);
            return next.handle(
              this.addTokenHeader(request, tokenNew.accessToken)
            );
          }),
          catchError((err) => {
            this.isRefreshing = false;
            this.authService.logout();
            return throwError(err);
          })
        );
      }
    }

    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string) {
    /* for Spring Boot back-end */
    // return request.clone({ headers: request.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token) });

    /* for Node.js Express back-end */
    return request.clone({
      headers: request.headers.set('Authorization', `bearer ${token}`),
    });
  }
}
