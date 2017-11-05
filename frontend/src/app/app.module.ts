import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common'
import { StoreRouterConnectingModule } from '@ngrx/router-store';

import { AppComponent } from './app.component';
import { LobbyComponent } from './lobby.component';
import { MenuBarComponent } from './menu-bar.component';
import { SignUpComponent } from './sign-up.component';
import { SignInComponent } from './sign-in.component';
import { ProfileViewComponent } from './profile-view.component';
import { ProfileEditComponent } from './profile-edit.component';
import { AppRoutingModule } from './app-routing.module';
import { AppStateModule } from './state/app-state.module';
import { UserService } from './user.service';

@NgModule({
  declarations: [
    AppComponent,
    LobbyComponent,
    MenuBarComponent,
    SignUpComponent,
    SignInComponent,
    ProfileViewComponent,
    ProfileEditComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    AppStateModule,
    StoreRouterConnectingModule,
  ],
  providers: [
    UserService,
    { provide: APP_BASE_HREF, useValue: '/' },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
