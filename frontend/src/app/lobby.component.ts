import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { Observable } from 'rxjs/Observable';
import { State } from './state/reducer';
import { User } from './user';
import { Room } from './room';

// Actions
import * as UserActions from './state/actions/user';
import * as RoomActions from './state/actions/room';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {

  signedIn: Observable<boolean>;
  username: Observable<string>;

  roomList: Observable<Room[]>;
  error: Observable<string | null>;
  lockImgPath = 'assets/img/lock.svg';

  constructor(private store: Store<State>) {
    const user = this.store.select('user').map(user => user.authUser);
    this.username = user.map(user => user === null ? '' : user.username);
    this.signedIn = user.map(user => user !== null);

    const room = this.store.select('room');
    this.roomList = room.map(room => room.roomList);
    this.error = room.map(room => room.currentError);
  }

  ngOnInit() {
    this.store.dispatch(new RoomActions.GetRooms.Start({
      page: 1,
      count_per_page: 10,
    }));
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

  gotoHallOfFame() {
    this.store.dispatch(new UserActions.RedirectWithSignInState({
      when: 'not-signed-in',
      goTo: 'sign_in',
    }));
    this.store.dispatch(new UserActions.RedirectWithSignInState({
      when: 'signed-in',
      goTo: 'hall_of_fame',
    }));
  }

  joinGame(id: string) {
  }

}
