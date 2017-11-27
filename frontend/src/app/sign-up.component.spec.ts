import { ComponentFixture, TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { FormsModule } from '@angular/forms';
import { APP_BASE_HREF } from '@angular/common';

// Reducers
import { userReducer } from './state/reducers/user';

import { SignUpComponent } from './sign-up.component';

let comp: SignUpComponent;
let fixture: ComponentFixture<SignUpComponent>;

describe('SignUpComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SignUpComponent,
      ],
      imports: [
        FormsModule,
        StoreModule.forRoot({
          user: userReducer,
        }),
      ],
      providers: [
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(SignUpComponent);
      comp = fixture.componentInstance;
      fixture.detectChanges();
    });
  }));

  it('can instantiate it', () => {
    expect(comp).not.toBeNull();
  });
});
