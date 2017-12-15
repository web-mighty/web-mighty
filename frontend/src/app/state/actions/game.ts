import { Action } from '@ngrx/store';

import * as WebSocket from '../../websocket';

export const JOIN_ROOM = 'Game: Join room';
export const JOIN_ROOM_FAILED = 'Game: Join room: Failed';
export const LEAVE_ROOM = 'Game: Leave room';
export const LEAVE_ROOM_DONE = 'Game: Leave room: Done';
export const READY = 'Game: Ready';
export const START = 'Game: Start';

export const STARTED = 'Game: Started';
export const DEAL = 'Game: Deal';

export const ROOM_INFO = 'Game: Room info';
export const PLAYER_STATE_CHANGE = 'Game: Player state change';


export interface PlayerState {
  username: string;
  left: boolean;
  ready: boolean;
}

export class JoinRoom implements Action {
  readonly type = JOIN_ROOM;

  constructor(public payload: {
    roomId: string,
    password?: string,
  }) {}
}

export class JoinRoomFailed implements Action {
  readonly type = JOIN_ROOM_FAILED;

  constructor(public error: string) {}
}

export class LeaveRoom implements Action {
  readonly type = LEAVE_ROOM;
}

export class LeaveRoomDone implements Action {
  readonly type = LEAVE_ROOM_DONE;
}

export class Ready implements Action {
  readonly type = READY;

  constructor(public ready: boolean) {}
}

export class Start implements Action {
  readonly type = START;
}

export class Started implements Action {
  readonly type = STARTED;
}

export class Deal implements Action {
  readonly type = DEAL;

  constructor(public cards: WebSocket.Data.Card[]) {}
}

export class RoomInfo implements Action {
  readonly type = ROOM_INFO;

  constructor(public room: WebSocket.Data.Room) {}
}

export class PlayerStateChange implements Action {
  readonly type = PLAYER_STATE_CHANGE;

  constructor(public payload: PlayerState) {}
}

export type Actions
  = JoinRoom
  | JoinRoomFailed
  | LeaveRoom
  | LeaveRoomDone
  | Ready
  | Start
  | Started
  | Deal
  | RoomInfo
  | PlayerStateChange
;
