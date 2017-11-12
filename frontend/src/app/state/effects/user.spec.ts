import { TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { MockBackend } from '@angular/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { AppStateModule } from '../app-state.module';
import { filterCallByAction } from '../../testing';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Http, XHRBackend, XSRFStrategy } from '@angular/http';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { xsrfFactory } from '../../xsrf-factory';
import { State } from '../reducer';

// Actions
import { AppActions } from '../app-actions';
import * as UserActions from '../actions/user';

// Effects
import { UserEffects } from './user';


describe('UserEffects', () => {
  let effects: UserEffects;
  let actions;

  let lastConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        AppStateModule,
        RouterTestingModule.withRoutes([
        ]),
      ],
      providers: [
        { provide: XHRBackend, useClass: MockBackend },
        { provide: XSRFStrategy, useFactory: xsrfFactory },
        provideMockActions(() => actions),
      ],
    });
  });

  beforeEach(inject(
    [Actions, Http, Store, XHRBackend],
    (actions$: Actions, http: Http, store: Store<State>, backend: MockBackend) => {
      backend.connections.subscribe(connection => lastConnection = connection);
      effects = new UserEffects(actions$, http, store);
    }
  ));

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  describe('signIn$', () => {
    it('should initiate a backend connection', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new UserActions.SignIn.Start({ username: 'foo', password: 'bar' })
      );
      effects.signIn$.subscribe(_ => {});
      tick();

      expect(lastConnection).toBeTruthy();
      expect(lastConnection.request.url).toMatch(/api\/signin\/$/);
    }));
  });
});
