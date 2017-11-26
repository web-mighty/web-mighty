import * as v4 from 'uuid/v4';

export interface RoomJoinRequest {
  action: 'room-join';
  data: {
    'room-id': string;
    password?: string;
  };
}

export type Request
  = RoomJoinRequest
;

export class RequestWithNonce {
  nonce: string;
  action: string;
  data: any;

  constructor(request: Request) {
    this.nonce = v4();
    this.action = request.action;
    this.data = request.data;
  }
}

export interface ResponseError {
  reason: string;
}

export interface SuccessResponseWithNonce {
  nonce: string;
  success: true;
  result: any;
}
export interface FailureResponseWithNonce {
  nonce: string;
  success: false;
  error: ResponseError;
}
export type ResponseWithNonce
  = SuccessResponseWithNonce
  | FailureResponseWithNonce
;

export interface SuccessResponse<T> {
  success: true;
  result: T;
}
export interface FailureResponse {
  success: false;
  error: ResponseError;
}

export type Response
  = SuccessResponse<{}>
  | FailureResponse
;

export interface RoomJoinEvent {
  event: 'room-join';
  data: {
    player: string;
  };
}
export type Event
  = RoomJoinEvent
;
