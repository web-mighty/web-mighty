import { TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { filterCallByAction } from '../../testing';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Http, XHRBackend, XSRFStrategy } from '@angular/http';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { xsrfFactory } from '../../xsrf-factory';

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
        HttpModule,
        StoreModule.forRoot({}),
        EffectsModule.forRoot([
          UserEffects,
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
    [Actions, Http, XHRBackend],
    (actions$: Actions, http: Http, backend: MockBackend) => {
      backend.connections.subscribe(connection => lastConnection = connection);
      effects = new UserEffects(actions$, http);
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
