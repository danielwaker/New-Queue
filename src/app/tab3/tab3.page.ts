import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {
  private readonly devices_endpoint = 'https://api.spotify.com/v1/me/player/devices';

  constructor(private http: HttpClient, private router: Router) {}

  devices() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};

    this.http.get<any>(this.devices_endpoint, {headers}).subscribe((data) => {
      console.log(data);
    });
  }

  loginPage() {
    this.router.navigate(['/login']);
  }
}
