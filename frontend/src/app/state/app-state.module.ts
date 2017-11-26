import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';

// Reducers
import { reducers } from './reducer';

// Effects
import { UserEffects } from './effects/user';
import { RouterEffects } from './effects/router';
import { ProfileEffects } from './effects/profile';
import { RoomEffects } from './effects/room';
import { WebSocketEffects } from './effects/websocket';

@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([
      UserEffects,
      ProfileEffects,
      RouterEffects,
      RoomEffects,
      WebSocketEffects,
    ]),
    StoreRouterConnectingModule,
  ],
  declarations: [],
  exports: [
    StoreModule,
    EffectsModule,
  ],
})
export class AppStateModule { }
