import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { filterCallByAction } from '../../testing';

import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Router } from '@angular/router';
import { Location, APP_BASE_HREF } from '@angular/common';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

// Actions
import { AppActions } from '../app-actions';
import * as RouterActions from '../actions/router';

// Effects
import { RouterEffects } from './router';


const routerStub = {
  navigate: jasmine.createSpy('navigate'),
  navigateByUrl: jasmine.createSpy('navigateByUrl'),
};
const locationStub = {
  back: jasmine.createSpy('back'),
  forward: jasmine.createSpy('forward'),
};

describe('RouterEffects', () => {
  let effects: RouterEffects;
  let actions;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        RouterTestingModule.withRoutes([]),
        StoreModule.forRoot({}),
        EffectsModule.forRoot([
          RouterEffects,
        ]),
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: Router, useValue: routerStub },
        { provide: Location, useValue: locationStub },
        provideMockActions(() => actions),
      ],
    });
    const actions$ = TestBed.get(Actions);
    const router = TestBed.get(Router);
    const location = TestBed.get(Location);

    effects = new RouterEffects(actions$, router, location);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  it('navigate$ should initiate router navigation', fakeAsync(() => {
    actions = new ReplaySubject(1);
    actions.next(new RouterActions.Go({ path: ['foo', 1] }));
    effects.navigate$.subscribe(_ => {});
    tick();

    expect(routerStub.navigate.calls.allArgs()[0][0]).toEqual(['foo', 1]);
  }));
  it('navigateByUrl$ should initiate router navigation', fakeAsync(() => {
    actions = new ReplaySubject(1);
    actions.next(new RouterActions.GoByUrl('foo'));
    effects.navigateByUrl$.subscribe(_ => {});
    tick();

    expect(routerStub.navigateByUrl.calls.allArgs()[0][0]).toEqual('foo');
  }));
  it('back$ should initiate browser navigation', fakeAsync(() => {
    actions = new ReplaySubject(1);
    actions.next(new RouterActions.Back());
    effects.navigateBack$.subscribe(_ => {});
    tick();

    expect(locationStub.back).toHaveBeenCalled();
  }));
  it('forward$ should initiate browser navigation', fakeAsync(() => {
    actions = new ReplaySubject(1);
    actions.next(new RouterActions.Forward());
    effects.navigateForward$.subscribe(_ => {});
    tick();

    expect(locationStub.forward).toHaveBeenCalled();
  }));
});
