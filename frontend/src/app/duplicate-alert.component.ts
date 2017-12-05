import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { State } from './state/reducer';

import * as WebSocketActions from './state/actions/websocket';

@Component({
  selector: 'app-duplicate-alert',
  templateUrl: './duplicate-alert.component.html',
  styleUrls: ['./duplicate-alert.component.css']
})
export class DuplicateAlertComponent {
  constructor(private store: Store<State>) {}

  forceConnect() {
    this.store.dispatch(
      new WebSocketActions.Connect(true)
    );
  }
}
