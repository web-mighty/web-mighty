import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SignUpComponent } from './sign-up.component';
import { SignInComponent } from './sign-in.component';

const routes: Routes = [
  { path: '', redirectTo: 'sign_in', pathMatch: 'full' },
  { path: 'sign_up', component: SignUpComponent },
  { path: 'sign_in', component: SignInComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}

