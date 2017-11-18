import { Action } from '@ngrx/store';

import { Profile } from '../../profile';

export const GET_START = 'Profile: Get: start';
export const GET_DONE = 'Profile: Get: done';
export const GET_FAILED = 'Profile: Get: failed';
export const EDIT_START = 'Profile: Edit: start';
export const EDIT_DONE = 'Profile: Edit: done';
export const EDIT_FAILED = 'Profile: Edit: failed';

export namespace Get {
  export class Start implements Action {
    readonly type = GET_START;

    constructor(public username: string) {}
  }

  export class Done implements Action {
    readonly type = GET_DONE;

    constructor(public profile: Profile) {}
  }

  export class Failed implements Action {
    readonly type = GET_FAILED;

    constructor(public error: string, public username: string) {}
  }
}

export namespace Edit {
  export class Start implements Action {
    readonly type = EDIT_START;

    constructor(
      public baseProfile: Profile,
      public payload: {
        currentPassword?: string,
        newPassword?: string,
        nickname?: string
      }
    ) {}
  }

  export class Done implements Action {
    readonly type = EDIT_DONE;

    constructor(public username: string) {}
  }

  export class Failed implements Action {
    readonly type = EDIT_FAILED;

    constructor(public error: string, public username: string) {}
  }
}

export type Actions
  = Get.Start
  | Get.Done
  | Get.Failed
  | Edit.Start
  | Edit.Done
  | Edit.Failed
;
