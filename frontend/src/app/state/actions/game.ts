import { Action } from '@ngrx/store';

import * as WebSocket from '../../websocket';

export const JOIN_ROOM = 'Game: Join room';
export const JOIN_ROOM_FAILED = 'Game: Join room: Failed';
export const LEAVE_ROOM = 'Game: Leave room';
export const LEAVE_ROOM_DONE = 'Game: Leave room: Done';
export const RESET_ROOM = 'Game: Reset room';
export const READY = 'Game: Ready';
export const START = 'Game: Start';

export const STARTED = 'Game: Started';
export const DEAL = 'Game: Deal';
export const BIDDING = 'Game: Bidding';
export const BID = 'Game: Bid';
export const BID_EVENT = 'Game: Bid (Event)';
export const PRESIDENT_ELECTED = 'Game: President elected';
export const FLOOR_CARDS = 'Game: Floor cards';

export const FRIEND_SELECTING = 'Game: Friend selecting';
export const SELECT_CARD = 'Game: Select card';
export const PLAY_CARD = 'Game: Play card';

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

export class ResetRoom implements Action {
  readonly type = RESET_ROOM;

  constructor(
    public roomId: string,
    public players: WebSocket.Data.RoomPlayer[]
  ) {}
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

export class Bidding implements Action {
  readonly type = BIDDING;

  constructor(public player: string) {}
}

export class Bid implements Action {
  readonly type = BID;

  constructor(public bid: WebSocket.Data.Bid) {}
}

export class BidEvent implements Action {
  readonly type = BID_EVENT;

  constructor(public bid: WebSocket.Data.BidEvent) {}
}

export class PresidentElected implements Action {
  readonly type = PRESIDENT_ELECTED;

  constructor(public result: WebSocket.Data.ElectionResult) {}
}

export class FloorCards implements Action {
  readonly type = FLOOR_CARDS;

  constructor(public cards: WebSocket.Data.Card[]) {}
}

export class FriendSelecting implements Action {
  readonly type = FRIEND_SELECTING;

  constructor(public player: string) {}
}

export class SelectCard implements Action {
  readonly type = SELECT_CARD;

  constructor(public card: WebSocket.Data.Card) {}
}

export class PlayCard implements Action {
  readonly type = PLAY_CARD;

  constructor(public card: WebSocket.Data.Card) {}
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
  | ResetRoom
  | Ready
  | Start
  | Started
  | Deal
  | Bidding
  | Bid
  | BidEvent
  | PresidentElected
  | FloorCards
  | FriendSelecting
  | SelectCard
  | PlayCard
  | RoomInfo
  | PlayerStateChange
;
