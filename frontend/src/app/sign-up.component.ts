import { Component } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.css']
})
export class SignUpComponent {
  constructor(
    private userService: UserService,
  ) {}
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  retry: boolean = false;

  signUp() {
    this.retry = false;
    if(this.password !== this.confirmPassword) {
      this.password = '';
      this.confirmPassword = '';
      this.retry = true;
    }
    else {
      this.userService.signUp(this.email, this.username, this.password);
    }
  }
}
