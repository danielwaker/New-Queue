import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Router, RouterModule, Routes } from '@angular/router';
import { AuthenicateService } from '../authenicate.service';

@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
})
export class ExploreContainerComponent implements OnInit {
  @Input() name: string;
  public clientId = '5794ad59a90744c9aba2ca18cd73bc10';
  public responseType = 'token';
  public redirectUri = 'http://localhost:8100/callback';
  public state = 'secret';
  public readonly authorizeUrl = 'https://accounts.spotify.com/authorize?';
  public readonly client_id = 'client_id';
  public readonly response_type = 'response_type';
  public readonly redirect_uri	= 'redirect_uri';
  public readonly state_ = 'state';

  constructor(private http: HttpClient, private router: Router, private auth: AuthenicateService) {
    auth.authenticatedEvent.subscribe(() => {
      console.log("User authenticated central component");
    });
   }

  ngOnInit() {
    // const headers = { "Accept": "application/json",
    // "Content-Type": "application/json",
    // "Authorization": "Bearer BQAOY0bYBevPSBETxksgYkkFU7l487FyMC2-_ScBgvnGNU3ernYss6ES7GfKtqqp0Z9O9gnXBMOqVum9J-TzMAPkgn3FYUQufY3srgIq1_46cFkQTdCmTasK6vByrWMN1IHFpfogW07xuHDv9zvdEMos"};
    // this.http.get<any>('https://api.spotify.com/v1/artists/43ZHCT0cAZBISjO8DG9PnE/top-tracks?market=US', {headers}).subscribe(data => {
    //   console.log(data);
    // });


    //window.location.href = this.authorizeUrl, {params};
    // this.http.get<any>(this.authorizeUrl, {params}).subscribe(data => {
    //   console.log(data);
    // });

    console.log(localStorage.getItem('access_token'));
  }

  Login() {
    let params = new HttpParams()
    .set(this.client_id, this.clientId)
    .set(this.response_type, this.responseType)
    .set(this.redirect_uri, this.redirectUri)
    .set(this.state_, this.state);
    window.location.href = this.authorizeUrl + params.toString();
    // var test = window.open(this.authorizeUrl + params.toString(),'_blank');
    // test.addEventListener('beforeunload', () => {
    //   console.log("window closed");
    // });
  }

  Logout() {
    localStorage.clear();
  }
}
