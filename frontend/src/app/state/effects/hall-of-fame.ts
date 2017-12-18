import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import { Action } from '@ngrx/store';
import { Effect, Actions } from '@ngrx/effects';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';

import * as HallOfFameActions from '../actions/hall-of-fame';

@Injectable()
export class HallOfFameEffects {
  @Effect()
  get$ =
    this.actions$.ofType(HallOfFameActions.Get.START)
    .mergeMap(() =>
      this.http.get('/api/hall_of_fame/')
      .mergeMap((response): Observable<Action> => {
        if (!response.ok) {
          return Observable.throw(response);
        }
        return Observable.of(new HallOfFameActions.Get.Done(response.json()));
      })
      .catch((response): Observable<Action> => {
        return Observable.of(
          new HallOfFameActions.Get.Failed('Unknown error.')
        );
      })
    );

  constructor(
    private actions$: Actions,
    private http: Http,
  ) {}
}
