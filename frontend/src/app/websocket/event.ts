import { GenericError, Card } from './data';

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
export interface RoomReady {
  event: 'room-ready';
  data: {
    player: string;
    ready: boolean;
  };
}
export interface RoomStart {
  event: 'room-start';
  data: {};
}
export interface Deal {
  event: 'gameplay-deal';
  data: {
    cards: Card[];
  };
}
export type Event
  = Error
  | Connected
  | RoomJoin
  | RoomLeave
  | RoomReady
  | RoomStart
  | Deal
;
