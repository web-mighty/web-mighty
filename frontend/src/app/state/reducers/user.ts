import { AppActions } from '../app-actions';
import * as UserActions from '../actions/user';

import { User } from '../../user';
import { Profile } from '../../profile';

export interface UserState {
  verifying: boolean;
  authUser: User | null;
  currentError: string | null;
}

const initialState: UserState = {
  verifying: false,
  authUser: null,
  currentError: null,
};

export function userReducer(
  state: UserState = initialState,
  action: AppActions
) {
  if (action.type !== UserActions.VERIFY_SESSION) {
    state = { ...state, verifying: false };
  }
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
    case UserActions.VERIFY_SESSION:
      return { ...state, verifying: true };
    case UserActions.VERIFIED:
      return { ...state, authUser: action.user, currentError: null };
    default:
      return state;
  }
}
