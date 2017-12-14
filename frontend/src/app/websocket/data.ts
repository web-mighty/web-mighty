export interface GenericError {
  type: string;
  reason: string;
}

export interface RoomJoin {
  room_id: string;
  password?: string;
}

export interface Player {
  username: string;
  ready: boolean;
}

export interface Room {
  room_id: string;
  title: string;
  players: Player[];
}

export interface ReadyResult {
  ready: boolean;
}
