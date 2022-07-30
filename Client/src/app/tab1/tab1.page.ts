/// <reference types="@types/spotify-api" />
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { CreateSession, Song, User } from '../interfaces';
import * as signalR from '@microsoft/signalr';  
import { PlayerComponent } from '../player/player.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  @ViewChild(PlayerComponent) player: PlayerComponent;

  public qrUrl;
  public userId;
  public sessionId;
  public connection: signalR.HubConnection;
  public queue: [SpotifyApi.TrackObjectFull, string][];
  public users: Record<string,User>;
  public queueStarted = false;
  public leader = false;

  constructor(private _http: HttpClient) { }

  ngOnInit() {
    if (localStorage.getItem('sessionId')) {
      this.getUsers(true);
    }
    this.connection = new signalR.HubConnectionBuilder()  
      .configureLogging(signalR.LogLevel.Information)  
      .withUrl(environment.apiUrl + 'notify')  
      .build();
  
    this.connection.start().then(() => {  
      console.log('SignalR Connected!');
      if (localStorage.getItem('sessionId')) {
        this.addUser();
      }
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

  async addUser() {
    let reconnect = false;
    if (localStorage.getItem('user')) {
      reconnect = true;
    } else {
      let user = await this.spotifyUser();
      localStorage.setItem('user', user.display_name);
    }

    const params = {
      sessionID: localStorage.getItem('sessionId'),
      user: localStorage.getItem('user'),
      connectionID: this.connection.connectionId,
      reconnect: reconnect
    };
    console.log(params);
    this._http.post(environment.apiUrl + 'Queue/AddUser/', {}, { params }).subscribe(data => {
      console.log(data);
    });
  }

  async spotifyUser() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    
    return await this._http.get<SpotifyApi.UserProfileResponse>('https://api.spotify.com/v1/me', {headers}).toPromise();
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
    this._http.get(environment.apiUrl + 'Queue/GetQueue/', { params }).subscribe((data: Song[]) => {
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
    this._http.get(environment.apiUrl + 'Queue/GetUsers/', { params }).subscribe((data: Record<string,User>) => {
      this.users = data;
      if (data === null) {
        localStorage.removeItem("sessionId");
      } else {
        this.leader = this.users[localStorage.getItem('user')].Leader;
        if (getQueue) {
          this.getQueue();
        }
      }
    });
  }

  async createSession() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    
    let user = await this.spotifyUser();
    localStorage.setItem('user', user.display_name);
    const params = {
      user: localStorage.getItem('user'),
      connectionID: this.connection.connectionId
    };
    this._http.get(environment.apiUrl + 'Queue/CreateSession/',  { params }).subscribe((data: CreateSession) => {
      console.log(data);
      this.qrUrl = 'data:image/jpeg;base64,' + data.sessionQR;
      const sessionId = data.sessionID;
      localStorage.setItem('sessionId', sessionId);
      this.getUsers();
      localStorage.setItem('leader', 'true');
    });
  }

  startQueue() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    if (this.queue[0] != null) {
      const params = {
        uri: this.queue[0][0].uri
      };
      if (!this.player.isPlaying) {
        this._http.put<any>('https://api.spotify.com/v1/me/player/play', {}, { headers }).subscribe((data) => {
          this.startQueueUtility();
        });
      } else {
        this.startQueueUtility();
      }
    } else {
      this._http.post<any>('https://api.spotify.com/v1/me/player/next', {}, { headers }).subscribe((data) => {
          this.player.setCurrentSong();
        });
    }
  }

  startQueueUtility() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    const params = {
      uri: this.queue[0][0].uri
    };
    this._http.post<any>('https://api.spotify.com/v1/me/player/queue', {}, { params, headers }).subscribe((data) => {
      this._http.post<any>('https://api.spotify.com/v1/me/player/next', {}, { headers }).subscribe((data) => {
        console.log("next");
        this.player.setCurrentSong(this.queue[0][0]);
        this.removeSong(0);
      });
    });
  }

  removeSong(index: number) {
    const params = {
      sessionID: localStorage.getItem('sessionId'),
      songIndex: index
    };
    this._http.post(environment.apiUrl + 'Queue/RemoveSong/', {}, { params }).subscribe((data) => {
      console.log(data);
      this.queue.splice(index, 1);
    });
  }

  getColor(user: string, el: any) {
    el.el.style.setProperty('--background', this.users[user].Color);
  }
}
