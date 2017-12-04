import { ComponentFixture, TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockComponent, filterCallByAction } from './testing';

import { Observable } from 'rxjs/Observable';
import { never as observableNever } from 'rxjs/observable/never';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { APP_BASE_HREF } from '@angular/common';
import { Store } from '@ngrx/store';
import { State } from './state/reducer';
import { Profile } from './profile';

// Actions
import { AppActions } from './state/app-actions';
import * as RouterActions from './state/actions/router';
import * as UserActions from './state/actions/user';
import * as ProfileActions from './state/actions/profile';

// Reducers
import { userReducer } from './state/reducers/user';
import { profileReducer } from './state/reducers/profile';

// Effects
import { RouterEffects } from './state/effects/router';

import { ProfileViewComponent } from './profile-view.component';


const routerStub = {
  navigateByUrl: jasmine.createSpy('navigateByUrl'),
};

class ActivatedRouteStub {
  callbacks: Array<(username: string) => void> = [];

  paramMap: Observable<any> =
    Observable.create(obs => {
      this.callbacks.push(username => {
        obs.next({
          get(field: string) {
            return username;
          }
        });
      });
    });

  setUsername(username: string) {
    for (const cb of this.callbacks) {
      cb(username);
    }
  }
}

describe('ProfileViewComponent', () => {
  let comp: ProfileViewComponent;
  let fixture: ComponentFixture<ProfileViewComponent>;
  let store: Store<State>;
  let activatedRoute: ActivatedRouteStub;
  let dispatchSpy;

  const dogeProfile: Profile = {
    user: { username: 'doge' },
    nickname: 'Doge',
    avatar: 'doge.jpg',
    created: '2017-01-01 00:00:00.000000',
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ProfileViewComponent,
        MockComponent,
      ],
      imports: [
        FormsModule,
        StoreModule.forRoot({
          user: userReducer,
          profile: profileReducer,
        }),
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(ProfileViewComponent);
      comp = fixture.componentInstance;
      store = fixture.debugElement.injector.get(Store);
      activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
      dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
      fixture.detectChanges();
    });
  }));

  it('can instantiate it', () => {
    expect(comp).not.toBeNull();
  });

  it('should try to get profile', async(() => {
    activatedRoute.setUsername('doge');
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const profileGet = filterCallByAction(dispatchSpy, ProfileActions.Get.Start);
      expect(profileGet.length).toBe(1);
      expect(profileGet[0].username).toBe('doge');
    });
  }));

  it('should display profile', async(() => {
    activatedRoute.setUsername('doge');
    store.dispatch(new ProfileActions.Get.Done(dogeProfile));
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const nickname = fixture.nativeElement.querySelector('#profile-view-nickname').textContent;
      expect(nickname).toBe('Doge');
    });
  }));

  it('should display error messages', async(() => {
    store.dispatch(new ProfileActions.Get.Failed('Foobar error.', 'doge'));
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const message = fixture.nativeElement.querySelector('.error-message').textContent;
      expect(message).toBe('Foobar error.');
    });
  }));
});
