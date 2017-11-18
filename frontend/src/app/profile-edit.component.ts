import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/combineLatest';

import { Profile } from './profile';

import * as RouterActions from './state/actions/router';
import * as ProfileActions from './state/actions/profile';

import { State } from './state/reducer';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
  profile: Observable<Profile | null>;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  nickname: string;
  error: Observable<string | null>;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store<State>,
  ) {
    const username = this.route.paramMap
      .map((params: ParamMap) => params.get('username'));
    const authUser = this.store.select('user').map(user => user.authUser);

    // redirect if the user does not have permission
    username.combineLatest(authUser, (username, authUser) => {
      if (authUser === null) {
        return { username, hasPermission: false };
      } else {
        return { username, hasPermission: username === authUser.username };
      }
    }).subscribe(({ username, hasPermission }) => {
      if (!hasPermission) {
        this.store.dispatch(new RouterActions.GoByUrl(`profile/${username}`));
      }
    });

    username.subscribe((username: string) => {
      this.store.dispatch(new ProfileActions.Get.Start(username));
    });
    this.profile = username.switchMap((username: string) =>
      this.store.select('profile').map(profile => {
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
    this.error = this.store.select('profile').map(profile => profile.edit.currentError);
  }

  ngOnInit() {}

  submit() {
    // TODO: verify password?
    this.profile.first().subscribe(profile => {
      if (profile === null) {
        return;
      }
      this.store.dispatch(
        new ProfileActions.Edit.Start(profile, { nickname: this.nickname })
      );
    });
  }
}
