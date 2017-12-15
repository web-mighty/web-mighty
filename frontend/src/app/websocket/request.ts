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

export type Request
  = RoomJoin
  | RoomLeave
  | RoomReady
;
