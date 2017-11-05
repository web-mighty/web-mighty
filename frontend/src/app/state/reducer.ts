import { UserState, userReducer } from './reducers/user';

export type State = {
  user: UserState,
};
export const reducers = {
  user: userReducer,
};
