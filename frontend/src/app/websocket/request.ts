import * as Data from './data';

export class RoomJoin {
  action = 'room-join';
  constructor(public data: Data.RoomJoin) {}
}

export class RoomLeave {
  action = 'room-leave';
  data = {};
}

export class RoomReady {
  action = 'room-ready';
  data: { ready: boolean };
  constructor(ready: boolean) { this.data = { ready };
  }
}

export class RoomStart {
  action = 'room-start';
  data = {};
}

export class GameplayBid {
  action = 'gameplay-bid';
  constructor(public data: Data.Bid) {}
}

export class FriendSelect {
  action = 'gameplay-friend-select';
  constructor(public data: Data.FriendSelectRequest) {}
}

export class Play {
  action = 'gameplay-play';
  constructor(public data: {
    card: Data.Card,
    joker_call?: boolean,
    joker_suit?: Data.CardSuit,
  }) {}
}

export class Continue {
  action = 'gameplay-continue';
  data = { 'continue': true };
}

export class AiAdd {
  action = 'room-ai-add';
  data = {};
}
export class AiDelete {
  action = 'room-ai-delete';
  data: { ai_name: string };

  constructor(ai_name: string) {
    this.data = { ai_name };
  }
}

export type Request
  = RoomJoin
  | RoomLeave
  | RoomReady
  | RoomStart
  | GameplayBid
  | Play
  | AiAdd
  | AiDelete
;
