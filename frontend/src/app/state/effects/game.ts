import { Injectable } from '@angular/core';
import { Store, Action } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import * as WebSocket from '../../websocket';
import * as GameActions from '../actions/game';
import * as RouterActions from '../actions/router';
import * as WebSocketActions from '../actions/websocket';

@Injectable()
export class GameEffects {
  @Effect()
  joinRoom$ =
    this.actions$.ofType(GameActions.JOIN_ROOM)
    .mergeMap((action: GameActions.JoinRoom) => {
      const payload: WebSocket.Data.RoomJoin = {
        'room_id': action.payload.roomId
      };
      if (action.payload.password) {
        payload.password = action.payload.password;
      } const req = new WebSocket.Requests.RoomJoin(payload);
      return Observable.of(
        new WebSocketActions.Request(req) as Action,
        new RouterActions.Go({ path: ['room', action.payload.roomId] }) as Action
      );
    });

  @Effect()
  joinRoomFailed$ =
    this.actions$.ofType(GameActions.JOIN_ROOM_FAILED)
    .map(_ => new RouterActions.GoByUrl('lobby'));

  @Effect()
  leaveRoom$ =
    this.actions$.ofType(GameActions.LEAVE_ROOM)
    .map((action: GameActions.LeaveRoom) =>
      new WebSocketActions.Request(
        new WebSocket.Requests.RoomLeave()
      )
    );

  @Effect()
  ready$ =
    this.actions$.ofType(GameActions.READY)
    .map((action: GameActions.Ready) =>
      new WebSocketActions.Request(
        new WebSocket.Requests.RoomReady(action.ready)
      )
    );

  @Effect()
  start$ =
    this.actions$.ofType(GameActions.START)
    .map(() =>
      new WebSocketActions.Request(
        new WebSocket.Requests.RoomStart()
      )
    );

  @Effect()
  bid$ =
    this.actions$.ofType(GameActions.BID)
    .map((action: GameActions.Bid) =>
      new WebSocketActions.Request(
        new WebSocket.Requests.GameplayBid(action.bid)
      )
    );

  @Effect()
  friendSelect$ =
    this.actions$.ofType(GameActions.FriendSelect.CONFIRM)
    .map((action: GameActions.FriendSelect.Confirm) =>
      new WebSocketActions.Request(
        new WebSocket.Requests.FriendSelect({
          floor_cards: action.payload.discardCards,
          ...action.payload.friendDecl,
        })
      )
    );

  @Effect()
  playCard$ =
    this.actions$.ofType(GameActions.PLAY_CARD)
    .map((action: GameActions.PlayCard) => {
      const payload: any = {
        card: action.payload.card,
      };
      if ('jokerCall' in action.payload) {
        payload.joker_call = action.payload.jokerCall;
      }
      // FIXME: joker_suit will be removed
      if (payload.card.rank === 'JK') {
        if ('suit' in payload.card) {
          payload.joker_suit = payload.card.suit;
        }
      }
      return new WebSocketActions.Request(
        new WebSocket.Requests.Play(payload)
      );
    })

  constructor(
    private actions$: Actions,
  ) {}
}
