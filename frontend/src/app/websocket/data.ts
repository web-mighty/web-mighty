export interface PlayerCore {
  username: string;
}
export interface RoomPlayer extends PlayerCore {
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
export function cardToId(card: Card): string {
  if (card.rank === 'JK') {
    return 'JK';
  }
  return `${card.suit}${card.rank}`;
}

export type Giruda = 'S' | 'D' | 'C' | 'H' | 'N';

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
  players: RoomPlayer[];
}

export interface ReadyResult {
  ready: boolean;
}


export interface Deal {
  cards: Card[];
}

export interface BidCore {
  score: number;
  giruda: Giruda;
}
export interface BidWithdraw {
  bid: false;
}
export interface BidMake extends BidCore {
  bid: true;
}
export type Bid = BidWithdraw | BidMake;
export type BidEvent = PlayerCore & Bid;

export interface DealMiss {
  player: string;
  cards: Card[];
}

export type ElectionResult = PlayerCore & BidCore;

export namespace FriendDecl {
  export interface No {
    type: 'no';
  }
  export interface Card {
    type: 'card';
    card: Card;
  }
  export interface Player {
    type: 'player';
    player: string;
  }
  export interface Round {
    type: 'round';
    round: number;
  }
  export type Friend
    = No
    | Card
    | Player
    | Round
  ;
}
export type Friend = FriendDecl.Friend;
