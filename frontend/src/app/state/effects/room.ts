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

import { Room } from '../../room';
import { State } from '../reducer';
import * as RoomActions from '../actions/room';

@Injectable()
export class RoomEffects {
  private static getRoomsFailedMessage =
    'Getting room list failed';

  private static jsonHeaders = new Headers({
    'Content-Type': 'application/json',
  });

  //TODO: implement effects
  @Effect()
  getRooms$: Observable<Action> =
    this.actions$.ofType(RoomActions.GET_ROOMS_START)
    .map((action: RoomActions.GetRooms.Start) => action.payload)
    .mergeMap(params =>
      this.http.get('/api/room/',
        JSON.stringify(params)
      ).mergeMap((response): Observable<Action> => {
        const rooms: Room[] = response.json();
        return Observable.of(new RoomActions.GetRooms.Done(rooms));
      })
    );

  constructor(
    private actions$: Actions,
    private http: Http,
    private store: Store<State>,
  ) {}
}
