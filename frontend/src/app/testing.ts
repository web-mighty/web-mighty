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

  close(code: number = 1000) {
    const cbs = this.cbtable['close'];
    const wasClean = code === 1000;
    for (const cb of cbs) {
      cb(new CloseEvent('close', { code, wasClean }));
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
