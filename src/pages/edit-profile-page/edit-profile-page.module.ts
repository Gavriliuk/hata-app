import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EditProfilePage } from './edit-profile-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    EditProfilePage,
  ],
  imports: [
    IonicPageModule.forChild(EditProfilePage),
    SharedModule
  ],
  exports: [
    EditProfilePage
  ]
})
export class EditProfilePageModule {}
