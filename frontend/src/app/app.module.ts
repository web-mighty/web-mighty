import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { AppRoutingModule } from './app-routing.module';
import { AppStateModule } from './state/app-state.module';

import { AppComponent } from './app.component';
import { MenuBarComponent } from './menu-bar.component';
import { DuplicateAlertComponent } from './duplicate-alert.component';
import { MdlDirective } from './mdl.directive';

import { XSRFStrategy } from '@angular/http';
import { xsrfFactory } from './xsrf-factory';

@NgModule({
  declarations: [
    AppComponent,
    MenuBarComponent,
    DuplicateAlertComponent,
    MdlDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AppStateModule,
    StoreRouterConnectingModule,
  ],
  providers: [
    { provide: XSRFStrategy, useFactory: xsrfFactory },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
