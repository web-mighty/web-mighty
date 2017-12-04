import { Action } from '@ngrx/store';

import {
  Player as WebSocketPlayer,
  Room as WebSocketRoom
} from '../../websocket';

export const JOIN_ROOM = 'Game: Join room';
export const JOIN_ROOM_FAILED = 'Game: Join room: Failed';
export const LEAVE_ROOM = 'Game: Leave room';
export const LEAVE_ROOM_DONE = 'Game: Leave room: Done';

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

export class RoomInfo implements Action {
  readonly type = ROOM_INFO;

  constructor(public room: WebSocketRoom) {}
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
  | RoomInfo
  | PlayerStateChange
;
