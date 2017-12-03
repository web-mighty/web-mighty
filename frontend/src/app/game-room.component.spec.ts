import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { MockComponent, filterCallByAction } from './testing';
import * as v4 from 'uuid/v4';

import { Observable } from 'rxjs/Observable';

import { Router, ActivatedRoute } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { Store } from '@ngrx/store';
import { State } from './state/reducer';

// Actions
import { AppActions } from './state/app-actions';
import * as RouterActions from './state/actions/router';
import * as WebSocketActions from './state/actions/websocket';
import * as GameActions from './state/actions/game';

// Reducers
import { websocketReducer } from './state/reducers/websocket';
import { gameReducer } from './state/reducers/game';

import { GameRoomComponent } from './game-room.component';

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
      ],
      imports: [
        RouterTestingModule.withRoutes([]),
        StoreModule.forRoot({
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
});
