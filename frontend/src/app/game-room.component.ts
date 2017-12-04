import { Component } from '@angular/core';
import { OnInit, OnDestroy } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/ignoreElements';
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
  private subscription;

  roomId: string;
  roomData: WebSocket.Data.Room;

  constructor(
    private store: Store<State>,
    private route: ActivatedRoute,
  ) {}

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
}
