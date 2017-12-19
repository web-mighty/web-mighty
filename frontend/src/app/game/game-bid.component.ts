import { Component, ViewChild } from '@angular/core';

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

  @ViewChild('girudaS') girudaS;
  @ViewChild('girudaD') girudaD;
  @ViewChild('girudaC') girudaC;
  @ViewChild('girudaH') girudaH;
  @ViewChild('girudaN') girudaN;

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

  changeGiruda(giruda: WebSocket.Data.Giruda) {
    this.bidGiruda = giruda;

    const girudaMap = {
      'S': this.girudaS,
      'D': this.girudaD,
      'C': this.girudaC,
      'H': this.girudaH,
      'N': this.girudaN,
    };
    const girudaList = ['S', 'D', 'C', 'H', 'N'].filter(x => x !== giruda);
    for (const uncheckGiruda of girudaList) {
      girudaMap[uncheckGiruda].nativeElement.MaterialIconToggle.uncheck();
    }
    girudaMap[giruda].nativeElement.MaterialIconToggle.check();
  }
}
