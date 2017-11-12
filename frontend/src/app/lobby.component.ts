import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { State } from './state/reducer';
import { User } from './user';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {

  signedIn: Observable<boolean>;
  username: Observable<string>;

  constructor(private store: Store<State>) {
    const user = this.store.select('user').map(user => user.authUser);
    this.username = user.map(user => user === null ? '' : user.username);
    this.signedIn = user.map(user => user !== null);
  }

  ngOnInit() {
  }

}
