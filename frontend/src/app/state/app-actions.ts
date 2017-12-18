import * as RouterActions from './actions/router';
import * as UserActions from './actions/user';
import * as ProfileActions from './actions/profile';
import * as RoomActions from './actions/room';
import * as WebSocketActions from './actions/websocket';
import * as GameActions from './actions/game';
import * as HallOfFameActions from './actions/hall-of-fame';
import { RouterNavigationAction } from '@ngrx/router-store';

export type AppActions
  = RouterActions.Actions
  | UserActions.Actions
  | ProfileActions.Actions
  | RoomActions.Actions
  | WebSocketActions.Actions
  | GameActions.Actions
  | HallOfFameActions.Actions
  | RouterNavigationAction;
