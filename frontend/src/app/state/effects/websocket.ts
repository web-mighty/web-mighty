import { Injectable } from '@angular/core';
import { Store, Action } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';

import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/delay';
import { Observable } from 'rxjs/Observable';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/never';
import 'rxjs/add/observable/dom/webSocket';

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
  delay: boolean = true;

  @Effect()
  signedIn$: Observable<Action> =
    this.actions$.ofType(UserActions.VERIFIED, UserActions.SIGN_IN_DONE)
    .map(() => new WebSocketActions.Connect());

  @Effect()
  connect$: Observable<Action> =
    this.actions$.ofType(WebSocketActions.CONNECT)
    .do(action => console.log('Connect', action))
    .switchMap((action: WebSocketActions.Connect) => {
      const { force } = action;
      const path = `/api/websocket${force ? '?force=true' : ''}`;
      this.socket = new WebSocket(relativeWebSocketUri(path));
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
          // TODO: Convert message
        });
      });
    })
    .do(console.log);

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
      console.log('Request', action);
      if (this.socket != null) {
        this.socket.send(JSON.stringify(action.payload));
      }
    });

  @Effect()
  disconnected$: Observable<Action> =
    this.actions$.ofType(WebSocketActions.DISCONNECTED)
    .do(() => console.log('Disconnected'))
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
  ) {}
}
