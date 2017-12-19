import { Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { State } from '../state/reducer';
import * as GameActions from '../state/actions/game';

import * as WebSocket from '../websocket';

@Component({
  selector: 'app-game-bid',
  templateUrl: './game-bid.component.html',
  styleUrls: ['./game-bid.component.css']
})
export class GameBidComponent {
  bidGiruda: WebSocket.Data.Giruda;
  bidScore = 13;

  constructor(private store: Store<State>) {}

  pass() {
    this.store.dispatch(
      new GameActions.Bid({
        bid: false,
      })
    );
  }

  bid() {
    this.store.dispatch(
      new GameActions.Bid({
        bid: true,
        score: this.bidScore,
        giruda: this.bidGiruda
      })
    );
  }
}
