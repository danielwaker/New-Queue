/// <reference types="@types/spotify-api" />
import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';
import { LocalStorageEnum, PlayPause } from '../enums';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {
  @Input() leader = false;
  @Input() queue: [SpotifyApi.TrackObjectFull, string][];
  @Output() skipQueue = new EventEmitter();
  public isPlaying;
  public ePlayPause = PlayPause;
  public currentSong: SpotifyApi.TrackObjectFull;
  public previousSong: SpotifyApi.TrackObjectFull;
  public progress: number;
  public progressPercent;
  public progressStopped = false;
  public startingProgress: number;
  public interval: NodeJS.Timeout;
  public paused = false;
  public isUserFlippingPlayback = false;
  private playerURL = 'https://api.spotify.com/v1/me/player/';
  constructor(private _http: HttpClient) { }

  ngOnInit() {
    //this.setCurrentSong();
    document.addEventListener("visibilitychange", async () => {
      if (!document.hidden) {
        this.refresh();
      }
    });
  }

  refresh() {
    this.currentSong = null;
    this.paused = false;
    this.setCurrentSong();
  }

  setCurrentSong(playing: SpotifyApi.TrackObjectFull = null, progress: number = 0, isPlaying: boolean = true) {
    console.log("setCurrentSong");
    if (playing == null) {
      const headers = this.headers();
      this._http.get<any>(this.playerURL, { headers }).subscribe((playback: SpotifyApi.CurrentlyPlayingObject) => {
        if (this.currentSong != null && playback.item.id == this.currentSong.id && playback.item.duration_ms == this.currentSong.duration_ms && playback.is_playing) {
          this.setCurrentSong();
        } else if (playback != null) {
          const params = {
            sessionID: localStorage.getItem(LocalStorageEnum.SessionId),
            token: localStorage.getItem(LocalStorageEnum.Token)
          };
          this._http.post(environment.apiUrl + 'Queue/NowPlaying/', {}, { params }).subscribe(data => {
            console.log(data);
          });
          this.isPlaying = playback.is_playing;
          this.currentSong = playback.item as SpotifyApi.TrackObjectFull;
          this.previousSong = this.currentSong;
          this.progress = playback.progress_ms;
          this.progressPercent = { upper: this.progress };
          console.log(playback);
          console.log("IS PLAYING", this.isPlaying);
          if (this.isPlaying && this.interval == null) {
            this.startTimer(this.currentSong.duration_ms, playback.progress_ms);
          } else {
            console.log("the else");
            clearInterval(this.interval);
            if (!this.isPlaying) {
              this.paused = true;
            }
            this.startTimer(this.currentSong.duration_ms, playback.progress_ms);
          }
        }
      });
    } else {
      this.currentSong = playing;
      //TODO: why does paused and isplaying both exist lol
      this.paused = !isPlaying;
      this.isPlaying = isPlaying;
      clearInterval(this.interval);
      this.progress = progress;
      this.progressPercent = { upper: this.progress };
      this.startTimer(this.currentSong.duration_ms, progress);
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
  }

  startTimer(duration: number, progress: number) {
    console.log("starting timer");
    this.interval = setInterval(() => {
      if (this.paused) {
        let doNothing;
        console.log("do nothing");
      } else if ((progress + 1000) < duration) {
        progress += 1000;
        this.progress = progress;
        this.progressPercent = (!this.progressStopped) ? { upper: this.progress } : this.progressPercent;
        //console.log("progressing");
      } else {
        clearInterval(this.interval);
        this.progress = 0;
        if (this.queue?.length > 0 && this.leader) {
          this.skipQueue.emit();
        } else if (this.leader) {
          this.setCurrentSong();
        }
        console.log("reset timer");
      }
    },1000);
    console.log("function end");
  }

  playPause(playPause: PlayPause) {
    const headers = this.headers();
    console.log("playpause" + playPause);
    console.log(this.playerURL + playPause);
    this.isUserFlippingPlayback = true;
    this._http.put(this.playerURL + playPause, {}, { headers, responseType: 'text' }).subscribe(() => {
      const params = {
        sessionID: localStorage.getItem(LocalStorageEnum.SessionId)
      };
      this._http.post(environment.apiUrl + 'Queue/Playback/', {}, { params }).subscribe(data => {
        console.log(data);
      });
      this.paused = (playPause == PlayPause.play) ? false : true;
      if (playPause == PlayPause.play && this.interval == null) {
        this.setCurrentSong();
      }
    }, (error) => {
      console.log("ERRORRRR", error);
      const flip = (playPause == PlayPause.play) ? PlayPause.pause : PlayPause.play;
      this.paused = (playPause == PlayPause.play) ? false : true;
      this.playPause(flip);
    });
    this.isPlaying = !this.isPlaying;
  }

  outsideUserPlayPause() {
    if (this.isUserFlippingPlayback) {
      this.isUserFlippingPlayback = false;
    } else {
      this.paused = !this.paused;
      this.isPlaying = !this.isPlaying;
    }
  }

  nextSong() {
    this.skipQueue.emit();
  }

  toggleProgress(event: any) {
    console.log("toggle", (event.detail.value as number / 100) * this.currentSong.duration_ms);
    console.log("progress stopped: ", this.progressStopped);
    this.progressStopped = !this.progressStopped;
    if (!this.progressStopped) {
      if (this.startingProgress != event.detail.value) {
        const newProgress = Math.round(event.detail.value as number);
        const headers = this.headers();
        const params = {
          position_ms: newProgress
        }
        this._http.put<any>(this.playerURL + "seek", {}, { params, headers }).subscribe((bruh) => {
          const params = {
            sessionID: localStorage.getItem(LocalStorageEnum.SessionId),
            progress: newProgress
          };
          this._http.post(environment.apiUrl + 'Queue/Progress/', {}, { params }).subscribe(data => {
            console.log(data);
          });
          clearInterval(this.interval);
          this.progress = newProgress;
          this.progressPercent = { upper: this.progress }
          this.startTimer(this.currentSong.duration_ms, this.progress);
          console.log(bruh);
        }, (error) => {
          console.log(error);
        });
      }
    } else {
      this.startingProgress = event.detail.value as number;
    }
  }

  setProgress(progress: number) {
    if (!this.leader) {
      clearInterval(this.interval);
      this.progress = progress;
      this.progressPercent = { upper: this.progress };
      this.startTimer(this.currentSong.duration_ms, this.progress);
    }
  }

  pinFormatter = (value: any) => {
    return formatDate(value,'mm:ss','en-US');
  }

  setMax() {
    return this.currentSong.duration_ms;
  }

  headers(): any {
    const bearer = 'Bearer ' + localStorage.getItem(LocalStorageEnum.Token);
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    console.log(headers);

    return headers;
  }

}
