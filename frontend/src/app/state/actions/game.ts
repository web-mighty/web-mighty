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
export const FRIEND_SELECT_EVENT = 'Game: Friend select event';
export const SELECT_CARD = 'Game: Select card';
export const TURN_EVENT = 'Game: Turn event';
export const PLAY_CARD = 'Game: Play card';
export const PLAY_CARD_EVENT = 'Game: Play card event';
export const ROUND_END = 'Game: Round end';

export const ROOM_INFO = 'Game: Room info';
export const PLAYER_STATE_CHANGE = 'Game: Player state change';


export namespace FriendSelect {
  export const CHANGE_TYPE = 'Game: Friend Select: Change type';
  export const TOGGLE_JOKER = 'Game: Friend Select: Toggle joker';
  export const CHANGE_CARD = 'Game: Friend Select: Change card';
  export const CHANGE_PLAYER = 'Game: Friend Select: Change player';
  export const CHANGE_ROUND = 'Game: Friend Select: Change round';
  export const CONFIRM = 'Game: Friend Select: Confirm';
  export const FAILED = 'Game: Friend Select: Failed';

  export class ChangeType implements Action {
    readonly type = CHANGE_TYPE;

    constructor(public friendType: WebSocket.Data.FriendType) {}
  }

  export class ToggleJoker implements Action {
    readonly type = TOGGLE_JOKER;
  }

  export class ChangeCard implements Action {
    readonly type = CHANGE_CARD;

    constructor(public cardSpec: {
      suit?: WebSocket.Data.CardSuit,
      rank?: WebSocket.Data.CardRank,
    }) {}
  }

  export class ChangePlayer implements Action {
    readonly type = CHANGE_PLAYER;

    constructor(public player: string) {}
  }

  export class ChangeRound implements Action {
    readonly type = CHANGE_ROUND;

    constructor(public round: number) {}
  }

  export class Confirm implements Action {
    readonly type = CONFIRM;

    constructor(public payload: {
      friendDecl: WebSocket.Data.Friend,
      discardCards: WebSocket.Data.Card[],
    }) {}
  }

  export class Failed implements Action {
    readonly type = FAILED;

    constructor(public error: string) {}
  }

  export type Actions
    = ChangeType
    | ToggleJoker
    | ChangeCard
    | ChangePlayer
    | ChangeRound
    | Confirm
    | Failed
  ;
}

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

export class FriendSelectEvent implements Action {
  readonly type = FRIEND_SELECT_EVENT;

  constructor(public payload: WebSocket.Data.FriendSelectEvent) {}
}

export class SelectCard implements Action {
  readonly type = SELECT_CARD;

  constructor(public card: WebSocket.Data.Card) {}
}

export class TurnEvent implements Action {
  readonly type = TURN_EVENT;

  constructor(public player: string) {}
}

export class PlayCard implements Action {
  readonly type = PLAY_CARD;

  constructor(public payload: {
    card: WebSocket.Data.Card,
    jokerCall?: boolean,
  }) {}
}

export class PlayCardEvent implements Action {
  readonly type = PLAY_CARD_EVENT;

  constructor(
    public player: string,
    public card: WebSocket.Data.Card,
    public jokerCall: boolean,
    public gan: boolean,
  ) {}
}

export class RoundEnd implements Action {
  readonly type = ROUND_END;

  constructor(
    public player: string,
    public scoreCards: WebSocket.Data.Card[],
  ) {}
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
  | FriendSelectEvent
  | SelectCard
  | TurnEvent
  | PlayCard
  | PlayCardEvent
  | RoundEnd
  | RoomInfo
  | PlayerStateChange
  | FriendSelect.Actions
;
