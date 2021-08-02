import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { CreateSession } from '../interfaces';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  public qrUrl;
  public userId;
  public sessionId;

  constructor(private _http: HttpClient) {
    
   }

  ngOnInit() {

  }

  createSession() {
    const bearer = 'Bearer ' + localStorage.getItem("access_token");
    const headers = { "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": bearer};
    
    this._http.get<any>('https://api.spotify.com/v1/me', {headers}).subscribe((data: SpotifyApi.UserProfileResponse) => {
      console.log(data);
      this.userId = data.uri;
      const user = 'joe';
      const params = {
        user: user
      };
      this._http.get('https://localhost:44397/Queue/CreateSession/',  { params }).subscribe((data: CreateSession) => {
        console.log(data);
        this.qrUrl = 'data:image/jpeg;base64,' + data.sessionQR;
        this.sessionId = data.sessionID;
      });
    });
  }

}
