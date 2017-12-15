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

  roomId: string;
  roomData: WebSocket.Data.Room;
  myUsername: string | null = null;

  constructor(
    private store: Store<State>,
    private route: ActivatedRoute,
  ) {}

  get readyStatus() {
    if (this.myUsername === null) {
      return false;
    }

    return (
      this.roomData.players
      .find(player => player.username === this.myUsername)
      .ready
    );
  }

  ngOnInit() {
    const joinedRoomId =
      this.store.select('game')
      .map(game => {
        if (game == null) {
          return '';
        }
        if (game.room != null) {
          return game.room.room_id;
        }
        if (game.joiningTo != null) {
          return game.joiningTo;
        }
        return '';
      });
    const roomId = this.route.paramMap.map(params => params.get('roomId'));

    const action =
      Observable.combineLatest(
        joinedRoomId.first(),
        roomId,
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

    this.userNameSubscription =
      this.store.select('user', 'authUser')
      .filter(user => user != null)
      .subscribe(user => this.myUsername = user.username);

    this.readyTogglerSubscription =
      this.readyToggler
      .subscribe(_ => {
        this.store.dispatch(
          new GameActions.Ready(!this.readyStatus)
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
    this.roomIdSubscription = roomId.subscribe(roomId => this.roomId = roomId);
    this.roomDataSubscription =
      this.store.select('game', 'room')
      .subscribe(room => this.roomData = room);
  }

  ngOnDestroy() {
    if (this.subscription != null) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.roomIdSubscription != null) {
      this.roomIdSubscription.unsubscribe();
      this.roomIdSubscription = null;
    }
    if (this.roomDataSubscription != null) {
      this.roomDataSubscription.unsubscribe();
      this.roomDataSubscription = null;
    }
    if (this.userNameSubscription != null) {
      this.userNameSubscription.unsubscribe();
      this.userNameSubscription = null;
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
        if (game.joiningTo !== null) {
          return false;
        }
        return true;
      })
      .map(game => {
        return game.room !== null;
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
}
