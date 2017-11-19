import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/first';
import 'rxjs/add/observable/combineLatest';

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
  profile: Profile | null;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  nickname: string;
  error: string;


  constructor(
    private route: ActivatedRoute,
    private store: Store<State>,
  ) {
    const username = this.route.paramMap
      .map((params: ParamMap) => params.get('username'));
    username.subscribe((username: string) => {
      this.store.dispatch(new ProfileActions.Get.Start(username));
    });

    // redirect if the user does not have permission
    const authUser = this.store.select('user')
      .filter(user => user != null && !user.cold)
      .map(user => user.authUser);
    Observable.combineLatest(username.first(), authUser.first(), (username, authUser) => {
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

    const profile = username.switchMap((username: string) =>
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
    profile.subscribe(profile => this.profile = profile);

    const error = this.store.select('profile').map(profile => profile.edit.currentError);
    error.subscribe(error => this.error = error);
  }

  ngOnInit() {}

  submit() {
    // TODO: verify password?
    if (this.profile === null) {
      return;
    }
    this.store.dispatch(
      new ProfileActions.Edit.Start(this.profile, { nickname: this.nickname })
    );
  }
}
