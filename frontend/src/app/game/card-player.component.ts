import { Component, Input } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/observable/zip';

import { Store } from '@ngrx/store';

import { State } from '../state/reducer';
import { GameRoomState } from '../state/reducers/game';
import * as GameActions from '../state/actions/game';

import * as WebSocket from '../websocket';

@Component({
  selector: 'app-card-player',
  templateUrl: './card-player.component.html'
})
export class CardPlayerComponent {
  @Input()
  card: WebSocket.Data.Card;

  jokerSuit: 'G' | WebSocket.Data.CardSuit = 'G';

  giruda: Observable<WebSocket.Data.CardSuit>;
  isFirstTurn: Observable<boolean>;

  constructor(private store: Store<State>) {
    this.giruda =
      this.store.select('game')
      .filter(game => game != null && game.type === 'started' && game.state.type === 'playing')
      .map((game: any) => game.state.bid.giruda)
    // FIXME: No Giruda
      .map(giruda => giruda === 'N' ? 'S' : giruda);

    this.isFirstTurn =
      this.store.select('game')
      .filter(game => game != null && game.type === 'started' && game.state.type === 'playing')
      .map((game: any) => Object.keys(game.state.cards).length === 0);
  }

  isJokerCall(card: WebSocket.Data.Card, giruda: WebSocket.Data.Giruda): boolean {
    if (giruda === 'C') {
      return card.suit === 'H' && card.rank === '3';
    }
    return card.suit === 'C' && card.rank === '3';
  }

  isJoker(card: WebSocket.Data.Card): boolean {
    return card.rank === 'JK';
  }

  jokerCallPlay() {
    this.store.dispatch(
      new GameActions.PlayCard({
        card: this.card,
        jokerCall: true,
      })
    );
  }

  normalPlay() {
    if (this.card.rank === 'JK') {
      Observable
        .zip(
          this.giruda.first(),
          this.isFirstTurn.first(),
          (giruda, isFirstTurn) => ({ giruda, isFirstTurn })
        )
        .subscribe(({ giruda, isFirstTurn }) => {
          if (isFirstTurn) {
            const jokerSuit = this.jokerSuit === 'G' ? giruda : this.jokerSuit;
            this.store.dispatch(
              new GameActions.PlayCard({
                card: { rank: 'JK', suit: jokerSuit },
              })
            );
          } else {
            this.store.dispatch(
              new GameActions.PlayCard({ card: this.card })
            );
          }
        });
    } else {
      this.store.dispatch(
        new GameActions.PlayCard({ card: this.card })
      );
    }
  }
}
