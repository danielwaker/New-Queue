import { HttpClient, HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { AlertController, IonInput, LoadingController, ToastController } from '@ionic/angular';
import { Observable } from 'rxjs';
//import * as joe from "spotify-api";

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

  private VIRTUAL_QUEUE_FLAG: boolean = true;
  
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
    console.log(q);
    if (q.length > 0) {
      this.q = q;
      this.tracks = await this.search(q, 0);
    }
    else {
      // due to await you can't necessary clear it without some workaround
      this.tracks = null;
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

  //this is just testing
  testgetsong(track: SpotifyApi.TrackObjectFull) {
    const params = {
      token: localStorage.getItem('access_token'),
      song: track.id
    };
    console.log(params);
    const test = this.http.get<any>('https://localhost:44397/Queue/GetSong/', { params }).subscribe(data => {
        console.log(data);
    });
  }

  queue(track: SpotifyApi.TrackObjectFull) {
    if (this.VIRTUAL_QUEUE_FLAG) {
      this.virtualQueue(track);
    }
    else {
      this.spotifyQueue(track);
    }
  }

  async virtualQueue(track: SpotifyApi.TrackObjectFull) {
    const headers = this.headers();
    
    const params = {
      sessionID: localStorage.getItem('sessionId'),
      user: localStorage.getItem('user'),
      uri: track.id,
      // name: track.name,
      // artist: track.artists[0].name,
      // length: track.duration_ms,
      // art: track.album.images[2].url
    };
    console.log(params);
    const test = this.http.post<any>('https://localhost:44397/Queue/AddSong/', { headers },  { params }).subscribe(data => {
        console.log(data);
    });
    console.log(test);
  }

  async spotifyQueue(track: SpotifyApi.TrackObjectFull) {
    console.log(track.uri);

    const headers = this.headers();
    let activeDevice = false;
    this.http.get<any>(this.devices_endpoint, {headers}).subscribe(async (devicesResponse: SpotifyApi.UserDevicesResponse) => {
      devicesResponse.devices.forEach((device: SpotifyApi.UserDevice) => {
        if (device.is_active) {
          activeDevice = true;
        }
      })
      if (activeDevice) {
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

  clear(inputText: IonInput) {
    inputText.value = ''; 
    inputText.setFocus();
    this.tracks = null;
  }
}
