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
  retry = false;

  error: Observable<string | null>;

  constructor(
    private store: Store<State>,
  ) {
    const user = this.store.select('user');
    this.error = user.map(user => user.currentError);
  }

  signUp() {
    this.retry = false;
    if (this.password !== this.confirmPassword) {
      this.password = '';
      this.confirmPassword = '';
      this.retry = true;
    } else {
      if (this.nickname === '') {
        this.nickname = this.username;
      }
      this.store.dispatch(
        new UserActions.SignUp.Start({
          email: this.email,
          username: this.username,
          password: this.password,
          nickname: this.nickname
        })
      );
    }
  }
}
