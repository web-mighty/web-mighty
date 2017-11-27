import { AppActions } from '../app-actions';
import * as WebSocketActions from '../actions/websocket';

import { Request } from '../../websocket';

export interface WebSocketState {
  connecting: boolean;
  error: string | null;
  requests: { [nonce: string]: Request };
}
const initialState: WebSocketState = {
  connecting: false,
  error: null,
  requests: {},
};

export function websocketReducer(
  state: WebSocketState = initialState,
  action: AppActions
) {
  switch (action.type) {
    case WebSocketActions.CONNECT:
      return { ...initialState, connecting: true };
    case WebSocketActions.CONNECTED:
      return { ...initialState, connecting: false };
    case WebSocketActions.DISCONNECTED:
      return { ...initialState };
    case WebSocketActions.WS_ERROR:
      return { ...state, error: String(action.error) };
    case WebSocketActions.REQUEST:
      return {
        ...state,
        requests: {
          ...state.requests,
          [action.payload.nonce]: action.payload,
        },
      };
    case WebSocketActions.RESPONSE: {
      const requests = { ...state.requests };
      delete requests[action.nonce];
      return {
        ...state,
        requests,
      };
    }
    default:
      return state;
  }
}
