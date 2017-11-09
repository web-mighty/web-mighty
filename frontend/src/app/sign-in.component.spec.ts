import { ComponentFixture, TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockComponent, filterCallByAction } from './testing';

import { Observable } from 'rxjs/Observable';
import { never as observableNever } from 'rxjs/observable/never';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { APP_BASE_HREF } from '@angular/common'
import { Store } from '@ngrx/store';
import { State } from './state/reducer';

// Actions
import { AppActions } from './state/app-actions';
import * as RouterActions from './state/actions/router';
import * as UserActions from './state/actions/user';

// Reducers
import { userReducer } from './state/reducers/user';

// Effects
import { RouterEffects } from './state/effects/router';

import { SignInComponent } from './sign-in.component'


const routerStub = {
  navigateByUrl: jasmine.createSpy('navigateByUrl'),
};

describe('SignInComponent', () => {
  let comp: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let store: Store<State>;
  let dispatchSpy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SignInComponent,
        MockComponent,
      ],
      imports: [
        FormsModule,
        RouterTestingModule.withRoutes([
          { path: 'sign_up', component: MockComponent },
        ]),
        StoreModule.forRoot({
          user: userReducer,
        }),
        EffectsModule.forRoot([
          RouterEffects,
        ]),
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: Router, useValue: routerStub },
        provideMockActions(observableNever),
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(SignInComponent);
      comp = fixture.componentInstance;
      store = fixture.debugElement.injector.get(Store);
      dispatchSpy = spyOn(store, 'dispatch');
      fixture.detectChanges();
    });
  }));

  it('can instantiate it', () => {
    expect(comp).not.toBeNull();
  });

  it('should try to navigate to "/sign_up" when Sign up button is clicked', async(() => {
    const signUpButton = fixture.debugElement.nativeElement.querySelector('.sign-up-button');
    signUpButton.click();

    const gotoSignUp = filterCallByAction(dispatchSpy, RouterActions.GoByUrl);
    expect(gotoSignUp.length).toBe(1);
    const payload = gotoSignUp.map(action => action.url);
    expect(payload.some(url => url == 'sign_up')).toBeTruthy();
  }));

  it('should try to sign in when Sign in button is clicked', async(() => {
    const usernameBox = fixture.debugElement.nativeElement.querySelector('input[name="username"]');
    usernameBox.value = 'foo';
    usernameBox.dispatchEvent(new Event('input'));
    const passwordBox = fixture.debugElement.nativeElement.querySelector('input[name="password"]');
    passwordBox.value = 'bar';
    passwordBox.dispatchEvent(new Event('input'));
    const signInButton = fixture.debugElement.nativeElement.querySelector('.sign-in-button');
    signInButton.click();

    const signInStart = filterCallByAction(dispatchSpy, UserActions.SignIn.Start);
    expect(signInStart.length).toBe(1);
    const payload = signInStart.map(action => action.payload);
    expect(payload.some(({ username, password }) =>
      username === 'foo' &&
      password === 'bar'
    )).toBeTruthy();
  }));
});
