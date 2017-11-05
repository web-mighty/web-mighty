import { ComponentFixture, TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppStateModule } from './state/app-state.module';

import { Component } from '@angular/core'
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { APP_BASE_HREF } from '@angular/common'
import { Store } from '@ngrx/store';

import { State } from './state/reducer';
import { SignInComponent } from './sign-in.component'
import { UserService } from './user.service';

@Component({
    template: ''
})
class MockSignUpComponent {}

const routerStub = {
  navigateByUrl: jasmine.createSpy('navigateByUrl'),
};
const userStub = {
  signUp: jasmine.createSpy('signUp'),
  signIn: jasmine.createSpy('signIn'),
  signOut: jasmine.createSpy('signOut'),
};

describe('SignInComponent', () => {
  let comp: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let store: Store<State>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SignInComponent,
        MockSignUpComponent,
      ],
      imports: [
        FormsModule,
        RouterTestingModule.withRoutes([
          { path: 'sign_up', component: MockSignUpComponent },
        ]),
        AppStateModule,
      ],
      providers: [
        UserService,
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: Router, useValue: routerStub },
        { provide: UserService, useValue: userStub },
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(SignInComponent);
      comp = fixture.componentInstance;
      fixture.detectChanges();
    });
  }));

  it('can instantiate it', () => {
    expect(comp).not.toBeNull();
  });

  it('should navigate to "/sign_up" when Sign up button is clicked', async(() => {
    const signUpButton = fixture.debugElement.nativeElement.querySelector('.sign-up-button');
    signUpButton.click();
    fixture.whenStable().then(() => {
      expect(routerStub.navigateByUrl).toHaveBeenCalledWith('sign_up');
      expect(routerStub.navigateByUrl).toHaveBeenCalledTimes(1);
    });
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
    expect(userStub.signIn).toHaveBeenCalledWith('foo', 'bar');
  }));
});
