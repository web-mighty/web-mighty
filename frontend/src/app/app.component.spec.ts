import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AppStateModule } from './state/app-state.module';

import { AppComponent } from './app.component';
import { MenuBarComponent } from './menu-bar.component';
import { UserService } from './user.service';

let comp: AppComponent;
let fixture: ComponentFixture<AppComponent>;

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MenuBarComponent,
      ],
      imports: [
        RouterTestingModule.withRoutes([]),
        AppStateModule,
      ],
      providers: [
        UserService
      ],
    }).compileComponents()
    .then(() => {
      fixture = TestBed.createComponent(AppComponent);
      comp = fixture.componentInstance;
    });
  }));

  it('can instantiate it', () => {
    expect(comp).not.toBeNull();
  });
});
