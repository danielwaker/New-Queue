import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {

  constructor(private _http: HttpClient) { }

  ngOnInit() {}

  play() {
    const headers = this.headers(); 
    this._http.put<any>('https://api.spotify.com/v1/me/player/play', {}, { headers }).subscribe(data => {
      console.log(data);
    });
  }
  pause() {
    console.log("test");
    const headers = this.headers();
    const test = this._http.put<any>('https://api.spotify.com/v1/me/player/pause', {}, { headers }).subscribe(data => {
      console.log(data);
    });
    console.log(test);
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
