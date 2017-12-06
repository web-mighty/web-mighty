import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Store, Action } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/first';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/never';
import 'rxjs/add/observable/throw';

import { User } from '../../user';
import { State } from '../reducer';
import * as RouterActions from '../actions/router';
import * as UserActions from '../actions/user';
import * as WebSocketActions from '../actions/websocket';

// FIXME: Make effects communicate with backend
@Injectable()
export class UserEffects {
  private static passwordsMatchFailedMessage =
    'Passwords don\'t match. Try again.';

  private static signUpFailedMessage =
    'Sign up failed';

  private static signInFailedMessage =
    'Username and password does not match.';

  private static jsonHeaders = new Headers({
    'Content-Type': 'application/json',
  });

  @Effect()
  signUp$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_UP_START)
    .map((action: UserActions.SignUp.Start) => action.payload)
    .mergeMap(params => {
      if (params.password !== params.confirmPassword) {
        return Observable.of(
          new UserActions.SignUp.Failed(UserEffects.passwordsMatchFailedMessage)
        );
      } else {
        delete params.confirmPassword;
        return this.http.post(
          '/api/signup/',
          JSON.stringify(params),
          { headers: UserEffects.jsonHeaders }
        ).mergeMap((response): Observable<Action> => {
          if (!response.ok) {
            return Observable.throw(response);
          }
          return Observable.of(new UserActions.SignUp.Done());
        }).catch((response): Observable<Action> => {
          if (response.status === 400) {
            return Observable.of(
              new UserActions.SignUp.Failed(UserEffects.signUpFailedMessage)
            );
          }
          return Observable.of(
            new UserActions.SignIn.Failed('Unknown error.')
          );
        });
      }
    });

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
        if (!response.ok) {
          return Observable.throw(response);
        }
        const user: User = response.json();
        return Observable.of(new UserActions.SignIn.Done(user));
      }).catch((response): Observable<Action> => {
        if (response.status === 401) {
          return Observable.of(
            new UserActions.SignIn.Failed(UserEffects.signInFailedMessage)
          );
        }
        return Observable.of(
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
      this.http.get('/api/signout/')
      .mergeMap((response): Observable<Action> =>
        Observable.of(new UserActions.SignOut.Done())
      )
    );

  @Effect()
  signOutDone$: Observable<Action> =
    this.actions$.ofType(UserActions.SIGN_OUT_DONE)
    .map(_ => new RouterActions.GoByUrl('lobby'));

  @Effect()
  redirectWith$: Observable<Action> =
    this.actions$.ofType(UserActions.REDIRECT_WITH_SIGN_IN_STATE)
    .map((action: UserActions.RedirectWithSignInState) => action.payload)
    .mergeMap(({ when, goTo }) => {
      const signedIn = this.store.select('user').map(user => user.authUser).first();
      if (when === 'signed-in') {
        return signedIn.mergeMap(user =>
          user === null ?
          Observable.never() :
          Observable.of(new RouterActions.GoByUrl(goTo))
        );
      } else {
        return signedIn.mergeMap(user =>
          user === null ?
          Observable.of(new RouterActions.GoByUrl(goTo)) :
          Observable.never()
        );
      }
    });

  @Effect()
  verifySession$: Observable<Action> =
    this.actions$.ofType(UserActions.VERIFY_SESSION)
    .mergeMap(() =>
      this.http.get('/api/verify_session/')
      .mergeMap((response): Observable<Action> => {
        if (!response.ok) {
          return Observable.throw(response);
        }
        const user: User = response.json();
        return Observable.of(new UserActions.Verified(user));
      }).catch((response): Observable<Action> =>
        Observable.of(new UserActions.NeedSignIn())
      )
    );

  @Effect()
  verified$: Observable<Action> =
    this.actions$.ofType(UserActions.VERIFIED)
    .mergeMap(() =>
      this.store.select('router').first().map(router => {
        if (router == null) return '';
        else return router.state.url;
      })
    ).mergeMap((url): Observable<Action> => {
      return url === '/sign_in' ?
      Observable.of(new RouterActions.GoByUrl('lobby')) :
      Observable.never();
    });

  @Effect()
  verifyAccount$ =
    this.actions$.ofType(UserActions.VERIFY_ACCOUNT_START)
    .mergeMap((action: UserActions.VerifyAccount.Start) =>
      this.http.post(
        '/api/verify_account/',
        JSON.stringify({ token: action.token }),
        { headers: UserEffects.jsonHeaders }
      )
      .mergeMap((response): Observable<Action> => {
        if (!response.ok) {
          return Observable.throw(response);
        }
        return Observable.of(new UserActions.VerifyAccount.Done());
      })
      .catch((response): Observable<Action> => {
        if (response.status === 400) {
          return Observable.of(new UserActions.VerifyAccount.Failed('invalid'));
        } else if (response.status === 500) {
          return Observable.of(new UserActions.VerifyAccount.Failed('crash'));
        }
        return Observable.of(new UserActions.VerifyAccount.Failed('unknown'));
      })
    );

  constructor(
    private actions$: Actions,
    private http: Http,
    private store: Store<State>,
  ) {}
}
