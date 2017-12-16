import { Component } from '@angular/core';

import { Store } from '@ngrx/store';

import { State } from './state/reducer';
import * as GameActions from './state/actions/game';

import * as WebSocket from './websocket';

function parseBid(bid: string): WebSocket.Data.BidCore {
  const giruda: any = bid[0];
  const score: any = bid.substr(1);
  console.log(giruda, score);
  if (!['S', 'D', 'C', 'H', 'N'].includes(giruda)) {
    return null;
  }
  if (!/^[0-9]+$/.test(score)) {
    return null;
  }
  return {
    score: parseInt(score, 10),
    giruda,
  };
}

@Component({
  selector: 'app-game-bid',
  templateUrl: './game-bid.component.html'
})
export class GameBidComponent {
  bidString: string;

  constructor(private store: Store<State>) {}

  confirmBid() {
    if (this.bidString === 'pass') {
      this.store.dispatch(
        new GameActions.Bid({
          bid: false,
        })
      );
      return;
    }

    const bid = parseBid(this.bidString);
    if (bid === null) {
      return;
    }
    this.store.dispatch(
      new GameActions.Bid({
        bid: true,
        ...bid
      })
    );
  }
}
