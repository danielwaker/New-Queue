import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { empty } from 'rxjs';

export enum PlayPause {
  play = 'play',
  pause = 'pause'
}

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {
  public isPlaying;
  public ePlayPause = PlayPause;
  public currentSong: SpotifyApi.TrackObjectFull;
  public progress: number;
  public interval: NodeJS.Timeout;
  public paused = false;
  private playerURL = 'https://api.spotify.com/v1/me/player/';
  constructor(private _http: HttpClient) { }

  ngOnInit() {
    this.setCurrentSong();
  }

  setCurrentSong() {
    const headers = this.headers(); 
    this._http.get<any>(this.playerURL, { headers }).subscribe((playback: SpotifyApi.CurrentlyPlayingObject) => {
      console.log(playback);
      this.isPlaying = playback.is_playing;
      this.currentSong = playback.item as SpotifyApi.TrackObjectFull;
      this.progress = playback.progress_ms;
      if (this.isPlaying) {
        this.startTimer(this.currentSong.duration_ms, playback.progress_ms);
      }
    });
  }

  startTimer(duration: number, progress: number) {
    this.interval = setInterval(() => {
      if (this.paused) {
        let doNothing;
      } else if ((progress + 1000) < duration) {
        progress += 1000;
        this.progress = progress;
      } else {
        this.setCurrentSong();
        clearInterval(this.interval);
      }
    },1000)
  }

  playPause(playPause: PlayPause) {
    const headers = this.headers(); 
    this._http.put<any>(this.playerURL + playPause, {}, { headers }).subscribe(() => {
      this.paused = (playPause == PlayPause.play) ? false : true;
    }, (error) => {
      const flip = (playPause == PlayPause.play) ? PlayPause.pause : PlayPause.play;
      this.paused = (playPause == PlayPause.play) ? false : true;
      this.playPause(flip);
    });
    this.isPlaying = !this.isPlaying;
  }

  nextSong() {
    const headers = this.headers(); 
    this._http.post<any>(this.playerURL + 'next', {}, { headers }).subscribe((playback: SpotifyApi.CurrentPlaybackResponse) => {
      console.log(playback);
    });
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
