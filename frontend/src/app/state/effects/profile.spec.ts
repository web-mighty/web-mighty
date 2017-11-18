import { TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { MockBackend } from '@angular/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { AppStateModule } from '../app-state.module';
import { MockComponent, filterCallByAction } from '../../testing';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Http, XHRBackend, XSRFStrategy, Headers, Response, ResponseOptions } from '@angular/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { xsrfFactory } from '../../xsrf-factory';
import { State } from '../reducer';

// Actions
import { AppActions } from '../app-actions';
import * as RouterActions from '../actions/router';
import * as ProfileActions from '../actions/profile';

// Effects
import { ProfileEffects } from './profile';


describe('ProfileEffects', () => {
  let effects: ProfileEffects;
  let actions;
  let backend;

  let lastConnection;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        MockComponent,
      ],
      imports: [
        AppStateModule,
        RouterTestingModule.withRoutes([
          { path: '', component: MockComponent },
          { path: 'sign_in', component: MockComponent },
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
    (actions$: Actions, http: Http, store: Store<State>, _backend: MockBackend) => {
      backend = _backend;
      backend.connections.subscribe(connection => lastConnection = connection);
      effects = new ProfileEffects(actions$, http, store);
    }
  ));

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  describe('get$', () => {
    beforeEach(() => {
      backend.connections.subscribe(connection => {
        const request = connection.request;
        const username = /api\/profile\/(.+)\/$/.exec(connection.request.url)[1];
        let responseOptions = null;
        if (username === 'doge') {
          responseOptions = new ResponseOptions({
            status: 200,
            body: {
              user: { username: 'doge' },
              created: '2017-01-01 00:00:00.000000',
              nickname: 'Doge',
              avatar: 'doge.jpg',
            },
          });
        } else {
          responseOptions = new ResponseOptions({
            status: 404,
          });
        }
        connection.mockRespond(new Response(responseOptions));
      });
    });

    it('should initiate a backend connection', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new ProfileActions.Get.Start('doge')
      );
      effects.get$.subscribe(_ => {});
      tick();

      expect(lastConnection).toBeTruthy();
      expect(lastConnection.request.url).toMatch(/api\/profile\/doge\/$/);
    }));

    it('should succeed with valid username', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new ProfileActions.Get.Start('doge')
      );
      let done = false;
      effects.get$.subscribe((action: ProfileActions.Get.Done) => {
        if (done) {
          fail('Action fired more than once');
        }
        expect(action.type).toBe(ProfileActions.GET_DONE);
        expect(action.profile).toEqual({
          user: { username: 'doge' },
          nickname: 'Doge',
          avatar: 'doge.jpg',
          created: '2017-01-01 00:00:00.000000',
        });
        done = true;
      });
      tick();
      if (!done) {
        fail('Action didn\'t fire');
      }
    }));

    it('should error with invalid username', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new ProfileActions.Get.Start('foo')
      );
      let done = false;
      effects.get$.subscribe((action: ProfileActions.Get.Failed) => {
        if (done) {
          fail('Action fired more than once');
        }
        expect(action.type).toBe(ProfileActions.GET_FAILED);
        expect(action.error).toBe('Profile not found.');
        done = true;
      });
      tick();
      if (!done) {
        fail('Action didn\'t fire');
      }
    }));
  });
});
