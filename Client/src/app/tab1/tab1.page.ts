/// <reference types="@types/spotify-api" />
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { CreateSession, Song, User } from '../interfaces';
import * as signalR from '@microsoft/signalr';  
import { PlayerComponent } from '../player/player.component';
import { environment } from 'src/environments/environment';
import { SessionEnum, LocalStorageEnum, ShowOrHide } from '../enums';
import { AlertController, ItemReorderEventDetail, ToastController } from '@ionic/angular';
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
  public showUsers = false;
  public userArray: string[] = null;
  public userCount = 0;

  constructor(private _http: HttpClient, private alertController: AlertController, private toastController: ToastController, private clipboard: Clipboard) { }

  ionViewWillEnter() {
    this.leader = localStorage.getItem(LocalStorageEnum.Leader) != 'false';
  }

  ngOnInit() {

    if (localStorage.getItem(LocalStorageEnum.SessionId)) {
      if (localStorage.getItem(LocalStorageEnum.Leader) == 'true') {
        this.getUsers(true);
      }
      this.qrUrl = localStorage.getItem(LocalStorageEnum.Qr);
    } else {
      this.leader = true;
    }
    this.connection = new signalR.HubConnectionBuilder()  
      .configureLogging(signalR.LogLevel.Information)  
      .withUrl(environment.apiUrl + 'notify')  
      .build();
  
    this.connection.start().then(() => {
      console.log('SignalR Connected!');
      this.player.refresh();
      if (localStorage.getItem(LocalStorageEnum.SessionId)) {
        this.addUser();
      }
    }).catch(function (err) {  
      return console.error(err.toString());  
    });

    //NOTE: when adding a new connection, you MUST rebuild the Ionic app
  
    this.connection.on("BroadcastQueue", () => {  
      console.log("Notification");
      this.getQueue();
    });
    
    this.connection.on("BroadcastUsers", () => {  
      console.log("Notification");
      this.getUsers();
    });

    this.connection.on("BroadcastPlayback", () => {
      console.log("Notification");
      this.player.outsideUserPlayPause();
    });

    this.connection.on("BroadcastNowPlaying", (nowPlaying: any, progress: number, isPlaying: boolean) => {
      console.log("Notification");
      console.log(nowPlaying);
      if (!this.leader) {
        nowPlaying.duration_ms = nowPlaying.durationMs;
        nowPlaying = nowPlaying as SpotifyApi.TrackObjectFull;
        this.player.setCurrentSong(nowPlaying, progress, isPlaying);
        this.getQueue();
      }
    });

    this.connection.on("BroadcastProgress", (progress: number) => {
      console.log("Notification");
      this.player.setProgress(progress);
    });

    this.connection.on("BroadcastEnd", () => {
      console.log("Notification");
      this.leaveSession();
    });
  }

  async addUser() {
    let reconnect = false;
    if (localStorage.getItem(LocalStorageEnum.User)) {
      reconnect = true;
    } else {
      let user = await this.spotifyUser();
      localStorage.setItem(LocalStorageEnum.User, user.display_name);
    }

    const params = {
      sessionID: localStorage.getItem(LocalStorageEnum.SessionId),
      user: localStorage.getItem(LocalStorageEnum.User),
      connectionID: this.connection.connectionId,
      reconnect: reconnect
    };
    console.log(params);
    this._http.post(environment.apiUrl + 'Queue/AddUser/', {}, { params }).subscribe((data: any) => {
      console.log(data);
      if (data.qr.length > 0) {
        this.qrUrl = 'data:image/jpeg;base64,' + data.qr;
        this.showQr = true;
        this.showOrHide = ShowOrHide.Hide;
        localStorage.setItem(LocalStorageEnum.Qr, this.qrUrl);
      }
    });
  }

  async spotifyUser() {
    const headers = this.headers();    
    return await this._http.get<SpotifyApi.UserProfileResponse>('https://api.spotify.com/v1/me', {headers}).toPromise();
  }

  getQueue() {
    const headers = this.headers();
    const params = {
      sessionID: localStorage.getItem(LocalStorageEnum.SessionId)
    };
    console.log(params);
    this._http.get(environment.apiUrl + 'Queue/GetQueue/', { params }).subscribe((songs: Song[]) => {
      let tempQueue: [SpotifyApi.TrackObjectFull, string][] = [];
      songs.forEach((song: Song) => {
        if (song.uri != null) {
          this._http.get('https://api.spotify.com/v1/tracks/' + song.uri, { headers }).subscribe((data: SpotifyApi.TrackObjectFull) => {
            const index = songs.findIndex(item => item.uri == song.uri);
            let user = songs[index].user;
            tempQueue.splice(index, 0, [data, user]);
          });
        }
      }
      );
      if (tempQueue != this.queue) {
        this.queue = tempQueue;
      }
      console.log(tempQueue);
      console.log(songs);
    });
  }

  getUsers(getQueue: boolean = false) {
    const params = {
      sessionID: localStorage.getItem(LocalStorageEnum.SessionId)
    };
    console.log(params);
    this._http.get(environment.apiUrl + 'Queue/GetUsers/', { params }).subscribe((data: Record<string,User>) => {
      this.users = data;
      this.userArray = Object.keys(this.users);
      this.userCount = this.userArray.length;
      if (data === null) {
        localStorage.removeItem("sessionId");
      } else {
        console.log(this.users)
        console.log(localStorage.getItem(LocalStorageEnum.User))
        this.leader = this.users[localStorage.getItem(LocalStorageEnum.User)].leader;
        localStorage.setItem(LocalStorageEnum.Leader, String(this.leader));
        this.sessionStatus = (this.leader) ? SessionEnum.End : SessionEnum.Leave;
        if (getQueue) {
          this.getQueue();
        }
        if (this.leader) {
          const params = {
            sessionID: localStorage.getItem(LocalStorageEnum.SessionId),
            token: localStorage.getItem(LocalStorageEnum.Token)
          };
          this._http.post(environment.apiUrl + 'Queue/NowPlaying/', {}, { params }).subscribe(data => {
            console.log(data);
          });
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
    
    let user = await this.spotifyUser();
    localStorage.setItem(LocalStorageEnum.User, user.display_name);
    const params = {
      user: localStorage.getItem(LocalStorageEnum.User),
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

  leaveSession(end = false) {
    if (end) {
      const params = {
        sessionID: localStorage.getItem(LocalStorageEnum.SessionId)
      };
      this._http.post(environment.apiUrl + 'Queue/EndSession/', {}, { params }).subscribe(data => {
        console.log(data);
      });
    } else {
      const params = {
        sessionID: localStorage.getItem(LocalStorageEnum.SessionId),
        user: localStorage.getItem(LocalStorageEnum.User),
        connectionId: this.connection.connectionId
      };
      this._http.post(environment.apiUrl + 'Queue/LeaveSession/', {}, { params }).subscribe(data => {
        console.log(data);
      });
    }
    localStorage.removeItem(LocalStorageEnum.Qr);
    localStorage.removeItem(LocalStorageEnum.SessionId);
    location.reload();
  }

  startQueue(putPlay = false) {
    if (!this.leader) {
      return;
    }
    const headers = this.headers();
    if (this.queue[0] != null) {
      const params = {
        uri: this.queue[0][0].uri
      };
      if (!this.player.isPlaying) {
        this._http.put('https://api.spotify.com/v1/me/player/play', {}, { headers, responseType: 'text'  }).subscribe((data) => {
          this.startQueueUtility(putPlay);
        });
      } else {
        this.startQueueUtility(putPlay);
      }
    } else {
      this._http.post('https://api.spotify.com/v1/me/player/next', {}, { headers, responseType: 'text'  }).subscribe((data) => {
          this.player.setCurrentSong();
        });
    }
  }

  startQueueUtility(putPlay = false) {
    const headers = this.headers();
    const body = {
      uris: [this.queue[0][0].uri]
    };
    const params = {
      uri: this.queue[0][0].uri
    };
    if (putPlay) {
      console.log(body);
      this._http.put<any>('https://api.spotify.com/v1/me/player/play', body, {  headers }).subscribe((data) => {
        console.log("PUTPLAY");
        this.player.setCurrentSong(this.queue[0][0]);
        this.removeSong(0);
      });
    } else {
      this._http.post('https://api.spotify.com/v1/me/player/queue', { }, { params, headers, responseType: 'text' }).subscribe((data) => {
        this._http.post('https://api.spotify.com/v1/me/player/next', { }, { headers, responseType: 'text'  }).subscribe((data) => {
          console.log("next");
          this.player.setCurrentSong(this.queue[0][0]);
          this.removeSong(0);
        });
      });
    }
  }

  removeSong(index: number) {
    const params = {
      sessionID: localStorage.getItem(LocalStorageEnum.SessionId),
      songIndex: index
    };
    this._http.post(environment.apiUrl + 'Queue/RemoveSong/', {}, { params }).subscribe((data) => {
      console.log(data);
      this.queue.splice(index, 1);
    });
  }

  handleReorder(ev: CustomEvent<ItemReorderEventDetail>) {
    const params = {
      sessionID: localStorage.getItem(LocalStorageEnum.SessionId),
      songIndex: ev.detail.from,
      newIndex: ev.detail.to
    };
    this._http.post(environment.apiUrl + 'Queue/ReorderQueue/', {}, { params }).subscribe((data) => {
      console.log(data);
    });
    console.log('Dragged from index', ev.detail.from, 'to', ev.detail.to);
    ev.detail.complete();
  }

  getColor(user: string, el: any) {
    el.el.style.setProperty('--background', this.users[user].color);
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

  toggleUsers() {
    this.showUsers = !this.showUsers;
  }

  refresh() {
    this.player.refresh();
  }

  headers(): any {
    const bearer = 'Bearer ' + localStorage.getItem(LocalStorageEnum.Token);
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};

    return headers;
  }

  async log(message: string) {
    const toast = await this.toastController.create({
      header: message,
      duration: 10000000,
      buttons: ['Dismiss']
    });
    await toast.present();
  }
}
