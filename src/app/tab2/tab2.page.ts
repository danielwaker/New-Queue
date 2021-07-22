import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
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
  private readonly offset_ = 'offset';
  private readonly queue_endpoint = 'https://api.spotify.com/v1/me/player/queue?';
  private readonly uri = 'uri';
  private readonly devices_endpoint = 'https://api.spotify.com/v1/me/player/devices';
  public tracks: SpotifyApi.TrackObjectFull[];
  public time: Date;
  public searchQueries = 1;
  public offset = 0;
  public q = '';
  public bounds = 10;

  constructor(private http: HttpClient, private alertController: AlertController, private loadingController: LoadingController) {}

  searchTrackBy(index, track:SpotifyApi.TrackObjectFull) {
    return track.id;
  }

  itemHeightFn(item, index) {
    return 81;
  }

  async loadData(ev: any) {
    console.log("load");
    this.offset += 2;
    this.tracks.push(...await this.search(this.q, this.offset));
    ev.target.complete();
  }

  async onTyping(ev: any) {
    //console.log(((ev as KeyboardEvent).target as HTMLInputElement).value);
    const q: string = ev.target.value;

    if (q.length > 0) {
      this.q = q;
      this.tracks = await this.search(q, 0);
    }
    else {
      
    }
  }

  search(q, offset): Promise<SpotifyApi.TrackObjectFull[]> {
    return new Promise((resolve, reject) => {
      const tracks = new Array<SpotifyApi.TrackObjectFull>();
      for (let i = offset*50; i < (this.searchQueries+offset)*50; i+= 50) {
        this.searchQuery(q, i).subscribe((searchResults) => {
          searchResults.tracks.items.forEach((track) => tracks.push(track));
  
          if (i >= (this.searchQueries+offset - 1)*50) {
            resolve(tracks);
          }
        });
      }
    });
  }

  searchQuery(q: string, i: number) {
    let params = new HttpParams()
    .set(this.query, q)
    .set(this.type, 'track')
    .set(this.limit, '50')
    .set(this.offset_, i);

    const headers = this.headers();
    return this.http.get<SpotifyApi.TrackSearchResponse>(this.search_endpoint + params, {headers});
  }

  async queue(track: SpotifyApi.TrackObjectFull) {
    console.log(track.uri);

    const headers = this.headers();
    this.http.get<any>(this.devices_endpoint, {headers}).subscribe(async (devicesResponse: SpotifyApi.UserDevicesResponse) => {
      if (devicesResponse.devices.length > 0) {
        let params = new HttpParams()
        .set(this.uri, track.uri)
        .set("device_id", devicesResponse.devices[0].id);

        this.http.post<any>(this.queue_endpoint + params, null, {headers}).subscribe(data => {
          console.log(data);
        });
      }
      else {
        this.queueAlert();
      }
    });
  }

  async queueAlert() {
    console.log("No devices available");
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Queue unsuccessful',
      message: 'No devices available.',
      buttons: ['OK']
    });

    await alert.present();
  }

  headers(): any {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};

    return headers;
  }
}
