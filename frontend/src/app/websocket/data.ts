export interface Player {
  username: string;
  ready: boolean;
}

export class Card {
  constructor(
    public rank: number,
    public suit: 'S' | 'D' | 'C' | 'H' | 'JK'
  ) {}

  toString() {
    if (this.suit === 'JK') return 'JK';
    return `${this.rank}${this.suit}`;
  }
}

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
