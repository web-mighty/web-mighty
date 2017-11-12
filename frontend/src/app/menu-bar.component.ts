import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { Observable } from 'rxjs/Observable';
import { State } from './state/reducer';

// Actions
import * as RouterActions from './state/actions/router';
import * as UserActions from './state/actions/user';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent implements OnInit {

  signedIn: Observable<boolean>;
  username: Observable<string>;
  imagePath: string = '../favicon.ico';

  constructor(private store: Store<State>) {
    const user = this.store.select('user').map(user => user.authUser);
    this.username = user.map(user => user === null ? '' : user.username);
    this.signedIn = user.map(user => user !== null);
  }

  ngOnInit() {
    this.store.dispatch(new UserActions.VerifySession());
  }

  gotoLobby() {
    this.store.dispatch(new RouterActions.GoByUrl('lobby'));
  }
  gotoProfile() {
    this.store.dispatch(new RouterActions.Go({path: ['profile', this.username]}));
  }
  gotoSignIn() {
    this.store.dispatch(new RouterActions.GoByUrl('sign_in'));
  }
  signOut() {
    this.store.dispatch(new UserActions.SignOut.Start());
  }

}
