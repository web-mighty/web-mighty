import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { StoreRouterConnectingModule } from '@ngrx/router-store';

import { AppComponent } from './app.component';
import { LobbyComponent } from './lobby.component';
import { MenuBarComponent } from './menu-bar.component';
import { SignUpComponent } from './sign-up.component';
import { SignInComponent } from './sign-in.component';
import { ProfileViewComponent } from './profile-view.component';
import { ProfileEditComponent } from './profile-edit.component';
import { GameRoomComponent } from './game-room.component';
import { GameCreateComponent } from './game-create.component';
import { HallOfFameComponent } from './hall-of-fame.component';
import { AppRoutingModule } from './app-routing.module';
import { AppStateModule } from './state/app-state.module';

import { XSRFStrategy } from '@angular/http';
import { xsrfFactory } from './xsrf-factory';
import { MdlDirective } from './mdl.directive';

@NgModule({
  declarations: [
    AppComponent,
    LobbyComponent,
    MenuBarComponent,
    SignUpComponent,
    SignInComponent,
    ProfileViewComponent,
    ProfileEditComponent,
    GameRoomComponent,
    GameCreateComponent,
    HallOfFameComponent,
    MdlDirective,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AppStateModule,
    StoreRouterConnectingModule,
  ],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    { provide: XSRFStrategy, useFactory: xsrfFactory },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
