import { ComponentFixture, TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppStateModule } from './state/app-state.module';

import { FormsModule } from '@angular/forms';
import { APP_BASE_HREF } from '@angular/common';

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
        RouterTestingModule.withRoutes([
        ]),
        AppStateModule,
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
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
