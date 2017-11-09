import { Component } from '@angular/core'

import { AppActions } from './state/app-actions';

@Component({
    template: ''
})
export class MockComponent {}

export function filterCallByAction<T extends AppActions>(
  spy: any,
  ty: { new(...args): T; }
): T[] {
  const args: AppActions[] = spy.calls.allArgs().map(args => args[0]);
  return args.filter(action => action instanceof ty) as T[];
}
