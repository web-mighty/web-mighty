import { AppActions } from '../app-actions';
import * as GameActions from '../actions/game';
import * as WebSocketActions from '../actions/websocket';

import * as WebSocket from '../../websocket';

export namespace MightyState {
  export interface Bidding {
    type: 'bidding';
    bidHistory: { username: string, bid: WebSocket.Data.Bid }[];
  }
  export interface Elected {
    type: 'elected';
    result: WebSocket.Data.ElectionResult;
  }

  export type State
    = Bidding
    | Elected
  ;
}

export namespace GameRoomState {
  export interface NotInRoom {
    type: 'not-in-room';
  }
  export interface Joining {
    type: 'joining';
    to: string;
  }
  export interface NotStarted {
    type: 'not-started';
    room: WebSocket.Data.Room;
  }
  export interface Started {
    type: 'started';
    hand: WebSocket.Data.Card[];
    room: WebSocket.Data.Room;
    turnOf: string;
    state: MightyState.State;
  }
  export interface Leaving {
    type: 'leaving';
  }

  export type State
    = NotInRoom
    | Joining
    | NotStarted
    | Started
    | Leaving
  ;
}

export type GameState = GameRoomState.State;


function getPlayerUsernames(room: WebSocket.Data.Room) {
  return room.players.map(player => player.username);
}

const initialState: GameState = {
  type: 'not-in-room',
};

function applyPlayerState(
  room: WebSocket.Data.Room,
  update: GameActions.PlayerState
) {
  if (update.left) {
    const players = room.players.filter(p => p.username !== update.username);
    return {
      ...room,
      players,
    };
  }
  const players = room.players.map(p => {
    if (p.username === update.username) {
      return {
        ...p,
        ready: update.ready,
      };
    }
    return p;
  });
  if (!players.find(p => p.username === update.username)) {
    players.push({
      username: update.username,
      ready: update.ready,
    });
  }
  return {
    ...room,
    players,
  };
}

export function gameReducer(
  state: GameState = initialState,
  action: AppActions
) {
  switch (action.type) {
    case GameActions.JOIN_ROOM:
      return { type: 'joining', to: action.payload.roomId };
    case GameActions.JOIN_ROOM_FAILED:
      return initialState;
    case GameActions.LEAVE_ROOM:
      return { type: 'leaving' };
    case GameActions.LEAVE_ROOM_DONE:
      return initialState;
    case GameActions.ROOM_INFO:
      return { type: 'not-started', room: action.room };
    case GameActions.PLAYER_STATE_CHANGE:
      if (state.type !== 'not-started') {
        console.error('PLAYER_STATE_CHANGE received outside room.');
        return state;
      }
      return { ...state, room: applyPlayerState(state.room, action.payload) };
    case GameActions.RESET_ROOM:
      if (state.type !== 'started') {
        console.error('RESET_ROOM received, but game haven\'t started');
        return state;
      }
      return {
        type: 'not-started',
        room: {
          ...state.room,
          players: action.players,
        },
      };
    case GameActions.STARTED:
      if (state.type !== 'not-started') {
        console.error('STARTED received outside room.');
        return state;
      }
      return {
        type: 'started',
        hand: [],
        room: state.room,
        turnOf: state.room.players[0].username,
        state: {
          type: 'bidding',
          bidHistory: [],
        },
      };
    case GameActions.DEAL:
      if (state.type !== 'started') {
        console.error('DEAL received, but game haven\'t started');
        return state;
      }
      return {
        ...state,
        hand: action.cards,
      };
    case WebSocketActions.DISCONNECTED:
    case WebSocketActions.DUPLICATE_SESSION:
      return initialState;
    default:
      return state;
  }
}
