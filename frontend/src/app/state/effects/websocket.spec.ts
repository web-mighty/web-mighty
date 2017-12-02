import { TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { State } from '../reducer';
import { WebSocketMock } from '../../testing';

import * as WebSocketMessages from '../../websocket';

// Reducers
import { reducers } from '../reducer';

// Actions
import { AppActions } from '../app-actions';
import * as UserActions from '../actions/user';
import * as WebSocketActions from '../actions/websocket';

// Effects
import { WebSocketEffects } from './websocket';

describe('WebSocketEffects', () => {
  let effects: WebSocketEffects;
  let webSocket;
  let actions;
  let store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        RouterTestingModule.withRoutes([]),
        StoreModule.forRoot(reducers),
      ],
      providers: [
        provideMockActions(() => actions),
      ],
    });
  });

  beforeEach(inject(
    [Actions, Store],
    (actions$: Actions, _store: Store<State>) => {
      store = _store;
      webSocket = new WebSocketMock();
      effects = new WebSocketEffects(actions$, store, {
        connect(url: string) {
          webSocket.setUrl(url);
          return webSocket;
        }
      });
      effects.delay = false;
    }
  ));

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  describe('signedIn$', () => {
    it('should fire Connect when user is verified', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new UserActions.Verified({ username: 'foo' })
      );
      let found = false;
      effects.signedIn$.subscribe(action => {
        if (action.type === WebSocketActions.CONNECT) {
          found = true;
        }
      });
      tick();

      expect(found).toBeTruthy();
    }));

    it('should fire Connect when user is signed in', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new UserActions.SignIn.Done({ username: 'foo' })
      );
      let found = false;
      effects.signedIn$.subscribe(action => {
        if (action.type === WebSocketActions.CONNECT) {
          found = true;
        }
      });
      tick();

      expect(found).toBeTruthy();
    }));
  });

  describe('connect$', () => {
    it('should try to connect', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      effects.connect$.subscribe(_ => {});
      tick();

      expect(effects.socket).toBeTruthy();
    }));

    it('should add `?force=true` to url if the connection is forced', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect(true)
      );
      effects.connect$.subscribe(_ => {});
      tick();

      expect(webSocket.url).toMatch(/\?force=true$/);
    }));

    it('should emit Connected when connected', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let found = false;
      effects.connect$.subscribe(action => {
        if (action.type === WebSocketActions.CONNECTED) {
          found = true;
        }
      });
      tick();

      webSocket.accept();
      tick();

      expect(found).toBeTruthy();
    }));

    it('should fire Disconnected if the socket is closed', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let found = false;
      effects.connect$.subscribe(action => {
        if (action.type === WebSocketActions.DISCONNECTED) {
          found = true;
        }
      });
      tick();

      webSocket.accept();
      tick();

      webSocket.close();
      tick();

      expect(found).toBeTruthy();
    }));

    it('should fire WebSocketError if the socket is not closed cleanly', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let errorFound = false;
      let closeFound = false;
      effects.connect$.subscribe(action => {
        if (action.type === WebSocketActions.WS_ERROR) {
          errorFound = true;
        } else if (action.type === WebSocketActions.DISCONNECTED) {
          closeFound = true;
        }
      });
      tick();

      webSocket.accept();
      tick();

      webSocket.close(false);
      tick();

      expect(errorFound).toBeTruthy();
      expect(closeFound).toBeTruthy();
    }));

    it('should fire Event if it received an event', fakeAsync(() => {
      const ev = {
        event: 'room-join',
        data: {
          player: 'foo'
        },
      };

      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let found = false;
      effects.connect$.subscribe((action: WebSocketActions.Event) => {
        if (action.type === WebSocketActions.EVENT) {
          expect(action.payload as any).toEqual(ev);
          found = true;
        }
      });
      tick();

      webSocket.accept();
      tick();

      webSocket.reply(JSON.stringify(ev));
      tick();

      expect(found).toBeTruthy();
    }));

    it('should fire Response if it received a nonce', fakeAsync(() => {
      const nonce = 'asdf';
      const resp = {
        success: true,
        result: {},
      };

      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let found = false;
      effects.connect$.subscribe((action: WebSocketActions.RawResponse) => {
        if (action.type === WebSocketActions.RAW_RESPONSE) {
          expect(action.nonce).toBe(nonce);
          expect(action.response as any).toEqual(resp);
          found = true;
        }
      });
      tick();

      webSocket.accept();
      tick();

      webSocket.reply(JSON.stringify({ nonce, ...resp }));
      tick();

      expect(found).toBeTruthy();
    }));
  });

  describe('disconnect$', () => {
    it('should close the socket', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      effects.connect$.subscribe(_ => {});
      tick();

      actions.next(
        new WebSocketActions.Disconnect()
      );
      effects.disconnect$.subscribe(_ => {});
      tick();

      expect(webSocket.close).toHaveBeenCalled();
    }));
  });

  describe('request$', () => {
    it('should send message with nonce', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      effects.connect$.subscribe(_ => {});
      tick();

      webSocket.accept();
      tick();

      actions.next(
        new WebSocketActions.Request(new WebSocketMessages.RoomJoinRequest({
          'room_id': 'asdf',
        }))
      );
      effects.request$.subscribe(_ => {});
      tick();

      expect(webSocket.received.length).toBe(1);
      const obj = JSON.parse(webSocket.received[0]);
      expect(typeof(obj.nonce)).toBe('string');
      expect(obj.action).toBe('room-join');
      expect(obj.data).toEqual({ 'room_id': 'asdf' });
    }));

    it('should not send message if not connected', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Request(new WebSocketMessages.RoomJoinRequest({
          'room_id': 'asdf',
        }))
      );
      effects.request$.subscribe(_ => {});
      tick();

      expect(webSocket.received.length).toBe(0);
    }));
  });

  describe('disconnected$', () => {
    it('should connect again if the user is signed in', fakeAsync(() => {
      store.dispatch(new UserActions.Verified({ username: 'foo' }));
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Disconnected()
      );
      let found = false;
      effects.disconnected$.subscribe(action => {
        if (action.type === WebSocketActions.CONNECT) {
          found = true;
        }
      });
      tick();

      expect(found).toBeTruthy();
    }));

    it('should not connect again if the user is not signed in', fakeAsync(() => {
      store.dispatch(new UserActions.NeedSignIn());
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Disconnected()
      );
      let found = false;
      effects.disconnected$.subscribe(action => {
        if (action.type === WebSocketActions.CONNECT) {
          found = true;
        }
      });
      tick();

      expect(found).not.toBeTruthy();
    }));
  });
});
