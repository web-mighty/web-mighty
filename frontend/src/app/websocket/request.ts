import * as Data from './data';

export class RoomJoin {
  action = 'room-join';
  constructor(public data: Data.RoomJoin) {}
}

export class RoomLeave {
  action = 'room-leave';
  data = {};
}

export type Request
  = RoomJoin
  | RoomLeave
;
