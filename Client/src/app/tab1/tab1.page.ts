import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CreateSession } from '../interfaces';
import * as signalR from '@microsoft/signalr';  

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  public qrUrl;
  public userId;
  public sessionId;

  constructor(private _http: HttpClient) {
    
   }

  ngOnInit() {
    const connection = new signalR.HubConnectionBuilder()  
      .configureLogging(signalR.LogLevel.Information)  
      .withUrl('https://localhost:44397/' + 'notify')  
      .build();  
  
    connection.start().then(function () {  
      console.log('SignalR Connected!');  
    }).catch(function (err) {  
      return console.error(err.toString());  
    });  
  
    connection.on("BroadcastMessage", () => {  
      console.log("Notification");
      this.getQueue();
    });  
  }

  getQueue() {
    const params = {
      sessionID: localStorage.getItem('sessionId')
    };
    console.log(params);
    const test = this._http.get('https://localhost:44397/Queue/GetQueue/', { params }).subscribe(data => {
        console.log(data);
    });
  }

  createSession() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    
    this._http.get<any>('https://api.spotify.com/v1/me', {headers}).subscribe((data: SpotifyApi.UserProfileResponse) => {
      console.log(data);
      const user = data.uri;
      const params = {
        user: user
      };
      localStorage.setItem('user', user);
      this._http.get('https://localhost:44397/Queue/CreateSession/',  { params }).subscribe((data: CreateSession) => {
        console.log(data);
        this.qrUrl = 'data:image/jpeg;base64,' + data.sessionQR;
        const sessionId = data.sessionID;
        localStorage.setItem('sessionId', sessionId);
      });
    });
  }

}
