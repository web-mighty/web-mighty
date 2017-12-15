import { Injectable } from '@angular/core';
import { Store, Action } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';
import { WebSocketService } from '../websocket.service';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/concatMap';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/startWith';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/empty';

import { State } from '../reducer';
import * as UserActions from '../actions/user';
import * as WebSocketActions from '../actions/websocket';
import * as GameActions from '../actions/game';

import * as WebSocket from '../../websocket';

function relativeWebSocketUri(path: string): string {
  const { protocol, host } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${host}${path}`;
}

// Map generic WebSocket responses into specific game actions.
function mapResponse(resp: WebSocketActions.Response): Action | null {
  switch (resp.request.action) {
    case 'room-join': {
      const result = resp.downcast<WebSocket.Data.Room>();
      if (typeof result === 'string') {
        return new GameActions.JoinRoomFailed(result);
      } else {
        return new GameActions.RoomInfo(result);
      }
    }
    case 'room-leave': {
      const result = resp.downcast<{}>();
      if (typeof result === 'string') {
        return new WebSocketActions.WebSocketError(result);
      } else {
        return new GameActions.LeaveRoomDone();
      }
    }
    case 'room-ready': {
      const result = resp.downcast<{}>(); // We don't need result
      if (typeof result === 'string') {
        return new WebSocketActions.WebSocketError(result);
      } else {
        return null;
      }
    }
    case 'room-start': {
      const result = resp.downcast<{}>();
      if (typeof result === 'string') {
        return new WebSocketActions.WebSocketError(result);
      } else {
        return null;
      }
    }
    default:
      return null;
  }
}

function mapEvent(ev: WebSocketActions.Event): Action | null {
  const {payload} = ev;
  switch (payload.event) {
    case 'connected':
      return new WebSocketActions.Connected();
    case 'room-join':
      return new GameActions.PlayerStateChange({
        username: payload.data.player,
        left: false,
        ready: false,
      });
    case 'room-leave':
      return new GameActions.PlayerStateChange({
        username: payload.data.player,
        left: true,
        ready: false,
      });
    case 'room-ready':
      return new GameActions.PlayerStateChange({
        username: payload.data.player,
        left: false,
        ready: payload.data.ready,
      });
    case 'room-start':
      return new GameActions.Started();
    case 'gameplay-deal':
      return new GameActions.Deal(payload.data.cards);
    case 'error':
      // TODO: Emit appropriate error action
      switch (payload.data.type) {
        case 'connection-dup':
          return null;
        case 'connection-auth':
          return null;
        default:
          return new WebSocketActions.WebSocketError(payload.data);
      }
    default:
      return null;
  }
}

@Injectable()
export class WebSocketEffects {
  socket: WebSocket | null = null;
  // for testing
  delay: boolean = true;

  @Effect()
  signedIn$: Observable<Action> =
    this.actions$.ofType(UserActions.VERIFIED, UserActions.SIGN_IN_DONE)
    .map(() => new WebSocketActions.Connect());

  @Effect()
  signOut$ =
    this.actions$.ofType(UserActions.SIGN_OUT_START)
    .map(() => new WebSocketActions.Disconnect());

  @Effect()
  connect$: Observable<Action> =
    this.actions$.ofType(WebSocketActions.CONNECT)
    .switchMap((action: WebSocketActions.Connect) => {
      const { force } = action;
      const path = `/api/websocket/${force ? '?force=true' : ''}`;
      this.socket = this.webSocket.connect(relativeWebSocketUri(path));
      return new Observable(obs => {
        this.socket.addEventListener('open', () => {
          // Connection message will be sent from the backend
          // obs.next(new WebSocketActions.Connected());
        });
        this.socket.addEventListener('error', e => {
          obs.next(new WebSocketActions.WebSocketError(e));
        });
        this.socket.addEventListener('close', e => {
          switch (e.code) {
            case 1000: // Normal
              obs.next(new WebSocketActions.Disconnected());
              break;
            case 4000: // Reject: Unauthorized
              obs.next(new WebSocketActions.Disconnected());
              break;
            case 4001: // Reject: Duplication
              obs.next(new WebSocketActions.DuplicateSession());
              break;
            case 4010: // Disconnect: Unauthorized
              obs.next(new WebSocketActions.Disconnected());
              break;
            case 4011: // Disconnect: Duplication
              obs.next(new WebSocketActions.DuplicateSession());
              break;
            default:
              obs.next(new WebSocketActions.WebSocketError(e));
              obs.next(new WebSocketActions.Disconnected());
              break;
          }
          obs.complete();
        });
        this.socket.addEventListener('message', message => {
          const data = JSON.parse(message.data);
          if ('event' in data) {
            // event
            obs.next(new WebSocketActions.Event(data));
          } else if ('nonce' in data) {
            // response
            obs.next(new WebSocketActions.RawResponse(data));
          }
        });
        return () => {
          if (this.socket != null) {
            this.socket.close();
          }
        };
      });
    });

  @Effect({ dispatch: false })
  disconnect$ =
    this.actions$.ofType(WebSocketActions.DISCONNECT)
    .do(() => {
      if (this.socket != null) {
        this.socket.close();
      }
    });

  @Effect()
  request$ =
    this.actions$.ofType(WebSocketActions.REQUEST)
    .mergeMap((action: WebSocketActions.Request) => {
      if (this.socket == null) {
        return Observable.of(
          new WebSocketActions.WebSocketError('Not connected')
        );
      } else {
        this.socket.send(JSON.stringify(action.payload));
        return Observable.empty();
      }
    });

  @Effect()
  rawResponse$ =
    this.actions$.ofType(WebSocketActions.RAW_RESPONSE)
    .withLatestFrom(
      this.store.select('websocket', 'requests'),
      (action: WebSocketActions.RawResponse, state) => {
        const nonce = action.nonce;
        if (nonce in state) {
          const request = state[nonce];
          return new WebSocketActions.Response(nonce, request, action.response);
        }
        return null;
      }
    )
    .filter(x => x != null);

  @Effect()
  response$ =
    this.actions$.ofType(WebSocketActions.RESPONSE)
    .map(mapResponse)
    .filter(action => action != null);

  @Effect()
  event$ =
    this.actions$.ofType(WebSocketActions.EVENT)
    .map(mapEvent)
    .filter(action => action != null);

  @Effect()
  disconnected$: Observable<Action> =
    this.actions$.ofType(WebSocketActions.DISCONNECTED)
    .do(() => this.socket = null)
    .mergeMap(() => this.store.select('websocket', 'connectionStatus').first())
    .filter(status => status !== 'duplicate')
    .mergeMap(() => this.store.select('user', 'authUser').first())
    .filter(user => user != null)
    .concatMap(() => {
      const action = new WebSocketActions.Connect();
      if (this.delay) {
        return Observable.empty().delay(5000).startWith(action) as Observable<Action>;
      } else {
        return Observable.of(action);
      }
    });

  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private webSocket: WebSocketService,
  ) {}
}
