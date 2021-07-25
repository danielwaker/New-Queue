import { EventEmitter, Injectable, Output } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthenicateService {

  constructor() { }

  @Output() authenticatedEvent = new EventEmitter<void>();

  public Authenticated() {
    this.authenticatedEvent.emit();
    console.log("service emitted");
  }
}
