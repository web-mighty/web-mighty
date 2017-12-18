export interface PlayerCore {
  username: string;
}
export interface PlayerData {
  player: string;
}
export interface RoomPlayer extends PlayerCore {
  ready: boolean;
}

export type CardRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type CardSuit = 'S' | 'D' | 'C' | 'H';
export interface NormalCard {
  rank: CardRank;
  suit: CardSuit;
}
export interface JokerCard {
  rank: 'JK';
  suit?: CardSuit;
}
export type Card = NormalCard | JokerCard;
export function cardToId(card: Card): string {
  if (card.rank === 'JK') {
    return 'JK';
  }
  return `${card.suit}${card.rank}`;
}

export interface CardPlay {
  card: Card;
  joker_call?: boolean;
  gan: boolean;
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
export type BidEvent = PlayerData & Bid;

export interface DealMiss {
  player: string;
  cards: Card[];
}

export type ElectionResult = PlayerData & BidCore;

export namespace FriendDecl {
  export interface NoFriend {
    type: 'no';
  }
  export interface CardFriend {
    type: 'card';
    card: Card;
  }
  export interface PlayerFriend {
    type: 'player';
    player: string;
  }
  export interface RoundFriend {
    type: 'round';
    round: number;
  }
  export type Friend
    = NoFriend
    | CardFriend
    | PlayerFriend
    | RoundFriend
  ;
}
export type FriendType = 'no' | 'card' | 'player' | 'round';
export type Friend = FriendDecl.Friend;

export interface FloorCards {
  floor_cards: Card[];
}
export interface ChangeBid {
  change_bid?: BidCore;
}
export type FriendSelectRequest = FloorCards & Friend & ChangeBid;
export type FriendSelectEvent = Friend & ChangeBid;
