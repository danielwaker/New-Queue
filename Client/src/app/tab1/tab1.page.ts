/// <reference types="@types/spotify-api" />
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CreateSession, Song, User } from '../interfaces';
import * as signalR from '@microsoft/signalr';  
import { PlayerComponent } from '../player/player.component';
import { environment } from 'src/environments/environment';
import { SessionEnum, LocalStorageEnum, ShowOrHide } from '../enums';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { Clipboard } from '@awesome-cordova-plugins/clipboard/ngx';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
  @ViewChild(PlayerComponent) player: PlayerComponent;

  public qrUrl;
  public connection: signalR.HubConnection;
  public queue: [SpotifyApi.TrackObjectFull, string][];
  public users: Record<string,User>;
  public queueStarted = false;
  public leader = false;
  public sessionStatus = SessionEnum.Create;
  public showQr = false;
  public showOrHide = ShowOrHide.Show;

  constructor(private platform: Platform, private _http: HttpClient, private alertController: AlertController, private toastController: ToastController, private clipboard: Clipboard) { }

  ngOnInit() {
    this.platform.resume.subscribe(async (res) => {
      const toast = await this.toastController.create({
        header: 'Resumed.',
        duration: 5000,
        buttons: ['Dismiss']
      });
      await toast.present();
    });
    if (localStorage.getItem('sessionId')) {
      this.getUsers(true);
      this.qrUrl = localStorage.getItem('qr');
    } else {
      this.leader = true;
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
      localStorage.setItem(LocalStorageEnum.User, user.display_name);
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
        this.sessionStatus = (this.leader) ? SessionEnum.End : SessionEnum.Leave;
        if (getQueue) {
          this.getQueue();
        }
      }
    });
  }

  async session() {
    if (this.sessionStatus === SessionEnum.Create) {
      await this.createSession();
      this.sessionStatus = SessionEnum.End;
    } else {
      this.leaveSession(this.sessionStatus === SessionEnum.End);
      this.sessionStatus = SessionEnum.Create;
    }
  }

  async createSession() {
    await this.createQueueAlert();
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    
    let user = await this.spotifyUser();
    localStorage.setItem(LocalStorageEnum.User, user.display_name);
    const params = {
      user: localStorage.getItem('user'),
      connectionID: this.connection.connectionId
    };
    this._http.get(environment.apiUrl + 'Queue/CreateSession/',  { params }).subscribe((data: CreateSession) => {
      console.log(data);
      this.qrUrl = 'data:image/jpeg;base64,' + data.sessionQR;
      this.showQr = true;
      this.showOrHide = ShowOrHide.Hide;
      localStorage.setItem(LocalStorageEnum.Qr, this.qrUrl);
      const sessionId = data.sessionID;
      localStorage.setItem(LocalStorageEnum.SessionId, sessionId);
      this.getUsers();
    });
  }

  async createQueueAlert() {
    const alert = await this.alertController.create({
      message: 'Please remove any items from the queue in your Spotify app before starting queue.',
      buttons: ['OK']
    });

    await alert.present();
  }

  async qrAlert() {
    const alert = await this.alertController.create({
      message: `<img src="${this.qrUrl}"/>`,
      buttons: ['OK']
    });
    await alert.present();
    
    const toast = await this.toastController.create({
      header: 'Copied invite to clipboard.',
      duration: 5000,
      buttons: ['Dismiss']
    });
    await toast.present();
  }

  // TODO: Remove user from list of users when leaving
  leaveSession(end = false) {
    if (end) {
      const params = {
        sessionID: localStorage.getItem('sessionId')
      };
      this._http.post(environment.apiUrl + 'Queue/EndSession/', {}, { params }).subscribe(data => {
        console.log(data);
      });
    }
    localStorage.removeItem(LocalStorageEnum.Qr);
    localStorage.removeItem(LocalStorageEnum.SessionId);
    location.reload();
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

  toggleQr() {
    if (!this.showQr) {
      this.qrAlert();
      const inviteUrl =  window.location.origin + `/login?sessionID=${localStorage.getItem(LocalStorageEnum.SessionId)}`;
      this.clipboard.copy(inviteUrl);
      navigator.clipboard.writeText(inviteUrl);
    } else {
      this.showQr = !this.showQr;
      this.showOrHide = (this.showQr) ? ShowOrHide.Hide : ShowOrHide.Show;
    }
  }

  refresh() {
    this.player.refresh();
  }
}
