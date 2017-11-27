import * as v4 from 'uuid/v4';

export class RoomJoinRequest {
  action = 'room-join';
  constructor(public data: {
    'room-id': string;
    password?: string;
  }) {}
}
export class RoomLeaveRequest {
  action = 'room-leave';
  data = {};
}

export type Request
  = RoomJoinRequest
  | RoomLeaveRequest
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

export interface GenericError {
  type: string;
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
  error: GenericError;
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
  error: GenericError;
}

export type Response
  = SuccessResponse<{}>
  | FailureResponse
;

export interface ErrorEvent {
  event: 'error';
  data: GenericError;
}
export interface RoomJoinEvent {
  event: 'room-join';
  data: {
    player: string;
  };
}
export type Event
  = ErrorEvent
  | RoomJoinEvent
;
