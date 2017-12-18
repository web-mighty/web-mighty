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
  data: Data.PlayerData;
}
export interface RoomLeave {
  event: 'room-leave';
  data: Data.PlayerData;
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
    players: Data.RoomPlayer[];
  };
}
export interface RoomStart {
  event: 'room-start';
  data: {
    players: Data.RoomPlayer[];
  };
}
export interface Deal {
  event: 'gameplay-deal';
  data: Data.Deal;
}
export interface Bidding {
  event: 'gameplay-bidding';
  data: Data.PlayerData;
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
  data: Data.PlayerData;
}
export interface FriendSelectDone {
  event: 'gameplay-friend-select';
  data: Data.FriendSelectEvent;
}
export interface Turn {
  event: 'gameplay-turn';
  data: Data.PlayerData;
}
export interface FriendRevealed {
  event: 'gameplay-friend-revealed';
  data: Data.PlayerData;
}
export interface Play {
  event: 'gameplay-play';
  data: Data.PlayerData & Data.CardPlay;
}
export interface RoundEnd {
  event: 'gameplay-round-end';
  data: {
    player: string;
    score_cards: Data.Card[];
  };
}
export interface GameEnd {
  event: 'gameplay-game-end';
  data: Data.GameResult;
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
  | FriendRevealed
  | Play
  | RoundEnd
  | GameEnd
;
