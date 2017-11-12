import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import 'rxjs/add/operator/switchMap';

import { Profile } from './profile';
import { UserService } from './user.service';

@Component({
  selector: 'app-profile-view',
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css']
})
export class ProfileViewComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
  ) {}

  nickname: string;
  gamesTotal: number;
  gamesWon: number;
  winRate: number;
  ranking: number;

  ngOnInit(): void {
    this.getProfile();
  }

  getProfile() {
    this.route.paramMap
    .switchMap((params: ParamMap) => this.userService.getProfile(params.get('username')))
    .subscribe(profile => {
      this.nickname = profile.nickname;
      this.gamesTotal = profile.gamesTotal;
      this.gamesWon = profile.gamesWon;
      this.winRate = profile.gamesWon / profile.gamesTotal;
      this.ranking = profile.ranking;
    });
  }
}
