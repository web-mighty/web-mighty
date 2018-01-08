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
  showDoge: boolean;
  longLogoPath = 'assets/img/long_logo.svg';
  dogeLogoPath = 'assets/img/long_logo_2.svg';
  logoPath = 'assets/img/logo.svg';

  constructor(private store: Store<State>) {
    const user = this.store.select('user').map(user => user.authUser);
    this.username = user.map(user => user === null ? '' : user.username);
    this.signedIn = user.map(user => user !== null);
  }

  ngOnInit() {
    this.store.dispatch(new UserActions.VerifySession());
    this.showDoge = (Math.random() < 0.2);
  }

  gotoLobby() {
    this.store.dispatch(new RouterActions.GoByUrl('lobby'));
  }
  gotoProfile() {
    this.username.first().subscribe(username =>
      this.store.dispatch(new RouterActions.Go({ path: ['profile', username] }))
    );
  }
  gotoSignIn() {
    this.store.dispatch(new RouterActions.GoByUrl('sign_in'));
  }
  signOut() {
    this.store.dispatch(new UserActions.SignOut.Start());
  }
  gotoHallOfFame() {
    this.store.dispatch(new RouterActions.GoByUrl('hall_of_fame'));
  }
}
