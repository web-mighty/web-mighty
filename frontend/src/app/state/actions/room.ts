import { Action } from '@ngrx/store';

import { Room } from '../../room';

export const GET_ROOMS_START = 'Room: Get rooms: start';
export const GET_ROOMS_DONE = 'Room: Get rooms: done';
export const GET_ROOMS_FAILED = 'Room: Get rooms: failed';

export const CREATE_ROOM_START = 'Room: Create room: start';
export const CREATE_ROOM_DONE = 'Room: Create room: done';
export const CREATE_ROOM_FAILED = 'Room: Create room: failed';

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

    constructor(public roomList: Room[]) {}
  }
  export class Failed implements Action {
    readonly type = GET_ROOMS_FAILED;

    constructor(public error: string) {}
  }
}

export namespace CreateRoom {
  export class Start implements Action {
    readonly type = CREATE_ROOM_START;

    constructor(public payload: {
      title: string;
      password?: string;
      player_number: number;
    }) {}
  }
  export class Done implements Action {
    readonly type = CREATE_ROOM_DONE;

    constructor(public room: Room) {}
  }
  export class Failed implements Action {
    readonly type = CREATE_ROOM_FAILED;

    constructor(public error: string) {}
  }
}

export type Actions
  = GetRooms.Start
  | GetRooms.Done
  | GetRooms.Failed
  | CreateRoom.Start
  | CreateRoom.Done
  | CreateRoom.Failed;
