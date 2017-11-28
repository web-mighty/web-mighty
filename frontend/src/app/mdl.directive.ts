import { Directive, AfterViewChecked } from '@angular/core';
declare var componentHandler: any;

@Directive({
  selector: '[mdl]'
})
export class MdlDirective implements AfterViewChecked{
  ngAfterViewChecked() {
    componentHandler.upgradeAllRegistered();
  }
}
