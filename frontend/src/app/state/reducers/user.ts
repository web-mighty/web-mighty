import { AppActions } from '../app-actions';
import * as UserActions from '../actions/user';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';

import { User } from '../../user';
import { Profile } from '../../profile';

interface AccountVerificationState {
  status: 'none' | 'required' | 'pending' | 'done' | 'failed';
  failureReason: UserActions.VerifyAccount.FailureReason | null;
}

export interface UserState {
  cold: boolean;
  accountVerification: AccountVerificationState;
  verifying: boolean;
  authUser: User | null;
  currentError: string | null;
}

const verificationInitialState: AccountVerificationState = {
  status: 'none',
  failureReason: null,
};

const initialState: UserState = {
  cold: true,
  accountVerification: verificationInitialState,
  verifying: false,
  authUser: null,
  currentError: null,
};

export function userReducer(
  state: UserState = initialState,
  action: AppActions
) {
  switch (action.type) {
    case ROUTER_NAVIGATION:
      return { ...state, accountVerification: verificationInitialState, currentError: null };
    case UserActions.SIGN_UP_START:
      return { ...state, currentError: null };
    case UserActions.SIGN_UP_DONE:
      return {
        ...state,
        accountVerification: {
          status: 'required',
          failureReason: null,
        },
        currentError: null,
      };
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
    case UserActions.NEED_SIGN_IN:
      return { ...state, cold: false, verifying: false };
    case UserActions.VERIFIED:
      return { ...state, cold: false, verifying: false, authUser: action.user, currentError: null };
    case UserActions.VERIFY_ACCOUNT_START:
      return {
        ...state,
        accountVerification: {
          status: 'pending',
          failureReason: null,
        },
      };
    case UserActions.VERIFY_ACCOUNT_DONE:
      return {
        ...state,
        accountVerification: {
          status: 'done',
          failureReason: null,
        },
      };
    case UserActions.VERIFY_ACCOUNT_FAILED:
      return {
        ...state,
        accountVerification: {
          status: 'failed',
          failureReason: action.reason,
        },
      };
    default:
      return state;
  }
}
