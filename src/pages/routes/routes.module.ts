import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RoutesPage } from './routes';
import { SharedModule } from '../../shared.module';

@NgModule({
  declarations: [
    RoutesPage,
  ],
  imports: [
    IonicPageModule.forChild(RoutesPage),
    SharedModule
  ],
  exports: [
    RoutesPage
  ]
})
export class RoutesPageModule {}
