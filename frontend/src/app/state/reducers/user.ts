import { AppActions } from '../app-actions';
import * as UserActions from '../actions/user';

import { Profile } from '../../profile';

export type UserState = {
  authUser: Profile | null;
  currentError: string | null;
};

const initialState: UserState = {
  authUser: null,
  currentError: null,
};

export function userReducer(
  state: UserState = initialState,
  action: AppActions
) {
  switch (action.type) {
    case UserActions.SIGN_UP_START:
      return { ...state, currentError: null };
    case UserActions.SIGN_UP_DONE:
      return { ...state, currentError: null };
    case UserActions.SIGN_UP_FAILED:
      return { ...state, currentError: action.error };
    case UserActions.SIGN_IN_START:
      return { ...state, authUser: null, currentError: null };
    case UserActions.SIGN_IN_DONE:
      return { ...state, authUser: action.user, currentError: null };
    case UserActions.SIGN_IN_FAILED:
      return { ...state, currentError: action.error };
    case UserActions.SIGN_OUT_DONE:
      return { ...state, authUser: null, currentError: null };
    default:
      return state;
  }
}
