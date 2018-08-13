import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BundlesPage } from '../bundles/bundles';
import { SharedModule } from '../../shared.module';

@NgModule({
  declarations: [
    BundlesPage,
  ],
  imports: [
    IonicPageModule.forChild(BundlesPage),
    SharedModule
  ],
  exports: [
    BundlesPage
  ]
})
export class BundlesPageModule {}
