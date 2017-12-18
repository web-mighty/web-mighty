import { Component } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/ignoreElements';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/mergeAll';
import 'rxjs/add/operator/first';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/concat';

import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { State } from '../state/reducer';
import { MightyState, GameRoomState } from '../state/reducers/game';
import * as RouterActions from '../state/actions/router';
import * as GameActions from '../state/actions/game';

import * as WebSocket from '../websocket';

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html',
  styleUrls: ['./game-room.component.css']
})
export class GameRoomComponent implements OnInit, OnDestroy {
  private roomIdSubscription;
  private roomDataSubscription;
  private userNameSubscription;
  private subscription;
  private readyTogglerSubscription;

  private readyToggler = new Subject();
  private selectedCardObs = new Subject();

  roomId: Observable<string>;
  currentScene: Observable<string>;
  roomData: Observable<WebSocket.Data.Room | null>;
  playerList: Observable<WebSocket.Data.RoomPlayer[] | null>;
  hand: Observable<WebSocket.Data.Card[] | null>;
  selectedCards: Observable<WebSocket.Data.Card[]>;
  myUsername: Observable<string | null>;

  gameProgressState: Observable<string>;

  readyStatus: Observable<boolean>;
  isHost: Observable<boolean>;
  isStartable: Observable<boolean>;

  turnOf: Observable<string | null>;
  isMyTurn: Observable<boolean>;

  bidHistory: Observable<MightyState.BidHistory | null>;

  bid: Observable<WebSocket.Data.BidCore | null>;
  friendDecl: Observable<WebSocket.Data.Friend>;
  friend: Observable<string | null>;

  gameResult: Observable<WebSocket.Data.GameResult>;
  resultCalc: Observable<any>;

