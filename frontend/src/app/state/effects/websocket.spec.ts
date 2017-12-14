import { TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import * as v4 from 'uuid/v4';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Store, Action } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { State } from '../reducer';
import { WebSocketMock } from '../../testing';

import * as WebSocket from '../../websocket';

// Reducers
import { reducers } from '../reducer';

// Actions
import { AppActions } from '../app-actions';
import * as UserActions from '../actions/user';
import * as WebSocketActions from '../actions/websocket';
import * as GameActions from '../actions/game';

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

  describe('signOut$', () => {
    it('should fire Disconnect with signingOut set to true', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(new UserActions.SignOut.Start());

      const list = [];
      effects.signOut$.subscribe(action => list.push(action));
      tick();

      expect(list).toEqual([
        new WebSocketActions.Disconnect(),
      ]);
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

    it('should emit nothing right after connection', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let found = false;
      effects.connect$.subscribe(action => {
        found = true;
      });
      tick();

      webSocket.accept();
      tick();

      expect(found).not.toBeTruthy();
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

      webSocket.close(1001);
      tick();

      expect(errorFound).toBeTruthy();
      expect(closeFound).toBeTruthy();
    }));

    it('should fire Disconnected if the socket is closed with 4000', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let list = [];
      effects.connect$.subscribe(action => list.push(action));
      tick();

      webSocket.accept();
      tick();

      webSocket.close(4000);
      tick();

      expect(list.length).toBe(1);
      expect(list[0]).toEqual(new WebSocketActions.Disconnected());
    }));

    it('should fire DuplicateSession if the socket is closed with 4001', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let list = [];
      effects.connect$.subscribe(action => list.push(action));
      tick();

      webSocket.accept();
      tick();

      webSocket.close(4001);
      tick();

      expect(list.length).toBe(1);
      expect(list[0]).toEqual(new WebSocketActions.DuplicateSession());
    }));

    it('should fire Disconnected if the socket is closed with 4010', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let list = [];
      effects.connect$.subscribe(action => list.push(action));
      tick();

      webSocket.accept();
      tick();

      webSocket.close(4010);
      tick();

      expect(list.length).toBe(1);
      expect(list[0]).toEqual(new WebSocketActions.Disconnected());
    }));

    it('should fire DuplicateSession if the socket is closed with 4011', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new WebSocketActions.Connect()
      );
      let list = [];
      effects.connect$.subscribe(action => list.push(action));
      tick();

      webSocket.accept();
      tick();

      webSocket.close(4011);
      tick();

      expect(list.length).toBe(1);
      expect(list[0]).toEqual(new WebSocketActions.DuplicateSession());
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
        new WebSocketActions.Request(new WebSocket.Requests.RoomJoin({
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
        new WebSocketActions.Request(new WebSocket.Requests.RoomJoin({
          'room_id': 'asdf',
        }))
      );
      effects.request$.subscribe(_ => {});
      tick();

      expect(webSocket.received.length).toBe(0);
    }));
  });

  describe('rawResponse$', () => {
    it('should match request and response using nonce', fakeAsync(() => {
      actions = new ReplaySubject(1);

      const req =
        new WebSocketActions.Request(new WebSocket.Requests.RoomLeave());
      const resp =
        new WebSocketActions.RawResponse({
          nonce: req.payload.nonce,
          success: true,
          result: {},
        });
      store.dispatch(req);
      actions.next(resp);

      const list = [];
      effects.rawResponse$.subscribe(actions => list.push(actions));
      tick();

      expect(list.length).toBe(1);
      expect(list[0].request).toEqual(req.request);
      expect(list[0].response).toEqual({ success: true, result: {} });
    }));

    it('should discard response if nonce is not found', fakeAsync(() => {
      actions = new ReplaySubject(1);

      const resp =
        new WebSocketActions.RawResponse({
          nonce: v4(),
          success: true,
          result: {},
        });
      actions.next(resp);

      const list = [];
      effects.rawResponse$.subscribe(actions => list.push(actions));
      tick();

      expect(list.length).toBe(0);
    }));
  });

  describe('response$', () => {
    const sampleRoom: WebSocket.Data.Room = {
      room_id: 'foo',
      title: 'foobar',
      players: [
        { username: 'foo', ready: false },
      ],
    };
    const expects: Array<{
      name: string,
      given: {
        request: WebSocket.Request,
        response: WebSocket.Response,
      },
      expect: Action,
    }> = [
      {
        name: 'room-join',
        given: {
          request: new WebSocket.Requests.RoomJoin({
            room_id: 'foo',
          }),
          response: {
            success: true,
            result: sampleRoom,
          },
        },
        expect: new GameActions.RoomInfo(sampleRoom),
      },
      {
        name: 'room-leave',
        given: {
          request: new WebSocket.Requests.RoomLeave(),
          response: {
            success: true,
            result: {},
          },
        },
        expect: new GameActions.LeaveRoomDone(),
      },
    ];

    for (const spec of expects) {
      it(`should process ${spec.name}`, fakeAsync(() => {
        actions = new ReplaySubject(1);
        const resp =
          new WebSocketActions.Response(
            v4(),
            spec.given.request,
            spec.given.response
          );
        actions.next(resp);

        const list = [];
        effects.response$.subscribe(action => list.push(action));
        tick();

        expect(list.length).toBe(1);
        expect(list[0]).toEqual(spec.expect);
      }));
    }
  });

  describe('event$', () => {
    const expects: Array<{
      name: string,
      given: WebSocket.Event,
      expect: Action,
    }> = [
      {
        name: 'connected',
        given: { event: 'connected', data: {} },
        expect: new WebSocketActions.Connected(),
      },
      {
        name: 'room-join',
        given: { event: 'room-join', data: { player: 'foo' } },
        expect: new GameActions.PlayerStateChange({
          username: 'foo',
          left: false,
          ready: false,
        }),
      },
      {
        name: 'room-leave',
        given: { event: 'room-leave', data: { player: 'foo' } },
        expect: new GameActions.PlayerStateChange({
          username: 'foo',
          left: true,
          ready: false,
        }),
      },
    ];

    for (const spec of expects) {
      it(`should process ${spec.name}`, fakeAsync(() => {
        actions = new ReplaySubject(1);
        actions.next(new WebSocketActions.Event(spec.given));

        const list = [];
        effects.event$.subscribe(action => list.push(action));
        tick();

        expect(list.length).toBe(1);
        expect(list[0]).toEqual(spec.expect);
      }));
    }
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
