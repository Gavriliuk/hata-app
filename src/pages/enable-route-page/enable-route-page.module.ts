import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EnableRoutePage } from './enable-route-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    EnableRoutePage,
  ],
  imports: [
    IonicPageModule.forChild(EnableRoutePage),
    SharedModule
  ],
  exports: [
    EnableRoutePage
  ]
})
export class EnableRoutePageModule {}
