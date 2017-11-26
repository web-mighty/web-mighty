import { Component } from '@angular/core';

import { AppActions } from './state/app-actions';

@Component({
    template: ''
})
export class MockComponent {}

export class WebSocketMock {
  cbtable: { [event: string]: ((e: any) => void)[] } = {};
  received: string[] = [];
  url = '';

  constructor() {
    this.addEventListener = spyOn(this, 'addEventListener').and.callThrough();
    this.send = spyOn(this, 'send').and.callThrough();
    this.close = spyOn(this, 'close').and.callThrough();
  }

  setUrl(url: string) {
    this.url = url;
  }

  addEventListener(event: string, cb: (e: any) => void) {
    if (!(event in this.cbtable)) {
      this.cbtable[event] = [];
    }
    this.cbtable[event].push(cb);
  }

  accept() {
    const cbs = this.cbtable['open'];
    console.log(cbs);
    for (const cb of cbs) {
      cb(new Event('open'));
    }
  }

  send(data: string) {
    this.received.push(data);
  }

  reply(data: string) {
    const cbs = this.cbtable['message'];
    for (const cb of cbs) {
      cb(new MessageEvent('message', { data }));
    }
  }

  close(wasClean: boolean = true) {
    const cbs = this.cbtable['close'];
    for (const cb of cbs) {
      cb(new CloseEvent('close', { wasClean }));
    }
  }
}

export function filterCallByAction<T extends AppActions>(
  spy: any,
  ty: { new(...args): T; }
): T[] {
  const args: AppActions[] = spy.calls.allArgs().map(args => args[0]);
  return args.filter(action => action instanceof ty) as T[];
}
