import { Component } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/ignoreElements';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/concat';

import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { State } from './state/reducer';
import * as RouterActions from './state/actions/router';
import * as GameActions from './state/actions/game';

import * as WebSocket from './websocket';

@Component({
  selector: 'app-game-room',
  templateUrl: './game-room.component.html'
})
export class GameRoomComponent implements OnInit, OnDestroy {
  private roomIdSubscription;
  private roomDataSubscription;
  private userNameSubscription;
  private subscription;
  private readyTogglerSubscription;

  private readyToggler = new ReplaySubject(1);

  roomId: Observable<string>;
  roomData: Observable<WebSocket.Data.Room | null>;
  myUsername: Observable<string | null>;

  readyStatus: Observable<boolean>;
  isHost: Observable<boolean>;
  isStartable: Observable<boolean>;

  constructor(
    private store: Store<State>,
    private route: ActivatedRoute,
  ) {
    this.roomId = this.route.paramMap.map(params => params.get('roomId'));

    this.myUsername =
      this.store.select('user', 'authUser')
      .filter(user => user != null)
      .map(user => user.username);

    this.roomData =
      this.store.select('game')
      .map(game => {
        if (game == null) {
          return null;
        }
        if (game.type === 'not-started') {
          return game.room;
        }
        return null;
      });

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
}
