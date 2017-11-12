import { TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppStateModule } from './state/app-state.module';

import { Store } from '@ngrx/store';
import { State } from './state/reducer';
import * as UserActions from './state/actions/user';
import { UserEffects } from './state/effects/user';

import { UserService } from './user.service';

describe('UserService', () => {
  let store;
  let effects;
  let service;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AppStateModule,
        RouterTestingModule.withRoutes([]),
      ],
    });
  });

  beforeEach(inject([Store, UserEffects], (_store: Store<State>, _effects: UserEffects) => {
    store = _store;
    effects = _effects;
    service = new UserService(store);
  }));

  it('should be created with injected Store', () => {
    expect(service).toBeTruthy();
  });

  /*
  it('#signUp should dispatch Sign Up related action', fakeAsync(() => {
    const effectActions = [];
    effects.signUp$.subscribe(action => {
      effectActions.push(action);
    });
    const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    service.signUp('foo@bar.baz', 'foo', 'bar', 'nick');
    tick();

    const args = dispatchSpy.calls.allArgs().map(args => args[0]);
    const signUpStart = args.filter(action =>
      action.type === UserActions.SIGN_UP_START
    );
    expect(signUpStart.length).toBe(1);
    const payload = signUpStart.map(action => action.payload);
    expect(payload.some(({ email, username, password, nickname }) =>
      email === 'foo@bar.baz' &&
      username === 'foo' &&
      password === 'bar' &&
      nickname === 'nick'
    )).toBeTruthy();

    const signUpDone = effectActions.filter(action =>
      action.type === UserActions.SIGN_UP_DONE
    );
    expect(signUpDone.length).toBe(1);
  }));
  */

  it('#signOut should dispatch Sign Out related action', fakeAsync(() => {
    const effectActions = [];
    effects.signOut$.subscribe(action => {
      effectActions.push(action);
    });
    const dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    service.signOut();
    tick();

    const args = dispatchSpy.calls.allArgs().map(args => args[0]);
    const signOutStart = args.filter(action =>
      action.type === UserActions.SIGN_OUT_START
    );
    expect(signOutStart.length).toBe(1);

    const signOutDone = effectActions.filter(action =>
      action.type === UserActions.SIGN_OUT_DONE
    );
    expect(signOutDone.length).toBe(1);
  }));
});
