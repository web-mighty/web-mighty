import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import * as RouterActions from './state/actions/router';
import * as UserActions from './state/actions/user';

import { State } from './state/reducer';
import { UserService } from './user.service';

@Component({
  selector: 'sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit {
  username: string;
  password: string;

  error: Observable<string | null>;

  constructor(
    private router: Router,
    private userService: UserService,
    private store: Store<State>,
  ) {
    this.error = this.store.select('user').map(user => user.currentError);
  }

  ngOnInit() {
    this.store.dispatch(new UserActions.RedirectIfSignedIn());
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
