import * as RouterActions from './actions/router';
import * as UserActions from './actions/user';
import * as ProfileActions from './actions/profile';

export type AppActions
  = RouterActions.Actions
  | UserActions.Actions
  | ProfileActions.Actions;
