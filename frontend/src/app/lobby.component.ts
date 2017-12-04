import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { Observable } from 'rxjs/Observable';
import { State } from './state/reducer';
import { User } from './user';
import { Room } from './room';

// Actions
import * as UserActions from './state/actions/user';
import * as RoomActions from './state/actions/room';
import * as GameActions from './state/actions/game';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {

  roomList: Observable<Room[]>;
  error: Observable<string | null>;
  leaving: Observable<boolean>;
  loading: Observable<boolean>;
  lockImgPath = 'assets/img/lock.svg';

  constructor(private store: Store<State>) {
    this.roomList = this.store.select('room', 'roomList');
    this.error = this.store.select('room', 'currentError');
    this.leaving =
      this.store.select('game', 'leaving')
      .filter(leaving => leaving != null);
    const loading =
      this.store.select('room', 'roomLoading')
      .filter(loading => loading != null);

    this.loading =
      Observable.combineLatest(
        this.leaving,
        loading,
        (leaving, loading) => leaving || loading
      );
  }

  ngOnInit() {
    const completeWhenLeft =
      this.leaving
      .takeWhile(leaving => leaving)
      .ignoreElements() as Observable<never>;

    completeWhenLeft.subscribe(
      _ => {},
      _ => {},
      () => {
        this.store.dispatch(new RoomActions.GetRooms.Start({
          page: 1,
          count_per_page: 10,
        }));
      }
    );
  }

  gotoCreateGame() {
    this.store.dispatch(new UserActions.RedirectWithSignInState({
      when: 'not-signed-in',
      goTo: 'sign_in',
    }));
    this.store.dispatch(new UserActions.RedirectWithSignInState({
      when: 'signed-in',
      goTo: 'create_game',
    }));
  }

  joinRoom(id: string) {
    // TODO: Ask password
    this.store.dispatch(new GameActions.JoinRoom({
      roomId: id,
    }));
  }

}
