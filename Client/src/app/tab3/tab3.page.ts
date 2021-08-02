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
  // public testLogs = {
  //   log: '',
  //   backendLog: '',
  //   image: ''
  // }
  public log;
  public backendLog;
  public image;

  constructor(private http: HttpClient, private router: Router) {}

  devices() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { 
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": bearer
    };

    this.log = '';
    this.http.get<any>(this.devices_endpoint, {headers}).subscribe((data: SpotifyApi.UserDevicesResponse) => {
      console.log(data);
      data.devices.forEach((device: SpotifyApi.UserDevice) => {
        this.log += `Name: ${device.name} \nType: ${device.type} \nID: ${device.id} \nActive: ${device.is_active}`;
      });
    });
  }

  loginPage() {
    this.router.navigateByUrl('/login');
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.log);
  }

  backendWeatherForecast() {
    const headers = {
      // 'Access-Control-Allow-Origin' : '*',
      // 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT'
    }
    this.log = '';
    this.http.get<any>('https://localhost:44397/WeatherForecast/', {headers}).subscribe((data) => {
      console.log(data);
      this.backendLog = data;
    }, (error) => {
      console.log(error);
      this.backendLog = error;
    });
  }

  createSession() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    
    this.http.get<any>('https://api.spotify.com/v1/me', {headers}).subscribe((data: SpotifyApi.UserProfileResponse) => {
      console.log(data);
      this.log = data.uri;
      const user = 'joe';
      const params = {
        user: user
      };
      this.http.get('https://localhost:44397/Queue/CreateSession/',  { params, responseType: 'text'}).subscribe((data) => {
        console.log(data);
        this.image = 'data:image/jpeg;base64,' + data;
      });
    });
  }
}
