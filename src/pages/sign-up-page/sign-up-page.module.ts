import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SignUpPage } from './sign-up-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    SignUpPage,
  ],
  imports: [
    IonicPageModule.forChild(SignUpPage),
    SharedModule
  ],
  exports: [
    SignUpPage
  ]
})
export class SignUpPageModule {}
