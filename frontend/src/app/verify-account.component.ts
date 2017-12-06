import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

import { State } from './state/reducer';

import * as RouterActions from './state/actions/router';
import * as UserActions from './state/actions/user';

@Component({
  selector: 'app-verify-account',
  templateUrl: './verify-account.component.html',
  styleUrls: ['./verify-account.component.css']
})
export class VerifyAccountComponent implements OnInit {
  signedIn: Observable<boolean>;
  failureReason: Observable<string>;
  verificationPending: Observable<boolean>;
  verificationDone: Observable<boolean>;

  private static mapReason(reason: string): string {
    switch (reason) {
      case 'invalid':
        return 'Invalid request. Please check the URL.';
      case 'crash':
        return 'Encountered server error.';
      case 'unknown':
        return 'Unknown error.';
      default:
        return '';
    }
  }

  constructor(
    private store: Store<State>,
    private route: ActivatedRoute,
  ) {
    this.signedIn =
      this.store.select('user')
      .filter(user => user != null)
      .filter(user => !user.cold && !user.verifying)
      .map(user => user.authUser != null);
    this.failureReason =
      this.store.select('user', 'accountVerification', 'failureReason')
      .filter(status => status != null)
      .map(VerifyAccountComponent.mapReason);
    this.verificationPending =
      this.store.select('user', 'accountVerification', 'status')
      .map(status => status === 'pending');
    this.verificationDone =
      this.store.select('user', 'accountVerification', 'status')
      .map(status => status === 'done');
  }

  ngOnInit() {
    const token =
      this.route.paramMap
      .map(params => params.get('token'));

    // Do not try when signed in
    this.signedIn
      .filter(signedIn => !signedIn)
      .first()
      .mergeMap(() => token)
      .subscribe(token => {
        this.store.dispatch(
          new UserActions.VerifyAccount.Start(token)
        );
      });
  }

  gotoSignIn() {
    this.store.dispatch(new RouterActions.GoByUrl('sign_in'));
  }
}
