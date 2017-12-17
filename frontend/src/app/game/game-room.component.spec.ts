import { Component } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { MockComponent, filterCallByAction } from '../testing';
import * as v4 from 'uuid/v4';

import { Observable } from 'rxjs/Observable';

import { Router, ActivatedRoute } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { Store } from '@ngrx/store';
import { State } from '../state/reducer';

// Actions
import { AppActions } from '../state/app-actions';
import * as RouterActions from '../state/actions/router';
import * as UserActions from '../state/actions/user';
import * as WebSocketActions from '../state/actions/websocket';
import * as GameActions from '../state/actions/game';

// Reducers
import { userReducer } from '../state/reducers/user';
import { websocketReducer } from '../state/reducers/websocket';
import { gameReducer } from '../state/reducers/game';

import { GameRoomComponent } from './game-room.component';

@Component({
  selector: 'app-game-bid',
  template: ''
})
class MockGameBidComponent {}
@Component({
  selector: 'app-friend-select',
  template: ''
})
class MockFriendSelectComponent {}

class ActivatedRouteStub {
  callbacks: Array<(roomId: string) => void> = [];

  paramMap: Observable<any> =
    Observable.create(obs => {
      this.callbacks.push(roomId => {
        obs.next({
          get(field: string) {
            return roomId;
          }
        });
      });
    });

  setRoomId(roomId: string) {
    for (const cb of this.callbacks) {
      cb(roomId);
    }
  }
}

describe('GameRoomComponent', () => {
  let comp: GameRoomComponent;
  let fixture: ComponentFixture<GameRoomComponent>;
  let store: Store<State>;
  let activatedRoute: ActivatedRouteStub;
  let dispatchSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        GameRoomComponent,
        MockGameBidComponent,
        MockFriendSelectComponent,
      ],
      imports: [
        RouterTestingModule.withRoutes([]),
        StoreModule.forRoot({
          user: userReducer,
          websocket: websocketReducer,
          game: gameReducer,
        }),
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(GameRoomComponent);
      comp = fixture.componentInstance;
      store = fixture.debugElement.injector.get(Store);
      activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
      dispatchSpy = spyOn(store, 'dispatch').and.callThrough();

      store.dispatch(new WebSocketActions.Connect());
      store.dispatch(new WebSocketActions.Connected());
    });
  }));

  it('should be created', () => {
    expect(comp).toBeTruthy();
  });

  it('should join room', async(() => {
    fixture.detectChanges();

    const roomId = v4();
    activatedRoute.setRoomId(roomId);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const joinRoom = filterCallByAction(dispatchSpy, GameActions.JoinRoom);
      expect(joinRoom.length).toBe(1);
      expect(joinRoom[0].payload).toEqual({ roomId: roomId });
    });
  }));

  it('should do nothing when the user is already joined', async(() => {
    const roomId = v4();
    store.dispatch(new GameActions.JoinRoom({ roomId: roomId }));
    store.dispatch(new GameActions.RoomInfo({
      room_id: roomId,
      title: 'foo',
      player_number: 5,
      players: [
        { username: 'foo', ready: false }
      ],
    }));
    fixture.detectChanges();
    activatedRoute.setRoomId(roomId);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const joinRoom = filterCallByAction(dispatchSpy, GameActions.JoinRoom);
      expect(joinRoom.length).toBe(1);
      const go = filterCallByAction(dispatchSpy, RouterActions.Go);
      expect(go.length).toBe(0);
    });
  }));

  it('should reflect users\' ready state', async(() => {
    const roomId = v4();
    store.dispatch(new UserActions.Verified({ username: 'foo' }));
    store.dispatch(new GameActions.JoinRoom({ roomId: roomId }));
    store.dispatch(new GameActions.RoomInfo({
      room_id: roomId,
      title: 'foo',
      player_number: 5,
      players: [
        { username: 'doge', ready: true },
        { username: 'foo', ready: false },
      ],
    }));
    fixture.detectChanges();
    activatedRoute.setRoomId(roomId);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const readyStatus = fixture.debugElement.nativeElement.querySelectorAll('label > input');
      expect(readyStatus[0].checked).toBe(true);
      expect(readyStatus[1].checked).toBe(false);
    });
  }));

  it('should be able to toggle user\'s ready state', async(() => {
    const roomId = v4();
    store.dispatch(new UserActions.Verified({ username: 'foo' }));
    store.dispatch(new GameActions.JoinRoom({ roomId: roomId }));
    store.dispatch(new GameActions.RoomInfo({
      room_id: roomId,
      title: 'foo',
      player_number: 5,
      players: [
        { username: 'foo', ready: false }
      ],
    }));
    fixture.detectChanges();
    activatedRoute.setRoomId(roomId);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const readyButton = fixture.debugElement.nativeElement.querySelector('.ready-toggle-button');
      readyButton.click();
      fixture.detectChanges();
      return fixture.whenStable();
    }).then(() => {
      fixture.detectChanges();
      const ready = filterCallByAction(dispatchSpy, GameActions.Ready);
      expect(ready.length).toBe(1);
      expect(ready[0].ready).toBeTruthy();
    });
  }));

  it('should change ready button text', async(() => {
    const roomId = v4();
    store.dispatch(new UserActions.Verified({ username: 'foo' }));
    store.dispatch(new GameActions.JoinRoom({ roomId: roomId }));
    store.dispatch(new GameActions.RoomInfo({
      room_id: roomId,
      title: 'foo',
      player_number: 5,
      players: [
        { username: 'foo', ready: false }
      ],
    }));
    fixture.detectChanges();
    activatedRoute.setRoomId(roomId);
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const readyButton = fixture.debugElement.nativeElement.querySelector('.ready-toggle-button');
      expect(readyButton.textContent.trim()).toBe('Ready');

      store.dispatch(new GameActions.PlayerStateChange({
        username: 'foo',
        left: false,
        ready: true,
      }));
      fixture.detectChanges();
      return fixture.whenStable();
    }).then(() => {
      fixture.detectChanges();
      const readyButton = fixture.debugElement.nativeElement.querySelector('.ready-toggle-button');
      expect(readyButton.textContent.trim()).toBe('Not Ready');
    });
  }));
});
