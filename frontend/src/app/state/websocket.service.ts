import { Injectable } from '@angular/core';

@Injectable()
export class WebSocketService {
  constructor() {}

  connect(url: string): WebSocket {
    return new WebSocket(url);
  }
}
