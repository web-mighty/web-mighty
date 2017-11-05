import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { UserService } from './user.service';

@Component({
  selector: 'sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent {
  constructor(
    private router: Router,
    private userService: UserService,
  ) {}
  username: string;
  password: string;

  signIn() {
    this.userService.signIn(this.username, this.password);
  }

  gotoSignUp() {
    this.router.navigateByUrl('sign_up');
  }
}
