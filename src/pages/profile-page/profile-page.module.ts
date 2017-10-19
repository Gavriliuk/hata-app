import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ProfilePage } from './profile-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    ProfilePage,
  ],
  imports: [
    IonicPageModule.forChild(ProfilePage),
    SharedModule
  ],
  exports: [
    ProfilePage
  ]
})
export class ProfilePageModule {}
