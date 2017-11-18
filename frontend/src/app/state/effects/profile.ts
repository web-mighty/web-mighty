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

import { Profile } from '../../profile';
import { State } from '../reducer';
import * as RouterActions from '../actions/router';
import * as ProfileActions from '../actions/profile';

@Injectable()
export class ProfileEffects {
  private static profileNotFoundMessage =
    'Profile not found.';

  private static editForbiddenMessage =
    'You are not allowed to edit this profile.';

  private static jsonHeaders = new Headers({
    'Content-Type': 'application/json',
  });

  @Effect()
  get$: Observable<Action> =
    this.actions$.ofType(ProfileActions.GET_START)
    .mergeMap((action: ProfileActions.Get.Start) => {
      const username = action.username;
      return this.http.get(`/api/profile/${username}/`)
      .mergeMap((response): Observable<Action> => {
        if (!response.ok) {
          return Observable.throw(response);
        }
        const profile: Profile = response.json();
        return Observable.of(new ProfileActions.Get.Done(profile));
      })
      .catch((response): Observable<Action> => {
        if (response.status === 404) {
          return Observable.of(
            new ProfileActions.Get.Failed(
              ProfileEffects.profileNotFoundMessage,
              username
            )
          );
        }
        return Observable.of(
          new ProfileActions.Get.Failed(
            'Unknown error.',
            username
          )
        );
      });
    });

  @Effect()
  edit$: Observable<Action> =
    this.actions$.ofType(ProfileActions.EDIT_START)
    .mergeMap(({baseProfile, payload}: ProfileActions.Edit.Start) => {
      const username = baseProfile.user.username;
      const nickname = ('nickname' in payload) ? payload.nickname : baseProfile.nickname;
      return this.http.post(
        `/api/profile/${username}/`,
        JSON.stringify({ nickname })
      )
      .mergeMap((response): Observable<Action> => {
        if (!response.ok) {
          return Observable.throw(response);
        }
        return Observable.of(new ProfileActions.Edit.Done(username));
      })
      .catch((response): Observable<Action> => {
        if (response.status === 401) {
          return Observable.of(
            new ProfileActions.Edit.Failed('Please sign in.', username) as Action,
            new RouterActions.GoByUrl('sign_in') as Action,
            null
          );
        }
        if (response.status === 403) {
          return Observable.of(
            new ProfileActions.Edit.Failed(
              ProfileEffects.editForbiddenMessage,
              username
            )
          );
        }
        return Observable.of(
          new ProfileActions.Edit.Failed(
            'Unknown error.',
            username
          )
        );
      });
    });

  constructor(
    private actions$: Actions,
    private http: Http,
    private store: Store<State>,
  ) {}
}
