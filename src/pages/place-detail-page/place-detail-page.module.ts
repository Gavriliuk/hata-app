import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PlaceDetailPage } from './place-detail-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    PlaceDetailPage,
  ],
  imports: [
    IonicPageModule.forChild(PlaceDetailPage),
    SharedModule
  ],
  exports: [
    PlaceDetailPage
  ]
})
export class PlaceDetailPageModule {}
