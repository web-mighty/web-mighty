import { Injectable } from '@angular/core';
import { Store, Action } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';
import { WebSocketService } from '../websocket.service';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/delay';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { State } from '../reducer';
import * as UserActions from '../actions/user';
import * as WebSocketActions from '../actions/websocket';

function relativeWebSocketUri(path: string): string {
  const { protocol, host } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${host}${path}`;
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
  connect$: Observable<Action> =
    this.actions$.ofType(WebSocketActions.CONNECT)
    .switchMap((action: WebSocketActions.Connect) => {
      const { force } = action;
      const path = `/api/websocket${force ? '?force=true' : ''}`;
      this.socket = this.webSocket.connect(relativeWebSocketUri(path));
      return new Observable(obs => {
        this.socket.addEventListener('open', () => {
          obs.next(new WebSocketActions.Connected());
        });
        this.socket.addEventListener('error', e => {
          obs.next(new WebSocketActions.WebSocketError(e));
        });
        this.socket.addEventListener('close', e => {
          if (!e.wasClean) {
            obs.next(new WebSocketActions.WebSocketError(e));
          }
          obs.next(new WebSocketActions.Disconnected());
          obs.complete();
        });
        this.socket.addEventListener('message', message => {
          const data = JSON.parse(message.data);
          if ('event' in data) {
            // event
            obs.next(new WebSocketActions.Event(data));
          } else if ('nonce' in data) {
            // response
            obs.next(new WebSocketActions.Response(data));
          }
        });
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

  @Effect({ dispatch: false })
  request$ =
    this.actions$.ofType(WebSocketActions.REQUEST)
    .do((action: WebSocketActions.Request) => {
      if (this.socket != null) {
        this.socket.send(JSON.stringify(action.payload));
      }
    });

  @Effect()
  disconnected$: Observable<Action> =
    this.actions$.ofType(WebSocketActions.DISCONNECTED)
    .do(() => this.socket = null)
    .mergeMap(() => this.store.select('user', 'authUser').first())
    .filter(user => user != null)
    .mergeMap(() => {
      const connect = Observable.of(new WebSocketActions.Connect());
      if (this.delay) {
        return connect.delay(5000);
      } else {
        return connect;
      }
    });

  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private webSocket: WebSocketService,
  ) {}
}
