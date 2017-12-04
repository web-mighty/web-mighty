import { Room, GenericError } from './data';

export interface SuccessWithNonce {
  nonce: string;
  success: true;
  result: any;
}
export interface FailureWithNonce {
  nonce: string;
  success: false;
  error: GenericError;
}
export type WithNonce
  = SuccessWithNonce
  | FailureWithNonce
;

export interface Success<T> {
  success: true;
  result: T;
}
export interface Failure {
  success: false;
  error: GenericError;
}
export type Response
  = Success<{}>
  | Success<Room>
  | Failure
;
