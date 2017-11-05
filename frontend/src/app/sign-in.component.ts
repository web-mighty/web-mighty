import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import * as RouterActions from './state/actions/router';

import { UserService } from './user.service';

@Component({
  selector: 'sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {
  constructor(
    private router: Router,
    private userService: UserService,
    private store: Store<void>,
  ) {}
  username: string;
  password: string;

  signIn() {
    this.userService.signIn(this.username, this.password);
  }

  gotoSignUp() {
    this.store.dispatch(new RouterActions.GoByUrl('sign_up'));
  }
}
