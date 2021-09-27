import { Directive, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[appColor]'
})
export class ColorDirective {

  @Output('appColor') initEvent: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    console.log("emitting");
    this.initEvent.emit();
  }

}
