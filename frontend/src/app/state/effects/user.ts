import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Action } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import { Observable } from 'rxjs/Observable';
import { of as observableOf } from 'rxjs/observable/of';
import { never as observableNever } from 'rxjs/observable/never';
import { _throw as observableThrow } from 'rxjs/observable/throw';

import { User } from '../../user';
import * as RouterActions from '../actions/router';
import * as UserActions from '../actions/user';

// FIXME: Make effects communicate with backend
@Injectable()
export class UserEffects {
  private static signInFailedMessage =
    'Username and password does not match.';

  private static jsonHeaders = new Headers({
    'Content-Type': 'application/json',
  });

  @Effect()
  signUp$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_UP_START)
    .map((action: UserActions.SignUp.Start) => action.payload)
    .mergeMap(({ email, username, password }) =>
      observableOf(new UserActions.SignUp.Done())
    );

  @Effect()
  signIn$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_IN_START)
    .map((action: UserActions.SignIn.Start) => action.payload)
    .mergeMap(params =>
      this.http.post(
        '/api/signin/',
        JSON.stringify(params),
        { headers: UserEffects.jsonHeaders }
      ).mergeMap((response): Observable<Action> => {
        if (response.status !== 200) {
          return observableThrow(response);
        }
        const user: User = response.json();
        return observableOf(
          new UserActions.SignIn.Done(user)
        );
      }).catch((response): Observable<Action> => {
        if (response.status === 401) {
          return observableOf(
            new UserActions.SignIn.Failed(UserEffects.signInFailedMessage)
          );
        }
        return observableOf(
          new UserActions.SignIn.Failed('Unknown error.')
        );
      })
    );

  // When a user is successfully signed in, redirect to Lobby.
  @Effect()
  signInDone$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_IN_DONE)
    .map(_ => new RouterActions.GoByUrl('lobby'));

  @Effect()
  signOut$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_OUT_START)
    .mergeMap(() =>
      observableOf(new UserActions.SignOut.Done())
    );

  // TODO: Perform proper check
  @Effect()
  redirectIfSignedIn$: Observable<Action> =
    this.actions$.ofType(UserActions.REDIRECT_IF_SIGNED_IN)
    .mergeMap(() =>
      observableNever()
    );

  constructor(
    private actions$: Actions,
    private http: Http,
  ) {}
}
