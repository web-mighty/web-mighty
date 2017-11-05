import { ComponentFixture, TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { Component } from '@angular/core'
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { APP_BASE_HREF } from '@angular/common'

import { SignInComponent } from './sign-in.component'
import { UserService } from './user.service';

let comp: SignInComponent;
let fixture: ComponentFixture<SignInComponent>;

@Component({
    template: ''
})
class MockSignUpComponent {}

let routerStub = {
  navigateByUrl: jasmine.createSpy('navigateByUrl'),
}

describe('SignInComponent', () => {
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
      ],
      providers: [
        UserService,
        { provide: APP_BASE_HREF, useValue: '/' },
        { provide: Router, useValue: routerStub },
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

  it('should navigate to "/sign_up" when Sign up button is clicked', () => {
    const signUpButton = fixture.debugElement.nativeElement.querySelector('.sign-up-button');
    signUpButton.click();
    expect(routerStub.navigateByUrl).toHaveBeenCalledWith('sign_up');
    expect(routerStub.navigateByUrl).toHaveBeenCalledTimes(1);
  });
});
