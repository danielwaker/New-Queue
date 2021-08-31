import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CreateSession, Song, User } from '../interfaces';
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
  public users: Record<string,User>;
  public queueStarted = false;

  constructor(private _http: HttpClient) { }

  ngOnInit() {
    if (localStorage.getItem('sessionId')) {
      this.getUsers(true);
    }
    this.connection = new signalR.HubConnectionBuilder()  
      .configureLogging(signalR.LogLevel.Information)  
      .withUrl('https://localhost:44397/' + 'notify')  
      .build();
  
    this.connection.start().then(() => {  
      console.log('SignalR Connected!');  
    }).catch(function (err) {  
      return console.error(err.toString());  
    });
  
    this.connection.on("BroadcastQueue", () => {  
      console.log("Notification");
      this.getQueue();
    });
    
    this.connection.on("BroadcastUsers", () => {  
      console.log("Notification");
      this.getUsers();
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
      console.log(this.queue);
    });
  }

  getUsers(getQueue: boolean = false) {
    const params = {
      sessionID: localStorage.getItem('sessionId')
    };
    console.log(params);
    this._http.get('https://localhost:44397/Queue/GetUsers/', { params }).subscribe((data: Record<string,User>) => {
      this.users = data;
      console.log(data);
      if (getQueue) {
        this.getQueue();
      }
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
        this.getUsers();
      });
    });
  }

  removeSong(index: number) {
    const params = {
      sessionID: localStorage.getItem('sessionId'),
      songIndex: index
    };
    this._http.post('https://localhost:44397/Queue/RemoveSong/', {}, { params }).subscribe((data) => {
      console.log(data);
      this.queue.splice(index, 1);
    });
  }

  getColor(user: string, el: any) {
    el.el.style.setProperty('--background', this.users[user].color);
  }
}
