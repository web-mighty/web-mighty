import { Component, ViewChild } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

import { Store } from '@ngrx/store';

import { State } from '../state/reducer';
import { GameRoomState } from '../state/reducers/game';
import * as GameActions from '../state/actions/game';

import * as WebSocket from '../websocket';

@Component({
  selector: 'app-friend-select',
  templateUrl: './friend-select.component.html'
})
export class FriendSelectComponent implements OnInit, OnDestroy {
  friendDecl: Observable<WebSocket.Data.Friend>;
  jokerSelected: Observable<boolean>;

  cardSelected: Observable<boolean>;

  @ViewChild('jokerCheckbox') jokerCheckbox;

  private jokerSelectedSubscription = null;

  readonly options = [
    {
      type: 'card',
      caption: 'Specify a card',
    },
    {
      type: 'player',
      caption: 'Specify a player',
    },
    {
      type: 'round',
      caption: 'Specify a round',
    },
    {
      type: 'no',
      caption: 'No Friend',
    },
  ];
  readonly rankList = [
    { name: 'A', caption: 'Ace' },
    { name: 'K', caption: 'King' },
    { name: 'Q', caption: 'Queen' },
    { name: 'J', caption: 'Jack' },
    { name: '10', caption: '10' },
    { name: '9', caption: '9' },
    { name: '8', caption: '8' },
    { name: '7', caption: '7' },
    { name: '6', caption: '6' },
    { name: '5', caption: '5' },
    { name: '4', caption: '4' },
    { name: '3', caption: '3' },
    { name: '2', caption: '2' },
  ];
  readonly suitList = [
    { name: 'S', caption: 'Spades' },
    { name: 'D', caption: 'Diamonds' },
    { name: 'C', caption: 'Clubs' },
    { name: 'H', caption: 'Hearts' },
  ];

  constructor(private store: Store<State>) {
    this.friendDecl =
      this.store.select('game')
      .filter(game => game != null && game.type === 'started' && game.state.type === 'elected')
      .filter((game: any) => game.state.friendDecl != null)
      .map((game: any) => game.state.friendDecl);

    this.jokerSelected =
      this.friendDecl
      .map(friendDecl => {
        if (friendDecl.type !== 'card') {
          return false;
        }
        return friendDecl.card.rank === 'JK';
      });

    this.cardSelected =
      this.store.select('game')
      .filter(game => game != null && game.type === 'started')
      .map((game: GameRoomState.Started) => {
        if (game.state.type !== 'elected') {
          return false;
        }
        return game.state.selectedCards.length === 3;
      });
  }

  ngOnInit() {
    this.jokerSelectedSubscription =
      this.jokerSelected
      .subscribe(jokerSelected => {
        if (this.jokerCheckbox == null) {
          return;
        }
        if (jokerSelected) {
          this.jokerCheckbox.nativeElement.MaterialCheckbox.check();
        } else {
          this.jokerCheckbox.nativeElement.MaterialCheckbox.uncheck();
        }
      });
  }

  ngOnDestroy() {
    if (this.jokerSelectedSubscription != null) {
      this.jokerSelectedSubscription.unsubscribe();
      this.jokerSelectedSubscription = null;
    }
  }

  changeType(type: WebSocket.Data.FriendType) {
    this.store.dispatch(
      new GameActions.FriendSelect.ChangeType(type)
    );
  }

  toggleJoker() {
    this.store.dispatch(
      new GameActions.FriendSelect.ToggleJoker()
    );
  }

  changeRank(rank: WebSocket.Data.CardRank) {
    this.store.dispatch(
      new GameActions.FriendSelect.ChangeCard({ rank })
    );
  }

  changeSuit(suit: WebSocket.Data.CardSuit) {
    this.store.dispatch(
      new GameActions.FriendSelect.ChangeCard({ suit })
    );
  }

  changePlayer(player: string) {
    this.store.dispatch(
      new GameActions.FriendSelect.ChangePlayer(player)
    );
  }

  changeRound(round: string) {
    if (!/^([1-9]|10)$/.test(round)) {
      return;
    }
    this.store.dispatch(
      new GameActions.FriendSelect.ChangeRound(Number(round))
    );
  }

  confirm() {
    this.store.dispatch(
      new GameActions.FriendSelect.Confirm()
    );
  }
}
