import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

// Actions
import * as WebSocketActions from './state/actions/websocket';

// Reducers
import { State } from './state/reducer';
import { websocketReducer } from './state/reducers/websocket';

import { DuplicateAlertComponent } from './duplicate-alert.component';

import { filterCallByAction } from './testing';


describe('DuplicateAlertComponent', () => {
  let comp: DuplicateAlertComponent;
  let fixture: ComponentFixture<DuplicateAlertComponent>;
  let store: Store<State>;
  let dispatchSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DuplicateAlertComponent,
      ],
      imports: [
        StoreModule.forRoot({
          websocket: websocketReducer,
        }),
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(DuplicateAlertComponent);
      comp = fixture.componentInstance;

      store = fixture.debugElement.injector.get(Store);
      dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    });
  }));

  it('should be created', () => {
    expect(comp).not.toBeNull();
  });

  it(
    'should force connect when Force Connect button is clicked',
    async(() => {
      const button = fixture.nativeElement.querySelector('.force-connect-button');
      button.click();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const connect = filterCallByAction(dispatchSpy, WebSocketActions.Connect);
        expect(connect).toEqual([
          new WebSocketActions.Connect(true),
        ]);
      });
    })
  );
});
