import { TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockComponent, filterCallByAction } from '../../testing';
import * as v4 from 'uuid/v4';

import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/concat';
import 'rxjs/add/observable/zip';

import { Action } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import * as WebSocket from '../../websocket';

// Actions
import * as RouterActions from '../actions/router';
import * as WebSocketActions from '../actions/websocket';
import * as GameActions from '../actions/game';

// Effects
import { GameEffects } from './game';

function compareOutput(effect: Observable<Action>, output: Action[]) {
  const list = [];
  const subscription = effect.subscribe(
    action => list.push(action),
    err => {
      fail(`Error from Observable: ${err}`);
    },
  );
  tick();
  subscription.unsubscribe();

  if (list.length !== output.length) {
    fail(`Action count does not match: expected ${output.length}, found ${list.length}`);
    return;
  }
  for (let i = 0; i < list.length; i++) {
    const found: any = list[i];
    const expected: any = output[i];
    if (expected instanceof WebSocketActions.Request) {
      expect(found.payload).toBeTruthy();
      expect(found.payload.nonce).toBeTruthy();
      expect(found.payload.action).toBe(expected.payload.action);
      expect(found.payload.data).toEqual(expected.payload.data);
    } else {
      expect(found).toEqual(expected);
    }
  }
}

describe('GameEffects', () => {
  let effects: GameEffects;
  let actions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
      ],
      imports: [
        CommonModule,
      ],
      providers: [
        provideMockActions(() => actions),
      ],
    });
  });

  beforeEach(inject(
    [Actions],
    (actions$: Actions) => {
      effects = new GameEffects(actions$);
    }
  ));

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  describe('joinRoom$', () => {
    it('should convert action', fakeAsync(() => {
      const roomId1 = v4();
      const roomId2 = v4();
      actions = new ReplaySubject(2);
      actions.next(new GameActions.JoinRoom({ roomId: roomId1 }));
      actions.next(new GameActions.JoinRoom({ roomId: roomId2, password: 'x' }));

      compareOutput(effects.joinRoom$, [
        new WebSocketActions.Request(
          new WebSocket.Requests.RoomJoin({ room_id: roomId1 })
        ),
        new RouterActions.Go({ path: ['room', roomId1] }),
        new WebSocketActions.Request(
          new WebSocket.Requests.RoomJoin({ room_id: roomId2, password: 'x' })
        ),
        new RouterActions.Go({ path: ['room', roomId2] }),
      ]);
    }));
  });

  describe('joinRoomFailed$', () => {
    it('should convert action', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(new GameActions.JoinRoomFailed('foo'));

      compareOutput(effects.joinRoomFailed$, [
        new RouterActions.GoByUrl('lobby'),
      ]);
    }));
  });

  describe('leaveRoom$', () => {
    it('should convert action', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(new GameActions.LeaveRoom());

      compareOutput(effects.leaveRoom$, [
        new WebSocketActions.Request(
          new WebSocket.Requests.RoomLeave()
        )
      ]);
    }));
  });

  describe('ready$', () => {
    it('should convert action', fakeAsync(() => {
      actions = new ReplaySubject(2);
      actions.next(new GameActions.Ready(true));
      actions.next(new GameActions.Ready(false));

      compareOutput(effects.ready$, [
        new WebSocketActions.Request(
          new WebSocket.Requests.RoomReady(true)
        ),
        new WebSocketActions.Request(
          new WebSocket.Requests.RoomReady(false)
        ),
      ]);
    }));
  });

  describe('start$', () => {
    it('should convert action', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(new GameActions.Start());

      compareOutput(effects.start$, [
        new WebSocketActions.Request(
          new WebSocket.Requests.RoomStart()
        ),
      ]);
    }));
  });
});
