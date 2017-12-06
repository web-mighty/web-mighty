import { Action } from '@ngrx/store';

import { User } from '../../user';
import { Profile } from '../../profile';

export const SIGN_UP_START = 'User: Sign up: start';
export const SIGN_UP_DONE = 'User: Sign up: done';
export const SIGN_UP_FAILED = 'User: Sign up: failed';

export const SIGN_IN_START = 'User: Sign in: start';
export const SIGN_IN_DONE = 'User: Sign in: done';
export const SIGN_IN_FAILED = 'User: Sign in: failed';

export const SIGN_OUT_START = 'User: Sign out: start';
export const SIGN_OUT_DONE = 'User: Sign out: done';

export const VERIFY_SESSION = 'User: Verify session';
export const VERIFIED = 'User: Verified';
export const NEED_SIGN_IN = 'User: Need sign in';

export const REDIRECT_WITH_SIGN_IN_STATE = 'User: Redirect with sign in state';

export const VERIFY_ACCOUNT_START = 'User: Verify account: Start';
export const VERIFY_ACCOUNT_DONE = 'User: Verify account: Done';
export const VERIFY_ACCOUNT_FAILED = 'User: Verify account: Failed';

export namespace SignUp {
  export class Start implements Action {
    readonly type = SIGN_UP_START;

    constructor(public payload: {
      email: string;
      username: string;
      password: string;
      confirmPassword: string;
      nickname: string;
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

    constructor(public user: User) {}
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

export class VerifySession implements Action {
  readonly type = VERIFY_SESSION;
}

export class Verified implements Action {
  readonly type = VERIFIED;

  constructor(public user: User) {}
}

export class NeedSignIn implements Action {
  readonly type = NEED_SIGN_IN;
}

export class RedirectWithSignInState implements Action {
  readonly type = REDIRECT_WITH_SIGN_IN_STATE;

  constructor(public payload: {
    when: 'signed-in' | 'not-signed-in',
    goTo: string,
  }) {}
}

export namespace VerifyAccount {
  export type FailureReason
    = 'invalid'
    | 'crash'
    | 'unknown'
  ;

  export class Start implements Action {
    readonly type = VERIFY_ACCOUNT_START;

    constructor(public readonly token: string) {}
  }

  export class Done implements Action {
    readonly type = VERIFY_ACCOUNT_DONE;
  }

  export class Failed implements Action {
    readonly type = VERIFY_ACCOUNT_FAILED;

    constructor(public readonly reason: FailureReason) {}
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
  | SignOut.Done
  | VerifySession
  | Verified
  | NeedSignIn
  | RedirectWithSignInState
  | VerifyAccount.Start
  | VerifyAccount.Done
  | VerifyAccount.Failed
;
