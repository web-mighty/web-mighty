import { Component } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/combineLatest';

import { Store } from '@ngrx/store';

import { State } from '../state/reducer';

import * as WebSocket from '../websocket';

@Component({
  selector: 'app-card-view',
  templateUrl: './card-view.component.html',
  styleUrls: ['./card-view.component.css'],
})
export class CardViewComponent {
  players: Observable<string[]>;
  playedPlayers: Observable<string[] | null>;
  cards: Observable<{ [username: string]: WebSocket.Data.CardPlay } | null>;
  turnOf: Observable<string>;
  isMyTurn: Observable<boolean>;

  constructor(
    private store: Store<any>,
  ) {
    this.players =
      this.store.select('game', 'room', 'players')
      .filter(x => x != null)
      .map(players => players.map(x => x.username));
    this.cards =
      this.store.select('game', 'state', 'cards')
      .filter(x => x != null);
    this.playedPlayers =
      Observable
      .combineLatest(
        this.players,
        this.cards,
        (players, cards) =>
          players.filter(player => (player in cards))
      );
    this.turnOf =
      this.store.select('game', 'turnOf');
    this.isMyTurn =
      this.turnOf
      .withLatestFrom(
        this.store.select('user', 'authUser', 'username'),
        (turnOf, username) => turnOf === username
      );
  }

  cardToString(card: WebSocket.Data.Card): string {
    if (card.rank === 'JK') {
      return 'Joker';
    }
    return `${card.suit}${card.rank}`;
  }

  cardPlayToString(card: WebSocket.Data.CardPlay): string {
    let result = '';
    if (card.gan) result += '** ';
    result += this.cardToString(card.card);
    if (card.card.rank === 'JK' && 'suit' in card.card) {
      result += ` (${card.card.suit})`;
    }
    if (card.joker_call) {
      result += ' (Joker Call)';
    }
    return result;
  }
}
