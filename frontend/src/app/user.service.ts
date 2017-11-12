import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

// Actions
import * as UserActions from './state/actions/user';

import { Profile } from './profile';

@Injectable()
export class UserService {
  constructor(private store: Store<void>) {}

  signOut() {
    this.store.dispatch(
      new UserActions.SignOut.Start()
    );
  }

  getProfile(username: string): Promise<Profile> {
    const profile: Profile = {
      user: { username: 'swpp', id: 1 },
      nickname: 'iluvswpp',
      gamesTotal: 10,
      gamesWon: 6,
      ranking: 1,
    };

    return Promise.resolve(profile);
  }

  editProfile(profile: Profile, currentPassword: string, newPassword: string, nickname: string) {
  }
}
