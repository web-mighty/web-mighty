import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { UserState, userReducer } from './reducers/user';

export interface State {
  user: UserState;
  router: RouterReducerState;
}
export const reducers = {
  user: userReducer,
  router: routerReducer,
};
