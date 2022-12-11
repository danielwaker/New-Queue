import { Component } from '@angular/core';
import { BackgroundMode } from '@awesome-cordova-plugins/background-mode/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(public backgroundMode: BackgroundMode) {
    this.backgroundMode.enable();
  }
}
