import { Component } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { Router } from '@angular/router';

import { websocketReducer } from './state/reducers/websocket';

import { AppComponent } from './app.component';

let comp: AppComponent;
let fixture: ComponentFixture<AppComponent>;

@Component({
  selector: 'app-menu-bar',
  template: ''
})
class MockMenuBarComponent {}

@Component({
  selector: 'app-duplicate-alert',
  template: ''
})
class MockDuplicateAlertComponent {}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MockMenuBarComponent,
        MockDuplicateAlertComponent,
      ],
      imports: [
        RouterTestingModule.withRoutes([]),
        StoreModule.forRoot({
          websocket: websocketReducer,
        }),
      ],
      providers: [
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(AppComponent);
      comp = fixture.componentInstance;
    });
  }));

  it('can instantiate it', () => {
    expect(comp).not.toBeNull();
  });
});
