import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LobbyComponent } from './lobby.component';
import { SignUpComponent } from './sign-up.component';
import { SignInComponent } from './sign-in.component';
import { ProfileViewComponent } from './profile-view.component';
import { ProfileEditComponent } from './profile-edit.component';
import { GameCreateComponent } from './game-create.component';
import { HallOfFameComponent } from './hall-of-fame.component';

const routes: Routes = [
  { path: '', redirectTo: '/lobby', pathMatch: 'full' },
  { path: 'lobby', component: LobbyComponent },
  { path: 'sign_up', component: SignUpComponent },
  { path: 'sign_in', component: SignInComponent },
  { path: 'profile/:username', component: ProfileViewComponent },
  { path: 'profile/:username/edit', component: ProfileEditComponent },
  { path: 'create_game', component: GameCreateComponent },
  { path: 'hall_of_fame', component: HallOfFameComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}

