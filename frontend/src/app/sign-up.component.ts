import { Component } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {
  constructor(
    private userService: UserService,
  ) {}
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  nickname = '';
  retry = false;

  signUp() {
    this.retry = false;
    if (this.password !== this.confirmPassword) {
      this.password = '';
      this.confirmPassword = '';
      this.retry = true;
    } else {
      if (this.nickname === '') {
        this.nickname = this.username;
      }
      this.userService.signUp(this.email, this.username, this.password);
    }
  }
}
