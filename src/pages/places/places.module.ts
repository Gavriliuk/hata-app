import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PlacesPage } from './places';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    PlacesPage,
  ],
  imports: [
    IonicPageModule.forChild(PlacesPage),
    SharedModule
  ],
  exports: [
    PlacesPage
  ]
})
export class PlacesPageModule {}
