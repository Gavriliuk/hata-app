import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MapPage } from './map-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    MapPage,
  ],
  imports: [
    IonicPageModule.forChild(MapPage),
    SharedModule
  ],
  exports: [
    MapPage
  ]
})
export class MapPageModule {}
