
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from '../../user/user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {

    console.log("guard");
    this.auth.getaccessToken();
    var user = this.auth.userProfile.getValue();

    if ((user?.Email ?? 0) > 0) {
      // if (route.data['requiredAuth'] == false) {
      //   this.router.navigate(['/']);
      //   return false;
      // }
      return true;
    } else {
      if (route.data['requiredAuth'] == true) {
        this.router.navigate(['/login']);
        return false;
      }
      return true;
    }
  }
}