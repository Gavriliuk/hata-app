import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddPlacePage } from './add-place-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    AddPlacePage,
  ],
  imports: [
    IonicPageModule.forChild(AddPlacePage),
    SharedModule
  ],
  exports: [
    AddPlacePage
  ]
})
export class AddPlacePageModule {}
