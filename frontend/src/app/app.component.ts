import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { State } from './state/reducer';

import { MenuBarComponent } from './menu-bar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isDuplicate: Observable<boolean>;
  githubLogoPath = 'assets/img/github_logo.png';

  constructor(private store: Store<State>) {
    this.isDuplicate =
      this.store.select('websocket', 'connectionStatus')
      .map(status => status === 'duplicate');
  }
}
