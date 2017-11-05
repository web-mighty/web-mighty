import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { UserService } from './user.service';

@Component({
  selector: 'menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.css']
})
export class MenuBarComponent implements OnInit {

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
  }

  gotoLobby() {
    this.router.navigateByUrl('');
  }
  gotoProfile() {
    this.router.navigateByUrl('profile/someone');
  }
  gotoSignIn() {
    this.router.navigateByUrl('sign_in');
  }
  signOut() {
    this.userService.signOut();
  }

}
