import * as Data from './data';

export interface Error {
  event: 'error';
  data: Data.GenericError;
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
export interface RoomReset {
  event: 'room-reset';
  data: {
    room_id: string;
    players: Data.RoomPlayer[];
  };
}
export interface RoomStart {
  event: 'room-start';
  data: {};
}
export interface Deal {
  event: 'gameplay-deal';
  data: Data.Deal;
}
export interface Bidding {
  event: 'gameplay-bidding';
  data: {
    player: string;
  };
}
export interface Bid {
  event: 'gameplay-bid';
  data: Data.BidEvent;
}
export interface PresidentElected {
  event: 'gameplay-president-elected';
  data: Data.ElectionResult;
}
export interface FloorCards {
  event: 'gameplay-floor-cards';
  data: {
    floor_cards: Data.Card[];
  };
}
export interface FriendSelecting {
  event: 'gameplay-friend-selecting';
  data: {
    player: string;
  };
}
export interface FriendSelectDone {
  event: 'gameplay-friend-select';
  data: Data.FriendSelectEvent;
}
export interface Turn {
  event: 'gameplay-turn';
  data: {
    player: string;
  };
}
export interface Play {
  event: 'gameplay-play';
  data: {
    player: string;
    card: Data.Card;
    joker_call: boolean;
    gan: boolean;
  };
}
export interface RoundEnd {
  event: 'gameplay-round-end';
  data: {
    player: string;
    score_cards: Data.Card[];
  };
}
export type Event
  = Error
  | Connected
  | RoomJoin
  | RoomLeave
  | RoomReady
  | RoomReset
  | RoomStart
  | Deal
  | Bidding
  | Bid
  | PresidentElected
  | FloorCards
  | FriendSelecting
  | FriendSelectDone
  | Turn
  | Play
  | RoundEnd
;
