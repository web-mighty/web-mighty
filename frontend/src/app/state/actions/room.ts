import { Action } from '@ngrx/store';

import { Room } from '../../room';

export const GET_ROOMS_START = 'Room: Get rooms: start';
export const GET_ROOMS_DONE = 'Room: Get rooms: done';

export namespace GetRooms {
  export class Start implements Action {
    readonly type = GET_ROOMS_START;

    constructor(public payload: {
      page: number;
      count_per_page: number;
    }) {}
  }
  export class Done implements Action {
    readonly type = GET_ROOMS_DONE;

    constructor(public rooms: Room[]) {}
  }
}

export type Actions
 = GetRooms.Start
 | GetRooms.Done
