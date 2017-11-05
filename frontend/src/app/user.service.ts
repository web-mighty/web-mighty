import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

// Actions
import * as UserActions from './state/actions/user';

@Injectable()
export class UserService {
  constructor(private store: Store<void>) {}

  signUp(email: string, username: string, password: string) {
    this.store.dispatch(
      new UserActions.SignUp.Start({email, username, password})
    );
  }

  signIn(username: string, password: string) {
    this.store.dispatch(
      new UserActions.SignIn.Start({username, password})
    );
  }

  signOut() {
    this.store.dispatch(
      new UserActions.SignOut.Start()
    );
  }
}
