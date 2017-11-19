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
import * as UserActions from '../actions/user';

// Effects
import { UserEffects } from './user';


describe('UserEffects', () => {
  let effects: UserEffects;
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
          { path: 'lobby', component: MockComponent },
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
      effects = new UserEffects(actions$, http, store);
    }
  ));

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  describe('signIn$', () => {
    beforeEach(() => {
      backend.connections.subscribe(connection => {
        const request = connection.request;
        const body = JSON.parse(request.getBody());
        let responseOptions = null;
        if (body.username === 'foo' && body.password === 'bar') {
          responseOptions = new ResponseOptions({
            status: 200,
            body: { username: 'foo' },
          });
        } else {
          responseOptions = new ResponseOptions({
            status: 401,
          });
        }
        connection.mockRespond(new Response(responseOptions));
      });
    });

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

    it('should succeed with valid username and password', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(
        new UserActions.SignIn.Start({ username: 'foo', password: 'bar' })
      );
      let done = false;
      effects.signIn$.subscribe((action: UserActions.SignIn.Done) => {
        if (done) {
          fail('Action fired more than once');
        }
        expect(action.type).toBe(UserActions.SIGN_IN_DONE);
        expect(action.user.username).toBe('foo');
        done = true;
      });
      tick();
      if (!done) {
        fail('Action didn\'t fire');
      }
    }));

    it('should error with invalid username and password', fakeAsync(() => {
      actions = new ReplaySubject(2);
      actions.next(
        new UserActions.SignIn.Start({ username: 'foo', password: 'baz' })
      );
      actions.next(
        new UserActions.SignIn.Start({ username: 'doge', password: 'wow' })
      );
      let count = 0;
      effects.signIn$.subscribe((action: UserActions.SignIn.Failed) => {
        if (count >= 2) {
          fail('Action fired more than twice');
        }
        expect(action.type).toBe(UserActions.SIGN_IN_FAILED);
        expect(action.error).toBe('Username and password does not match.');
        count++;
      });
      tick();
      if (count !== 2) {
        fail('Action didn\'t fire twice');
      }
    }));
  });

  describe('signInDone$', () => {
    it('should redirect to lobby', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(new UserActions.SignIn.Done({ username: 'foo' }));
      let done = false;
      effects.signInDone$.subscribe((action: RouterActions.GoByUrl) => {
        if (done) {
          fail('Action fired more than once');
        }
        expect(action.type).toBe(RouterActions.GO_BY_URL);
        expect(action.url).toBe('lobby');
        done = true;
      });
      tick();
      if (!done) {
        fail('Action didn\'t fire');
      }
    }));
  });

  describe('verifySession$', () => {
    let user = null;

    beforeEach(() => {
      backend.connections.subscribe(connection => {
        const request = connection.request;
        let responseOptions = null;
        if (user === null) {
          responseOptions = new ResponseOptions({
            status: 401,
          });
        } else {
          responseOptions = new ResponseOptions({
            status: 200,
            body: user,
          });
        }
        connection.mockRespond(new Response(responseOptions));
      });
    });

    it('should initiate a backend connection', fakeAsync(() => {
      actions = new ReplaySubject(1);
      actions.next(new UserActions.VerifySession());
      effects.verifySession$.subscribe(_ => {});
      tick();

      expect(lastConnection).toBeTruthy();
      expect(lastConnection.request.url).toMatch(/api\/verify_session\/$/);
    }));

    it('should fire Verified with authenticated session', fakeAsync(() => {
      user = { username: 'foo' };
      actions = new ReplaySubject(1);
      actions.next(new UserActions.VerifySession());
      let done = false;
      effects.verifySession$.subscribe((action: UserActions.Verified) => {
        if (done) {
          fail('Action fired more than once');
        }
        expect(action.type).toBe(UserActions.VERIFIED);
        expect(action.user.username).toBe('foo');
        done = true;
      });
      tick();

      if (!done) {
        fail('Action didn\'t fire');
      }
    }));

    it('should fire NeedSignIn with unauthenticated session', fakeAsync(() => {
      user = null;
      actions = new ReplaySubject(1);
      actions.next(new UserActions.VerifySession());
      let done = false;
      effects.verifySession$.subscribe((action: UserActions.NeedSignIn) => {
        if (done) {
          fail('Action fired more than once');
        }
        expect(action.type).toBe(UserActions.NEED_SIGN_IN);
        done = true;
      });
      tick();

      if (!done) {
        fail('Action didn\'t fire');
      }
    }));
  });

  describe('verified$', () => {
    let router;
    const verifiedAction = new UserActions.Verified({ username: 'foo' });

    beforeEach(inject([Router], (_router: Router) => {
      router = _router;
    }));

    it('should redirect from sign_in to lobby', fakeAsync(() => {
      router.navigateByUrl('sign_in');
      tick();

      actions = new ReplaySubject(1);
      actions.next(verifiedAction);
      let done = false;
      effects.verified$.subscribe((action: RouterActions.GoByUrl) => {
        if (done) {
          fail('Action fired more than once');
        }
        expect(action.type).toBe(RouterActions.GO_BY_URL);
        expect(action.url).toBe('lobby');
        done = true;
      });
      tick();

      if (!done) {
        fail('Action didn\'t fire');
      }
    }));

    it('should never redirect from other than sign_in', fakeAsync(() => {
      router.navigateByUrl('lobby');
      tick();

      actions = new ReplaySubject(1);
      actions.next(verifiedAction);
      effects.verified$.subscribe(_ => {
        fail('Action fired');
      });
      tick();
    }));
  });
});
