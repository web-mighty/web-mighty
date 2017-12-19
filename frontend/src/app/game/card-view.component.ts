import { Component, Input } from '@angular/core';

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
  @Input()
  playerList: WebSocket.Data.RoomPlayer[];

  players: Observable<string[]>;
  playedPlayers: Observable<string[] | null>;
  cards: Observable<{ [username: string]: WebSocket.Data.CardPlay } | null>;
  turnOf: Observable<string>;
  isMyTurn: Observable<boolean>;

  president: Observable<string>;
  friend: Observable<string | null>;

  isJokerCall: Observable<boolean>;
  jokerSuit: Observable<WebSocket.Data.CardSuit | null>;

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
    this.president = this.store.select('game', 'state', 'president');
    this.friend = this.store.select('game', 'state', 'friend');
    this.isJokerCall = this.cards.map(cards => {
      if (cards === null) {
        return false;
      }
      return Object.values(cards).find(card => card.joker_call) != null;
    });
    this.jokerSuit = this.cards.map(cards => {
      if (cards === null) {
        return null;
      }
      const jokerCard = Object.values(cards).find(card => card.card.rank === 'JK');
      if (jokerCard == null) {
        return null;
      }
      return jokerCard.card.suit;
    });
  }

  cardToFilePath(card: WebSocket.Data.Card): string {
    if (card.rank === 'JK') {
      return 'assets/img/cards/joker.svg';
    }
    let rankString;
    let suitString;
    switch (card.rank) {
      case 'A':
        rankString = 'ace';
        break;
      case 'K':
        rankString = 'king';
        break;
      case 'Q':
        rankString = 'queen';
        break;
      case 'J':
        rankString = 'jack';
        break;
      default:
        rankString = card.rank;
    }
    switch (card.suit) {
      case 'S':
        suitString = 'spades';
        break;
      case 'D':
        suitString = 'diamonds';
        break;
      case 'C':
        suitString = 'clubs';
        break;
      case 'H':
        suitString = 'hearts';
        break;
    }

    return `assets/img/cards/${rankString}_of_${suitString}.svg`;
  }

  suitToIcon(suit: WebSocket.Data.CardSuit): string {
    switch (suit) {
      case 'S':
        return '♠';
      case 'D':
        return '♦';
      case 'C':
        return '♣';
      case 'H':
        return '♥';
    }
  }

  isBlackSuit(suit: WebSocket.Data.CardSuit) {
    return suit === 'S' || suit === 'C';
  }
}
