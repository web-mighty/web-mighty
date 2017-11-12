import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { CommonModule } from '@angular/common';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

// Reducers
import { userReducer } from './reducers/user';
import { routerReducer } from '@ngrx/router-store';

// Effects
import { UserEffects } from './effects/user';
import { RouterEffects } from './effects/router';

@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    StoreModule.forRoot({
      router: routerReducer,
      user: userReducer,
    }),
    EffectsModule.forRoot([
      RouterEffects,
      UserEffects,
    ]),
  ],
  declarations: [],
  exports: [
    StoreModule,
    EffectsModule,
  ],
})
export class AppStateModule { }
