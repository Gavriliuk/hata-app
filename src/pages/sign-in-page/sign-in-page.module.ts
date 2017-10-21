import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SignInPage } from './sign-in-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    SignInPage,
  ],
  imports: [
    IonicPageModule.forChild(SignInPage),
    SharedModule
  ],
  exports: [
    SignInPage
  ]
})
export class SignInPageModule {}
