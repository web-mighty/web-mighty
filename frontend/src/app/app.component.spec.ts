import { Component } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

// Actions
import * as WebSocketActions from './state/actions/websocket';

// Reducers
import { State } from './state/reducer';
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
  let store: Store<State>;

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

      store = fixture.debugElement.injector.get(Store);
    });
  }));

  it('should be created', () => {
    expect(comp).not.toBeNull();
  });

  it(
    'should display DuplicateAlertComponent when connectionStatus is duplicate',
    async(() => {
      store.dispatch(new WebSocketActions.DuplicateSession());
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const dupAlert = fixture.nativeElement.querySelector('app-duplicate-alert');
        expect(dupAlert).not.toBeNull();
      });
    })
  );
});
