import { AppActions } from '../app-actions';
import * as RoomActions from '../actions/room';

import { Room } from '../../room';

export interface RoomState {
  roomList: Room[];
  room: Room | null;
  currentError: string | null;
}

const initialState: RoomState = {
  roomList: [],
  room: null,
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
      return { ...state, roomList: action.roomList, currentError: null };
    case RoomActions.CREATE_ROOM_START:
      return { ...state, currentError: null };
    case RoomActions.CREATE_ROOM_DONE:
      return { ...state, room: action.room, currentError: null };
    case RoomActions.CREATE_ROOM_FAILED:
      return { ...state, currentError: action.error };
    default:
      return state;
  }
}
