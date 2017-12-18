import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs/Observable';

import { Store } from '@ngrx/store';

import { State } from './state/reducer';
import { WinsInfo } from './state/reducers/hall-of-fame';

import * as RouterActions from './state/actions/router';
import * as HallOfFameActions from './state/actions/hall-of-fame';

@Component({
  selector: 'app-hall-of-fame',
  templateUrl: './hall-of-fame.component.html',
  styleUrls: ['./hall-of-fame.component.css']
})
export class HallOfFameComponent implements OnInit {
  wins: Observable<WinsInfo[]>;

  constructor(
    private store: Store<State>,
  ) {
    this.wins = this.store.select('hallOfFame', 'wins');
  }

  ngOnInit() {
    this.store.select('user')
      .filter(user => user != null && !user.cold)
      .first()
      .subscribe(user => {
        if (user.authUser == null) {
          this.store.dispatch(
            new RouterActions.GoByUrl('sign_in')
          );
        } else {
          this.store.dispatch(
            new HallOfFameActions.Get.Start()
          );
        }
      });
  }

}
