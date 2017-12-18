import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { hallOfFameReducer } from './state/reducers/hall-of-fame';

import { HallOfFameComponent } from './hall-of-fame.component';

describe('HallOfFameComponent', () => {
  let component: HallOfFameComponent;
  let fixture: ComponentFixture<HallOfFameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HallOfFameComponent ],
      imports: [
        StoreModule.forRoot({
          hallOfFame: hallOfFameReducer,
        }),
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HallOfFameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
