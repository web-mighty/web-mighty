import { Component } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { AppComponent } from './app.component';
import { MenuBarComponent } from './menu-bar.component';

let comp: AppComponent;
let fixture: ComponentFixture<AppComponent>;

@Component({
  selector: 'app-menu-bar',
  template: ''
})
class MockMenuBarComponent {}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MockMenuBarComponent,
      ],
      imports: [
        RouterTestingModule.withRoutes([]),
      ],
      providers: [
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
