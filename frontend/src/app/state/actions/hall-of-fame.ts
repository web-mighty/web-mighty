import { Action } from '@ngrx/store';

import { WinsInfo } from '../reducers/hall-of-fame';

export namespace Get {
  export const START = 'Hall of Fame: Get: Start';
  export const DONE = 'Hall of Fame: Get: Done';
  export const FAILED = 'Hall of Fame: Get: Failed';

  export class Start implements Action {
    readonly type = START;
  }

  export class Done implements Action {
    readonly type = DONE;

    constructor(public hof: WinsInfo[]) {}
  }

  export class Failed implements Action {
    readonly type = FAILED;

    constructor(public error: string) {}
  }

  export type Actions
    = Start
    | Done
    | Failed
  ;
}

export type Actions
  = Get.Actions
;
