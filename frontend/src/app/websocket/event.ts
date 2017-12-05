import { GenericError } from './data';

export interface Error {
  event: 'error';
  data: GenericError;
}
export interface Connected {
  event: 'connected';
  data: {};
}
export interface RoomJoin {
  event: 'room-join';
  data: {
    player: string;
  };
}
export interface RoomLeave {
  event: 'room-leave';
  data: {
    player: string;
  };
}
export type Event
  = Error
  | Connected
  | RoomJoin
  | RoomLeave
;
