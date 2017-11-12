import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { Observable } from 'rxjs/Observable';
import { State } from './state/reducer';
import { User } from './user';
import { Room } from './room';

// Actions
import * as RouterActions from './state/actions/router';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {

  signedIn: Observable<boolean>;
  username: Observable<string>;
  rooms: Room[];

  constructor(private store: Store<State>) {
    const user = this.store.select('user').map(user => user.authUser);
    this.username = user.map(user => user === null ? '' : user.username);
    this.signedIn = user.map(user => user !== null);
  }

  ngOnInit() {
  }

  gotoCreateGame() {
    if (!this.signedIn) {
      this.store.dispatch(new RouterActions.GoByUrl('sign_in'));
    } else {
      this.store.dispatch(new RouterActions.GoByUrl('create_game'));
    }
  }

  gotoHallOfFame() {
    if (!this.signedIn) {
      this.store.dispatch(new RouterActions.GoByUrl('sign_in'));
    } else {
      this.store.dispatch(new RouterActions.GoByUrl('hall_of_fame'));
    }
  }

  joinGame(id: string) {
  }

}
