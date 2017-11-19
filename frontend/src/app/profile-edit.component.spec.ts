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

import { ProfileEditComponent } from './profile-edit.component';


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

describe('ProfileEditComponent', () => {
  let comp: ProfileEditComponent;
  let fixture: ComponentFixture<ProfileEditComponent>;
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
        ProfileEditComponent,
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
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(ProfileEditComponent);
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
    store.dispatch(new UserActions.Verified({ username: 'doge' }));
    activatedRoute.setUsername('doge');
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const profileGet = filterCallByAction(dispatchSpy, ProfileActions.Get.Start);
      expect(profileGet.length).toBe(1);
      expect(profileGet[0].username).toBe('doge');
    });
  }));

  it('should redirect if the user does not have permission', async(() => {
    store.dispatch(new UserActions.Verified({ username: 'foo' }));
    activatedRoute.setUsername('doge');
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const goByUrl = filterCallByAction(dispatchSpy, RouterActions.GoByUrl);
      expect(goByUrl.length).toBe(1);
      expect(goByUrl[0].url).toBe('profile/doge');
    });
  }));

  it('should redirect if the user is not signed in', async(() => {
    store.dispatch(new UserActions.NeedSignIn());
    activatedRoute.setUsername('doge');
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const goByUrl = filterCallByAction(dispatchSpy, RouterActions.GoByUrl);
      expect(goByUrl.length).toBe(1);
      expect(goByUrl[0].url).toBe('profile/doge');
    });
  }));

  it('should display default nickname', async(() => {
    store.dispatch(new UserActions.Verified({ username: 'doge' }));
    activatedRoute.setUsername('doge');
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      store.dispatch(new ProfileActions.Get.Done(dogeProfile));
      fixture.detectChanges();
      return fixture.whenStable();
    }).then(() => {
      fixture.detectChanges();
      const nickname = fixture.nativeElement.querySelector('input[name="nickname"]');
      const placeholder = nickname.getAttribute('placeholder');
      expect(placeholder).toBe('Doge');
    });
  }));

  it('should try to update profile', async(() => {
    store.dispatch(new UserActions.Verified({ username: 'doge' }));
    activatedRoute.setUsername('doge');
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      store.dispatch(new ProfileActions.Get.Done(dogeProfile));
      fixture.detectChanges();
      return fixture.whenStable();
    }).then(() => {
      fixture.detectChanges();
      const nickname = fixture.nativeElement.querySelector('input[name="nickname"]');
      nickname.value = 'Wow';
      nickname.dispatchEvent(new Event('input'));
      const submit = fixture.nativeElement.querySelector('button');
      submit.click();
      return fixture.whenStable();
    }).then(() => {
      fixture.detectChanges();
      const editStart = filterCallByAction(dispatchSpy, ProfileActions.Edit.Start);
      expect(editStart.length).toBe(1);
      expect(editStart[0].baseProfile).toEqual(dogeProfile);
      expect(editStart[0].payload).toEqual({ nickname: 'Wow' });
    });
  }));

  it('should display error messages', async(() => {
    store.dispatch(new ProfileActions.Edit.Failed('Foobar error.', 'doge'));
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const message = fixture.nativeElement.querySelector('div:last-child').textContent;
      expect(message).toBe('Foobar error.');
    });
  }));
});
