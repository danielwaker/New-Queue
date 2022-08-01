/// <reference types="@types/spotify-api" />
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

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
  public player: Spotify.Player;

  constructor(private http: HttpClient, private router: Router, private _renderer2: Renderer2, 
    @Inject(DOCUMENT) private _document: Document
) {}

  ngOnInit() {
    let script = this._renderer2.createElement('script');
    //script.type = `application/ld+json`;
    script.src = 'https://sdk.scdn.co/spotify-player.js';

    this._renderer2.appendChild(this._document.body, script);
    this.webSdk();
  }

  webSdk() {
    window.onSpotifyWebPlaybackSDKReady = async () => {
      const token = 'BQDFRU0D2aNOQrkRU4NWkcQnX0xyTGJqxGSUERXUMa8XGLhPaN7KIJZH4bWBvaPnyax8-_Wwpb1vC2fwqf5BOeCu2ll8tzFdjVr6_32EZZhlfhWwQPRrGerymekB--9lHXrNDEpKTAA1ltTiKIRrQ3wCG2z-sp0rm4GjTavgBXxbwFPUdmNfg9k2F0GTblOtrIvb';
      const player = new Spotify.Player({
          name: 'Web Playback SDK Quick Start Player',
          getOAuthToken: cb => { cb(localStorage.getItem('access_token')); },
          volume: 0.5
      });

      // Ready
      player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline', device_id);
      });

      player.addListener('initialization_error', ({ message }) => {
          console.error(message);
      });

      player.addListener('authentication_error', ({ message }) => {
          console.error(message);
      });

      player.addListener('account_error', ({ message }) => {
          console.error(message);
      });

      const test = await player.connect();
      console.log(test);

      this.player = player;
    }
  }

  togglePlay() {
    this.player.togglePlay();
  }

  nextTrack() {
    this.player.nextTrack();
  }

  previousTrack() {
    this.player.previousTrack();
  }

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
        this.log += `Name: ${device.name} \nType: ${device.type} \nID: ${device.id} \nActive: ${device.is_active}\n`;
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
    this.http.get<any>(environment.apiUrl + 'WeatherForecast/', {headers}).subscribe((data) => {
      console.log(data);
      this.backendLog = data;
    }, (error) => {
      console.log(error);
      this.backendLog = error;
    });
  }
}
