import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { Observable } from 'rxjs/Observable';
import { State } from './state/reducer';
import { Room } from './room';

import * as UserActions from './state/actions/user';
import * as RoomActions from './state/actions/room';

@Component({
  selector: 'app-game-create',
  templateUrl: './game-create.component.html',
  styleUrls: ['./game-create.component.css']
})
export class GameCreateComponent implements OnInit {

  title = '';
  password = '';

  error: Observable<string | null>;

  constructor(private store: Store<State>) {
    const room = this.store.select('room');
    this.error = room.map(room => room.currentError);
  }

  ngOnInit() {
    this.store.dispatch(new UserActions.RedirectWithSignInState({
      when: 'not-signed-in',
      goTo: 'sign_in',
    }));
  }

  create() {
    if (this.password === '') {
      this.store.dispatch(new RoomActions.CreateRoom.Start({
        title: this.title,
      }));
    } else {
      this.store.dispatch(new RoomActions.CreateRoom.Start({
        title: this.title,
        password: this.password,
      }));
    }
  }

}
