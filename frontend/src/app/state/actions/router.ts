import { Action } from '@ngrx/store';
import { NavigationExtras } from '@angular/router';

export const GO = 'Router: Go';
export const GO_BY_URL = 'Router: Go by URL';
export const BACK = 'Router: Back';
export const FORWARD = 'Router: Forward';

export class Go implements Action {
  readonly type = GO;

  constructor(public payload: {
    path: any[];
    query?: object;
    extras?: NavigationExtras;
  }) {}
}

export class GoByUrl implements Action {
  readonly type = GO_BY_URL;

  constructor(public url: string) {}
}

export class Back implements Action {
  readonly type = BACK;
}

export class Forward implements Action {
  readonly type = FORWARD;
}

export type Actions
  = Go
  | GoByUrl
  | Back
  | Forward;
