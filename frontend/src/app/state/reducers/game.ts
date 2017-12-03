import { AppActions } from '../app-actions';
import * as GameActions from '../actions/game';

import {
  Player as WebSocketPlayer,
  Room as WebSocketRoom
} from '../../websocket';

export interface GameState {
  room: WebSocketRoom | null;
  joiningTo: string | null;
}

const initialState: GameState = {
  room: null,
  joiningTo: null,
};

function applyPlayerState(room: WebSocketRoom, update: GameActions.PlayerState) {
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
      return initialState;
    case GameActions.ROOM_INFO:
      return { room: action.room, joiningTo: null };
    case GameActions.PLAYER_STATE_CHANGE:
      return { ...state, room: applyPlayerState(state.room, action.payload) };
    default:
      return state;
  }
}
