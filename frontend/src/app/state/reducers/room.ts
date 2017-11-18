import { AppActions } from '../app-actions';
import * as RoomActions from '../actions/room';

import { Room } from '../../room';

export interface RoomState {
  rooms: Room[];
  currentError: string | null;
}

const initialState: RoomState = {
  rooms: [],
  currentError: null,
};

export function roomReducer(
  state: RoomState = initialState,
  action: AppActions
) {
  switch (action.type) {
    case RoomActions.GET_ROOMS_START:
      return { ...state, currentError: null };
    case RoomActions.GET_ROOMS_DONE:
      return { ...state, rooms: action.rooms, currentError: null };
    default:
      return state;
  }
}
