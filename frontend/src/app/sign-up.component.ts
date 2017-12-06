import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import * as RouterActions from './state/actions/router';
import * as UserActions from './state/actions/user';

import { State } from './state/reducer';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  nickname = '';

  error: Observable<string | null>;
  verificationRequired: Observable<boolean>;

  constructor(
    private store: Store<State>,
  ) {
    this.error = this.store.select('user', 'currentError');
    this.verificationRequired =
      this.store.select('user', 'accountVerification', 'status')
      .map(status => status === 'required');
  }

  signUp() {
    if (this.nickname === '') {
      this.nickname = this.username;
    }
    this.store.dispatch(
      new UserActions.SignUp.Start({
        email: this.email,
        username: this.username,
        password: this.password,
        confirmPassword: this.confirmPassword,
        nickname: this.nickname
      })
    );
  }
}
