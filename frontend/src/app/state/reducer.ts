import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { UserState, userReducer } from './reducers/user';
import { ProfileState, profileReducer } from './reducers/profile';

export interface State {
  user: UserState;
  router: RouterReducerState;
  profile: ProfileState;
}
export const reducers = {
  user: userReducer,
  router: routerReducer,
  profile: profileReducer,
};
