import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import 'rxjs/add/operator/switchMap';

import { Profile } from './profile';
import { UserService } from './user.service';

@Component({
  selector: 'profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
  ) {}

  profile: Profile;
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string;
  nickname: string;
  retry: boolean = false;


  ngOnInit(): void {
    this.getProfile()
  }

  getProfile() {
    this.route.paramMap
    .switchMap((params: ParamMap) => this.userService.getProfile(params.get('username')))
    .subscribe(profile => {
      this.profile = profile;
      this.nickname = profile.nickname;
    });
  }

  submit() {
    this.retry = false;
    if(this.newPassword !== this.confirmPassword) {
      this.newPassword = '';
      this.confirmPassword = '';
      this.retry = true;
    }
    else {
      this.userService.editProfile(this.profile, this.currentPassword, this.newPassword, this.nickname);
    }
  }
}
