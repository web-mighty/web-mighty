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
import { APP_BASE_HREF } from '@angular/common';
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

import { SignInComponent } from './sign-in.component';


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
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(SignInComponent);
      comp = fixture.componentInstance;
      store = fixture.debugElement.injector.get(Store);
      dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
      fixture.detectChanges();
    });
  }));

  it('can instantiate it', () => {
    expect(comp).not.toBeNull();
  });

  it('should check whether the user is signed in', () => {
    const redirect = filterCallByAction(dispatchSpy, UserActions.RedirectWithSignInState);
    expect(redirect.length).toBe(1);
    const payload = redirect[0].payload;
    expect(payload).toEqual({ when: 'signed-in', target: 'lobby' });
  });

  it('should try to navigate to "/sign_up" when Sign up button is clicked', () => {
    const signUpButton = fixture.debugElement.nativeElement.querySelector('.sign-up-button');
    signUpButton.click();

    const gotoSignUp = filterCallByAction(dispatchSpy, RouterActions.GoByUrl);
    expect(gotoSignUp.length).toBe(1);
    const payload = gotoSignUp[0].url;
    expect(payload).toBe('sign_up');
  });

  it('should try to sign in when Sign in button is clicked', () => {
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
    const payload = signInStart.map(action => action.payload)[0];
    expect(payload).toEqual({ username: 'foo', password: 'bar' });
  });

  it('should display error messages', async(() => {
    store.dispatch(new UserActions.SignIn.Failed('Foobar error.'));
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      const message = fixture.nativeElement.querySelector('form > div:last-child').textContent;
      expect(message).toBe('Foobar error.');
    });
  }));
});
