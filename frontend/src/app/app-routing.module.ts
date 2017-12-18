import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { LobbyComponent } from './lobby.component';
import { SignUpComponent } from './sign-up.component';
import { SignInComponent } from './sign-in.component';
import { VerifyAccountComponent } from './verify-account.component';
import { ProfileViewComponent } from './profile-view.component';
import { ProfileEditComponent } from './profile-edit.component';
import { GameRoomComponent } from './game/game-room.component';
import { GameBidComponent } from './game/game-bid.component';
import { FriendSelectComponent } from './game/friend-select.component';
import { CardViewComponent } from './game/card-view.component';
import { CardPlayerComponent } from './game/card-player.component';
import { GameCreateComponent } from './game-create.component';
import { HallOfFameComponent } from './hall-of-fame.component';

const routes: Routes = [
  { path: '', redirectTo: '/lobby', pathMatch: 'full' },
  { path: 'lobby', component: LobbyComponent },
  { path: 'sign_up', component: SignUpComponent },
  { path: 'sign_in', component: SignInComponent },
  { path: 'verify_account/:token', component: VerifyAccountComponent },
  { path: 'profile/:username', component: ProfileViewComponent },
  // { path: 'profile/:username/edit', component: ProfileEditComponent },
  { path: 'room/:roomId', component: GameRoomComponent },
  { path: 'create_game', component: GameCreateComponent },
  { path: 'hall_of_fame', component: HallOfFameComponent },

  { path: '**', redirectTo: '/lobby' }, // FIXME: NotFoundComponent?
];

@NgModule({
  declarations: [
    LobbyComponent,
    SignUpComponent,
    SignInComponent,
    VerifyAccountComponent,
    ProfileViewComponent,
    ProfileEditComponent,
    GameRoomComponent,
    GameBidComponent,
    FriendSelectComponent,
    CardViewComponent,
    CardPlayerComponent,
    GameCreateComponent,
    HallOfFameComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forRoot(routes),
  ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}

