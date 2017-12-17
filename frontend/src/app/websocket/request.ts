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
  constructor(ready: boolean) {
    this.data = { ready };
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

export type Request
  = RoomJoin
  | RoomLeave
  | RoomReady
  | RoomStart
  | GameplayBid
;
