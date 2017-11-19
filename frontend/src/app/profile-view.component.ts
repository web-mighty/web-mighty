import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';

import { Profile } from './profile';

import * as ProfileActions from './state/actions/profile';

import { State } from './state/reducer';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css']
})
export class ProfileViewComponent implements OnInit {
  profile: Profile | null;
  error: string;
  nickname: string;
  /*
  gamesTotal: Observable<number>;
  gamesWon: Observable<number>;
  winRate: Observable<string>;
  ranking: Observable<number>;
   */


  constructor(
    private route: ActivatedRoute,
    private store: Store<State>,
  ) {
    const username = this.route.paramMap
      .map((params: ParamMap) => params.get('username'));
    username.subscribe((username: string) => {
      this.store.dispatch(new ProfileActions.Get.Start(username));
    });

    const profileState = this.store.select('profile').filter(profile => profile != null);
    const profile = username.switchMap((username: string) =>
      profileState.map(profile => {
        if (username in profile.profiles) {
          const currentProfile = profile.profiles[username];
          if (currentProfile.state === 'loaded') {
            return currentProfile.profile;
          } else {
            return null;
          }
        } else {
          return null;
        }
      })
    );
    profile.subscribe(profile => this.profile = profile);

    const nickname = profile.map(profile => profile ? profile.nickname : '');
    nickname.subscribe(nickname => this.nickname = nickname);

    const error = profileState.map(profile => profile.get.currentError);
    error.subscribe(error => this.error = error);
  }

  ngOnInit() {}
}
