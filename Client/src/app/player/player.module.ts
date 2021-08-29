import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerComponent } from './player.component';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [ CommonModule, FormsModule, IonicModule],
  declarations: [PlayerComponent],
  exports: [PlayerComponent]
})
export class PlayerModule { }
