import { UserState, userReducer } from './reducers/user';

export interface State {
  user: UserState;
}
export const reducers = {
  user: userReducer,
};
