import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { TokenModel } from './token.model';
import { User } from './user.model';
import { StorageService } from './storage.service';
import { NgToastService } from 'ng-angular-popup'
import { environment } from '../../environments/environment.development';
// import { TranslateService } from "@ngx-translate/core";

@Injectable({
  providedIn: 'root',
})
export class AuthService {


  email: any;

  jwtService: JwtHelperService = new JwtHelperService();
  constructor(private http: HttpClient, private storage: StorageService, private jwtHelper: JwtHelperService, private toast: NgToastService) { }
  userProfile = new BehaviorSubject<User | null>(null);
  login(email: string, password: string) {
    const body = {
      email: email,
      password: password,
    };
    return this.http.post<any>(environment.BASE_URL_API + '/user/login', body).pipe(
      tap((response) => {


        let token = response as TokenModel;
        this.storage.setToken(token);
        var claims = JSON.stringify(this.jwtService.decodeToken(token.accessToken));
        var userInfo = JSON.parse(claims.replaceAll("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/","")) as User;
        this.userProfile.next(userInfo);
        return true;
      }),
      catchError((error) => {
        error.
          this.toast.error({ detail: "Error Message", summary: " Please check your email or password again!", duration: 5000 })
        return of(false);
      }),
    );
  }

  refreshToken(login: TokenModel) {
    return this.http.post<TokenModel>(
      environment.BASE_URL_API + '/api/Token/Refresh',
      login
    );
  }

  logout(): void {
    // Xóa thông tin người dùng khỏi localStorage hoặc sessionStorage khi đăng xuất
    localStorage.removeItem('token');
  }

  isLoggedIn(): boolean {
    // Kiểm tra xem có thông tin người dùng nào được lưu trữ trong localStorage hoặc sessionStorage hay không
    if (this.getLoggedInUser() == null) return false;
    return true;
  }

  getLoggedInUser(): any {
    // Lấy thông tin người dùng đã đăng nhập từ localStorage hoặc sessionStorage
    var token = localStorage.getItem('token');
    if (token) {
      var tokenModel = JSON.parse(token) as TokenModel;
      var claims = JSON.stringify(this.jwtService.decodeToken(tokenModel.accessToken));
      var userInfo = JSON.parse(claims.replaceAll("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/","")) as User;
      return userInfo.name;
    }
    return null;
  }

  public checkAccessTokenAndRefresh(): { status: "", token: "" } {
    const localStorageTokens = localStorage.getItem('token');
    var check = true;
    if (localStorageTokens) {
      var token = JSON.parse(localStorageTokens) as TokenModel;
      var isTokenExpired = this.jwtHelper.isTokenExpired(token.accessToken);
      if (isTokenExpired) {
        this.refreshToken(token).subscribe(
          (tokenNew: TokenModel) => {
            localStorage.setItem('token', JSON.stringify(tokenNew));
            return Object({
              status: check,
              token: tokenNew,
            });
          },
          err => {
            this.logout();
            check = false;
          }
        );
      }
    } else {
      check = false;
    }
    return Object({
      status: check,
    });
  }

  requestChangePassword(email:string, clientURI:string) : Observable<any>{
    return this.http.post(`${environment.BASE_URL_API}/api/Authen/RequestChangePassword`,{email, clientURI})
  }

  // validateResetToken(token: string) {
  //   return this.http.post(`${environment.BASE_URL_API}/validate-reset-token`, { token });
  // }

  changePassword(token: string, newPassword: string, confirmNewPassword: string, email:string): Observable<any> {
    return this.http.post(`${environment.BASE_URL_API}/api/Authen/ConfirmChangePassword`, { token, newPassword, confirmNewPassword, email });
  }

}
