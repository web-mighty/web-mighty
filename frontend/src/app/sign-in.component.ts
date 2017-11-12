import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import * as RouterActions from './state/actions/router';
import * as UserActions from './state/actions/user';

import { State } from './state/reducer';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit {
  username: string;
  password: string;

  verifying: Observable<boolean>;
  error: Observable<string | null>;

  constructor(
    private store: Store<State>,
  ) {
    const user = this.store.select('user');
    this.verifying = user.map(user => user.verifying);
    this.error = user.map(user => user.currentError);
  }

  ngOnInit() {
    this.store.dispatch(new UserActions.RedirectWithSignInState({
      when: 'signed-in',
      goTo: 'lobby',
    }));
  }

  signIn() {
    this.store.dispatch(
      new UserActions.SignIn.Start({ username: this.username, password: this.password })
    );
  }

  gotoSignUp() {
    this.store.dispatch(new RouterActions.GoByUrl('sign_up'));
  }
}
