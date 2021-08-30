import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, NavigationEnd, Router, RouterEvent, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenicateService } from '../authenicate.service';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'],
})
export class CallbackComponent implements OnInit, CanActivate {
  private backFlag = true;
  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthenicateService, private location: Location, private _http: HttpClient) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    if (this.backFlag) {
      if (route.queryParamMap.has("access_token")) {
        return true;
      }
    } else {
      const token = route.fragment;
      const test: URLSearchParams = new URLSearchParams(token);
      return (test.has("access_token") && test.get("state") == "secret") ? true : false;
    }

    this.router.events.subscribe(event => {
      console.log("event: " + event);
      if (event instanceof NavigationEnd) {
        console.log(event.urlAfterRedirects);
      }
    });
    console.log(this.location);
    console.log(route.queryParams);
    console.log(route);
    console.log(state);
    return true;
  }

  public ngOnInit():void {
    // this.auth.authenticatedEvent.subscribe(() => {
    //   console.log("User authenticated callback component");
    // });
    let token;
    let test;
    if (this.backFlag) {
      test = this.route.snapshot.queryParams;
      for (let key in test) {
        localStorage.setItem(key, test[key]);
        console.log("value: " + test[key]);
        console.log("key: " + key);
    }
    
    } else {
      token = this.route.snapshot.fragment;
      console.log(token);
      test = new URLSearchParams(token);
      test.forEach((value, key) => {
        localStorage.setItem(key, value);
        console.log("value: " + value);
        console.log("key: " + key);
      });
    }
    console.log(test);

    if (localStorage.getItem("expires_in") != null) {
      this.expiration();
    }
    
    this.auth.Authenticated();
    console.log("emitted");
    //window.close();
    this.router.navigate(['./tabs']);
  }

  expiration() {
    var expiration = new Date();
    expiration.setSeconds(new Date().getSeconds() + +localStorage.getItem("expires_in"));
    console.log(expiration.getTime());
    localStorage.setItem("expiration", expiration.getTime().toString());
  }
}
