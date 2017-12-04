import { AppActions } from '../app-actions';
import * as GameActions from '../actions/game';

import * as WebSocket from '../../websocket';

export interface GameState {
  room: WebSocket.Data.Room | null;
  joiningTo: string | null;
  leaving: boolean;
}

const initialState: GameState = {
  room: null,
  joiningTo: null,
  leaving: false,
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
      return { ...initialState, joiningTo: action.payload.roomId };
    case GameActions.JOIN_ROOM_FAILED:
      return initialState;
    case GameActions.LEAVE_ROOM:
      return { ...state, leaving: true };
    case GameActions.LEAVE_ROOM_DONE:
      return initialState;
    case GameActions.ROOM_INFO:
      return { room: action.room, joiningTo: null, leaving: false };
    case GameActions.PLAYER_STATE_CHANGE:
      return { ...state, room: applyPlayerState(state.room, action.payload) };
    default:
      return state;
  }
}
