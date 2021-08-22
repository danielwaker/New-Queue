import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CreateSession, Song } from '../interfaces';
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
  public connection: signalR.HubConnection;
  public queue: [SpotifyApi.TrackObjectFull, string][];

  constructor(private _http: HttpClient) {
    
   }

  ngOnInit() {
    this.connection = new signalR.HubConnectionBuilder()  
      .configureLogging(signalR.LogLevel.Information)  
      .withUrl('https://localhost:44397/' + 'notify')  
      .build();
  
    this.connection.start().then(() => {  
      console.log('SignalR Connected!');  
    }).catch(function (err) {  
      return console.error(err.toString());  
    });  
  
    this.connection.on("BroadcastMessage", () => {  
      console.log("Notification");
      this.getQueue();
    });  
  }

  getQueue() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    const params = {
      sessionID: localStorage.getItem('sessionId')
    };
    console.log(params);
    this._http.get('https://localhost:44397/Queue/GetQueue/', { params }).subscribe((data: Song[]) => {
      this.queue = [];
      data.forEach(song => {
        if (song.uri != null) {
          this._http.get('https://api.spotify.com/v1/tracks/' + song.uri, { headers }).subscribe((data: SpotifyApi.TrackObjectFull) => {
            this.queue.push([data, song.user]);
          });
        }
      });
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
      const user = data.display_name;
      const params = {
        user: user,
        connectionID: this.connection.connectionId
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

  randomColor(): string {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
  } 


}
