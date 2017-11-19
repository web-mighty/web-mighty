import { AppActions } from '../app-actions';
import * as ProfileActions from '../actions/profile';

import { Profile } from '../../profile';

interface ProfileLoadingState {
  state: 'loading';
}
interface ProfileLoadedState {
  state: 'loaded';
  profile: Profile;
}
type ProfileInfoState = ProfileLoadingState | ProfileLoadedState;

interface ProfileGetState {
  currentError: string | null;
}
const profileGetInitialState: ProfileGetState = {
  currentError: null,
};

interface ProfileEditState {
  currentError: string | null;
}
const profileEditInitialState: ProfileEditState = {
  currentError: null,
};

export interface ProfileState {
  profiles: { [username: string]: ProfileInfoState };
  get: ProfileGetState;
  edit: ProfileEditState;
}

const initialState: ProfileState = {
  profiles: {},
  get: profileGetInitialState,
  edit: profileEditInitialState,
};

export function profileReducer(
  state: ProfileState = initialState,
  action: AppActions
) {
  switch (action.type) {
    case ProfileActions.GET_START:
      return {
        ...state,
        profiles: {
          ...state.profiles,
          [action.username]: {
            state: 'loading',
          },
        },
        get: {
          ...state.get,
          currentError: null,
        },
      };
    case ProfileActions.GET_DONE:
      return {
        ...state,
        profiles: {
          ...state.profiles,
          [action.profile.user.username]: {
            state: 'loaded',
            profile: action.profile,
          },
        },
        get: {
          ...state.get,
          currentError: null,
        },
      };
    case ProfileActions.GET_FAILED: {
      const profiles = { ...state.profiles };
      delete profiles[action.username];
      return {
        ...state,
        profiles,
        get: {
          ...state.get,
          currentError: action.error,
        },
      };
    }
    case ProfileActions.EDIT_START:
      return {
        ...state,
        edit: {
          ...state.edit,
          currentError: null,
        },
      };
    case ProfileActions.EDIT_DONE:
      return {
        ...state,
        edit: {
          ...state.edit,
          currentError: null,
        },
      };
    case ProfileActions.EDIT_FAILED:
      return {
        ...state,
        edit: {
          ...state.edit,
          currentError: action.error,
        },
      };
    default:
      return state;
  }
}
