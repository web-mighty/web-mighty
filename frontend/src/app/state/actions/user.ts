import { Action } from '@ngrx/store';

import { Profile } from '../../profile';

export const SIGN_UP_START = 'User: Sign up: start';
export const SIGN_UP_DONE = 'User: Sign up: done';
export const SIGN_UP_FAILED = 'User: Sign up: failed';

export const SIGN_IN_START = 'User: Sign in: start';
export const SIGN_IN_DONE = 'User: Sign in: done';
export const SIGN_IN_FAILED = 'User: Sign in: failed';

export const SIGN_OUT_START = 'User: Sign out: start';
export const SIGN_OUT_DONE = 'User: Sign out: done';

export namespace SignUp {
  export class Start implements Action {
    readonly type = SIGN_UP_START;

    constructor(public payload: {
      email: string;
      username: string;
      password: string;
    }) {}
  }
  export class Done implements Action {
    readonly type = SIGN_UP_DONE;
  }
  export class Failed implements Action {
    readonly type = SIGN_UP_FAILED;

    constructor(public error: string) {}
  }
}

export namespace SignIn {
  export class Start implements Action {
    readonly type = SIGN_IN_START;

    constructor(public payload: {
      username: string;
      password: string;
    }) {}
  }
  export class Done implements Action {
    readonly type = SIGN_IN_DONE;

    constructor(public user: Profile) {}
  }
  export class Failed implements Action {
    readonly type = SIGN_IN_FAILED;

    constructor(public error: string) {}
  }
}

export namespace SignOut {
  export class Start implements Action {
    readonly type = SIGN_OUT_START;
  }
  export class Done implements Action {
    readonly type = SIGN_OUT_DONE;
  }
}

export type Actions
  = SignUp.Start
  | SignUp.Done
  | SignUp.Failed
  | SignIn.Start
  | SignIn.Done
  | SignIn.Failed
  | SignOut.Start
  | SignOut.Done;
