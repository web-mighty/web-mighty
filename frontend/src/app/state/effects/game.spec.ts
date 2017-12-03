import { TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockComponent, filterCallByAction } from '../../testing';
import * as v4 from 'uuid/v4';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Actions } from '@ngrx/effects';

// Actions
import * as RouterActions from '../actions/router';
import * as GameActions from '../actions/game';

// Effects
import { GameEffects } from './game';

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

      const list = [];
      effects.joinRoom$.subscribe(action => list.push(action));
      tick();

      expect(list.length).toBe(4);
      expect(list[0].payload.nonce).toBeTruthy();
      expect(list[0].payload.action).toBe('room-join');
      expect(list[0].payload.data).toEqual({ room_id: roomId1 });
      expect(list[1]).toEqual(new RouterActions.Go({ path: ['room', roomId1] }));
      expect(list[2].payload.nonce).toBeTruthy();
      expect(list[2].payload.action).toBe('room-join');
      expect(list[2].payload.data).toEqual({ room_id: roomId2, password: 'x' });
      expect(list[3]).toEqual(new RouterActions.Go({ path: ['room', roomId2] }));
    }));
  });

  describe('joinRoomFailed$', () => {
    it('should convert action', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(new GameActions.JoinRoomFailed('foo'));

      const list = [];
      effects.joinRoomFailed$.subscribe(action => list.push(action));
      tick();

      expect(list.length).toBe(1);
      expect(list[0]).toEqual(new RouterActions.GoByUrl('lobby'));
    }));
  });

  describe('leaveRoom$', () => {
    it('should convert action', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(new GameActions.LeaveRoom());

      const list = [];
      effects.leaveRoom$.subscribe(action => list.push(action));
      tick();

      expect(list.length).toBe(1);
      expect(list[0].payload.nonce).toBeTruthy();
      expect(list[0].payload.action).toBe('room-leave');
      expect(list[0].payload.data).toEqual({});
    }));
  });
});
