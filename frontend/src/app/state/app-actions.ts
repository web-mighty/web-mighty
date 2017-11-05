import * as RouterActions from './actions/router';
import * as UserActions from './actions/user';

export type AppActions
  = RouterActions.Actions
  | UserActions.Actions;
