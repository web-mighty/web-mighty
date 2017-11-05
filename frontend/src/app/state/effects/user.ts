import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

import * as UserActions from '../actions/user';

// FIXME: Make effects communicate with backend
@Injectable()
export class UserEffects {
  @Effect()
  signUp$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_UP_START)
    .map((action: UserActions.SignUp.Start) => action.payload)
    .mergeMap(({ email, username, password }) =>
      of(new UserActions.SignUp.Done())
    );

  @Effect()
  signIn$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_IN_START)
    .map((action: UserActions.SignIn.Start) => action.payload)
    .mergeMap(({ username, password }) =>
      of(new UserActions.SignIn.Done(null))
    );

  @Effect()
  signOut$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_OUT_START)
    .mergeMap(() =>
      of(new UserActions.SignOut.Done())
    );

  constructor(
    private actions$: Actions,
  ) {}
}
