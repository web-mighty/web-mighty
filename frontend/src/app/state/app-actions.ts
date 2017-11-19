import * as RouterActions from './actions/router';
import * as UserActions from './actions/user';
import * as ProfileActions from './actions/profile';
import * as RoomActions from './actions/room';

export type AppActions
  = RouterActions.Actions
  | UserActions.Actions
  | ProfileActions.Actions
  | RoomActions.Actions;
