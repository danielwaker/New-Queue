import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
//import * as joe from "spotify-api";

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  private readonly search_endpoint = 'https://api.spotify.com/v1/search?';
  private readonly query = 'q';
  private readonly type = 'type';
  private readonly limit = 'limit';
  private readonly queue_endpoint = 'https://api.spotify.com/v1/me/player/queue?';
  private readonly uri = 'uri';
  public tracks: SpotifyApi.TrackObjectFull[];
  public searchToggle: boolean;
  public loadingToggle: boolean;
  public time: Date;

  constructor(private http: HttpClient) {}

  onEnter(ev: any) {
    //console.log(((ev as KeyboardEvent).target as HTMLInputElement).value);
    const q = ev.target.value;

    this.searchToggle = false;
    this.loadingToggle = true;
    this.search(q).subscribe((searchResults) => {
      this.list(searchResults);
      this.loadingToggle = false;
      this.searchToggle = true;
    });
    //setTimeout(() => {

    //}, 3000);
  }

  list(searchResults: SpotifyApi.TrackSearchResponse) {
    console.log(searchResults);
    this.tracks = searchResults.tracks.items;
    this.tracks.forEach((track: SpotifyApi.TrackObjectFull) => {
      //track.album.images[2].url
    });
  }

  search(q: string) {
    let params = new HttpParams()
    .set(this.query, q)
    .set(this.type, 'track')
    .set(this.limit, '50');

    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};

    return this.http.get<SpotifyApi.TrackSearchResponse>(this.search_endpoint + params, {headers});

    // const track = this.searchResults.tracks.items[0].uri;
    // this.queue(track);
  }

  queue(track: string) {
    let params = new HttpParams()
    .set(this.uri, track);

    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};

    this.http.post<any>(this.queue_endpoint + params, null, {headers}).subscribe(data => {
      console.log(data);
    });
  }
}
