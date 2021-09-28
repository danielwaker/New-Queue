import { Component, OnInit, Input } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule, Routes } from '@angular/router';
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

  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthenicateService) {
    auth.authenticatedEvent.subscribe(() => {
      console.log("User authenticated central component");
    });
   }

   ngOnInit() {
     console.log("Container init");
     console.log(new Date(+localStorage.getItem("expiration")));
     if (new Date(+localStorage.getItem("expiration")) < new Date()) {
       this.router.navigate(['/login']);
     }
   }
}
