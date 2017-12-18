import { AppActions } from '../app-actions';

import * as HallOfFameActions from '../actions/hall-of-fame';

export interface UserInfo {
  username: string;
  avatar: string;
}
export interface WinsInfo extends UserInfo {
  wins: number;
}

export interface HallOfFameState {
  wins: WinsInfo[];
}

const initialState: HallOfFameState = {
  wins: [],
};

export function hallOfFameReducer(
  state: HallOfFameState = initialState,
  action: AppActions
): HallOfFameState {
  switch (action.type) {
    case HallOfFameActions.Get.DONE:
      return {
        wins: action.hof,
      };
    default:
      return state;
  }
}
