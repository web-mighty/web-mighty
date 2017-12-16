export interface Player {
  username: string;
  ready: boolean;
}

export interface NormalCard {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  suit: 'S' | 'D' | 'C' | 'H';
}
export interface JokerCard {
  rank: 'JK';
}
export type Card = NormalCard | JokerCard;

export interface GenericError {
  type: string;
  reason: string;
}

export interface RoomJoin {
  room_id: string;
  password?: string;
}

export interface Room {
  room_id: string;
  title: string;
  player_number: number;
  players: Player[];
}

export interface ReadyResult {
  ready: boolean;
}


export interface Deal {
  cards: Card[];
}

export interface BidWithdraw {
  bid: false;
}
export interface BidMake {
  bid: true;
  score: number;
  giruda: string;
}
export type Bid = BidWithdraw | BidMake;

export interface DealMiss {
  player: string;
  cards: Card[];
}

export interface ElectionResult {
  player: string;
  score: number;
  giruda: string;
}