  cardToString(card: WebSocket.Data.Card): string {
    if (card.rank === 'JK') {
      return 'Joker';
    }
    let suitIcon;
    switch (card.suit) {
      case 'S':
        suitIcon = '♠';
        break;
      case 'D':
        suitIcon = '♦';
        break;
      case 'C':
        suitIcon = '♣';
        break;
      case 'H':
        suitIcon = '♥';
        break;
    }

    return `${card.rank}${suitIcon}`;
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

  bidToString(bid: WebSocket.Data.Bid): string {
    if (bid.bid === false) {
      return 'Withdraw';
    }
    return this.bidCoreToString(bid);
  }
  bidCoreToString(bid: WebSocket.Data.BidCore): string {
    let girudaString;
    switch (bid.giruda) {
      case 'S':
        girudaString = 'Spades';
        break;
      case 'D':
        girudaString = 'Diamonds';
        break;
      case 'C':
        girudaString = 'Clubs';
        break;
      case 'H':
        girudaString = 'Hearts';
        break;
      case 'N':
        girudaString = 'No Giruda';
        break;
    }
    return `${girudaString} ${bid.score}`;
  }

  friendDeclToString(friendDecl: WebSocket.Data.Friend): string {
    switch (friendDecl.type) {
      case 'no':
        return 'None';
      case 'card':
        return this.cardToString(friendDecl.card);
      case 'player':
        return friendDecl.player;
      case 'round': {
        const {round} = friendDecl;
        let order = 'th';
        if (round === 1) {
          order = 'st';
        } else if (round === 2) {
          order = 'nd';
        } else if (round === 3) {
          order = 'rd';
        }
        return `${round}${order} round`;
      }
    }
  }

  constructor(
    private store: Store<State>,
    private route: ActivatedRoute,
  ) {
    const startedGameFilter =
      this.store.select('game')
      .filter(game => game != null && game.type === 'started');


    this.roomId = this.route.paramMap.map(params => params.get('roomId'));

    this.currentScene =
      this.store.select('game', 'type')
      .filter(type => type != null);

    this.roomData =
      this.store.select('game')
      .filter(game => game != null && (game.type === 'not-started' || game.type === 'started'))
      .map((game: any) => game.room);

    this.myUsername =
      this.store.select('user', 'authUser')
      .filter(user => user != null)
      .map(user => user.username);

    this.playerList =
      this.roomData
      .withLatestFrom(
        this.myUsername,
        (room, username) => {
          const players = room.players;
          const index = players.findIndex(player => player.username === username);
          return players.slice(index).concat(players.slice(0, index));
        }
      );

    this.hand =
      this.store.select('game')
      .filter(game => game != null)
      .map(game => {
        if (game.type === 'started') {
          return game.hand;
        }
        return null;
      });

    this.myUsername =
      this.store.select('user', 'authUser')
      .filter(user => user != null)
      .map(user => user.username);

    this.gameProgressState =
      this.store.select('game')
      .filter(game => game != null)
      .filter(game => game.type === 'started')
      .map((game: any) => game.state.type);

    this.readyStatus =
      this.roomData
      .withLatestFrom(
        this.myUsername,
        (room, username) => {
          if (room === null) {
            return false;
          }
          if (username === null) {
            return false;
          }

          return (
            room.players
            .find(player => player.username === username)
            .ready
          );
        }
      );

    this.isHost =
      this.roomData
      .withLatestFrom(
        this.myUsername,
        (room, username) => {
          if (room === null) {
            return false;
          }
          if (username === null) {
            return false;
          }
          if (room.players.length === 0) {
            console.error('No players in the room. What?');
            return false;
          }

          return room.players[0].username === username;
        }
      );

    this.isStartable =
      this.roomData
      .map(room => {
        if (room === null) {
          return false;
        }
        const readyUsers = room.players.filter(player => player.ready);
        return readyUsers.length === room.player_number;
      });

    this.turnOf =
      this.store.select('game')
      .filter(game => game != null)
      .map(game => {
        if (game.type !== 'started') {
          return null;
        }
        return game.turnOf;
      });

    this.isMyTurn =
      this.turnOf
      .withLatestFrom(
        this.myUsername,
        (turnOf, username) => turnOf === username
      );

    this.selectedCards =
      Observable
      .combineLatest(
        startedGameFilter,
        this.isMyTurn,
        (game: GameRoomState.Started, isMyTurn) => {
          if (game.state.type === 'elected') {
            if (isMyTurn && game.state.selectedCards != null) {
              return Observable.of(game.state.selectedCards);
            }
          } else if (game.state.type === 'playing') {
            if (isMyTurn) {
              return this.selectedCardObs.map(x => [x]);
            }
          }
          return Observable.of([]);
        }
      )
      .mergeAll();

    this.bidHistory =
      startedGameFilter
      .map((game: GameRoomState.Started) => {
        if (game.state.type !== 'bidding') {
          return null;
        }
        return game.state.bidHistory;
      });

    this.bid =
      this.store.select('game')
      .filter(game => game != null)
      .map(game => {
        if (game.type !== 'started') {
          return null;
        }
        if (game.state.type === 'elected') {
          return game.state.result;
        }
        if (game.state.type === 'playing') {
          return game.state.bid;
        }
        return null;
      });

    this.friendDecl =
      this.store.select('game')
      .filter(game => game != null && game.type === 'started' && game.state.type === 'playing')
      .map((game: any) => game.state.friendDecl);

    this.friend =
      this.store.select('game')
      .filter(game => game != null && game.type === 'started' && game.state.type === 'playing')
      .map((game: any) => game.state.friend);

    this.gameResult =
      this.store.select('game')
      .filter(game => game != null && game.type === 'result')
      .map((game: any) => game.result);

    this.resultCalc =
      this.gameResult
      .map(result => {
        const players = Object.keys(result.scores);
        const ruling = [ result.president ];
        if (result.friend !== '') ruling.push(result.friend);
        const opposing = players.filter(x => !ruling.includes(x));

        const playerData =
          players.map(player => ({
            username: player,
            score: result.scores[player],
            team: ruling.includes(player) ? 'ruling' : 'opposing',
          }));
        const {win, bid, president, friend} = result;
        return {
          win,
          bid: this.bidCoreToString(bid),
          president,
          friend: friend || '(None)',
          playerData,
        };
      });
  }

  ngOnInit() {
    const joinedRoomId =
      this.store.select('game')
      .map(game => {
        if (game == null) {
          return '';
        }
        if (game.type === 'not-started') {
          return game.room.room_id;
        }
        if (game.type === 'joining') {
          return game.to;
        }
        return '';
      });

    const action =
      Observable.combineLatest(
        joinedRoomId.first(),
        this.roomId,
        (joinedRoomId, roomId) => {
          if (joinedRoomId === '') {
            // Not joined in; try to join (without password)
            return {
              joined: false,
              to: roomId,
            };
          }
          if (joinedRoomId === roomId) {
            // Already joined in this room
            return null;
          }
          // Joined in another room; redirect
          return {
            joined: true,
            to: joinedRoomId,
          };
        }
      )
      .filter(stat => stat != null)
      .first();

    const connected =
      this.store.select('websocket', 'connectionStatus')
      .takeWhile(stat => stat !== 'connected')
      .ignoreElements() as Observable<never>;

    this.readyTogglerSubscription =
      this.readyToggler
      .withLatestFrom(
        this.readyStatus,
        (_, ready) => ready
      )
      .subscribe(ready => {
        this.store.dispatch(
          new GameActions.Ready(!ready)
        );
      });

    this.subscription =
      Observable.concat(connected, action)
      .subscribe(stat => {
        if (stat.joined) {
          this.store.dispatch(
            new RouterActions.Go({ path: ['room', stat.to] })
          );
        } else {
          this.store.dispatch(
            new GameActions.JoinRoom({ roomId: stat.to })
          );
        }
      });
  }

  ngOnDestroy() {
    if (this.subscription != null) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.readyTogglerSubscription != null) {
      this.readyTogglerSubscription.unsubscribe();
      this.readyTogglerSubscription = null;
    }
    // If the user is trying to join, wait.
    // If the user is joined, leave.
    // Else, do not send anything.
    this.store.select('game')
      .filter(game => {
        if (game == null) {
          return false;
        }
        if (game.type === 'joining') {
          return false;
        }
        return true;
      })
      .map(game => {
        return (
          game.type !== 'leaving' &&
          game.type !== 'not-in-room'
        );
      })
      .first()
      .subscribe(joined => {
        if (joined) {
          this.store.dispatch(new GameActions.LeaveRoom());
        }
      });
  }

  toggleReady() {
    this.readyToggler.next(true);
  }

  startGame() {
    this.store.dispatch(new GameActions.Start());
  }

  selectCard(card: WebSocket.Data.Card) {
    const isPlaying =
      this.gameProgressState
      .first()
      .filter(type => type === 'playing' || type === 'elected')
      .map(type => type === 'playing');
    const isMyTurn =
      this.isMyTurn.first();

    // If this is not my turn, do nothing.
    // If I'm discarding cards, send an action.
    // If I'm playing cards, send to selectedCard.
    this.isMyTurn
      .first()
      .filter(isMyTurn => isMyTurn)
      .mergeMap(() => isPlaying)
      .subscribe(isPlaying => {
        if (isPlaying) {
          this.selectedCardObs.next(card);
        } else {
          this.store.dispatch(new GameActions.SelectCard(card));
        }
      });
  }

  addAi() {
    this.store.dispatch(
      new GameActions.AI.Add()
    );
  }

  removeAi(username: string) {
    if (username[0] !== '*') {
      return;
    }
    this.store.dispatch(
      new GameActions.AI.Remove(username)
    );
  }
}
