/// <reference types="@types/spotify-api" />
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { empty } from 'rxjs';
import { PlayPause } from '../enums';

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
  public interval: NodeJS.Timeout;
  public paused = false;
  private playerURL = 'https://api.spotify.com/v1/me/player/';
  constructor(private _http: HttpClient) { }

  ngOnInit() {
    this.setCurrentSong();
  }

  refresh() {
    this.currentSong = null;
    this.paused = false;
    this.setCurrentSong();
  }

  setCurrentSong(playing: SpotifyApi.TrackObjectFull = null) {
    if (playing == null) {
      const headers = this.headers(); 
      this._http.get<any>(this.playerURL, { headers }).subscribe((playback: SpotifyApi.CurrentlyPlayingObject) => {
        if (this.currentSong != null && playback.item.id == this.currentSong.id && playback.item.duration_ms == this.currentSong.duration_ms) {
          this.setCurrentSong();
          return;
        } else if (playback == null) {
          return;
        }
        this.isPlaying = playback.is_playing;
        this.currentSong = playback.item as SpotifyApi.TrackObjectFull;
        this.previousSong = this.currentSong;
        this.progress = playback.progress_ms;
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
      });
    } else {
      this.currentSong = playing;
      //TODO: why does paused and isplaying both exist lol
      this.paused = false;
      this.isPlaying = true;
      clearInterval(this.interval);
      this.progress = 0;
      this.startTimer(this.currentSong.duration_ms, 0);
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
        //console.log("progressing");
      } else {
        clearInterval(this.interval);
        this.progress = 0;
        if (this.queue.length > 0) {
          this.skipQueue.emit();
        } else {
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
    this._http.put<any>(this.playerURL + playPause, {}, { headers }).subscribe(() => {
      this.paused = (playPause == PlayPause.play) ? false : true;
      if (playPause == PlayPause.play && this.interval == null) {
        this.setCurrentSong();
      }
    }, (error) => {
      const flip = (playPause == PlayPause.play) ? PlayPause.pause : PlayPause.play;
      this.paused = (playPause == PlayPause.play) ? false : true;
      this.playPause(flip);
    });
    this.isPlaying = !this.isPlaying;
  }

  nextSong() {
    this.skipQueue.emit();
  }

  headers(): any {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    console.log(headers);

    return headers;
  }

}
