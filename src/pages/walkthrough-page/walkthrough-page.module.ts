import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WalkthroughPage } from './walkthrough-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    WalkthroughPage,
  ],
  imports: [
    IonicPageModule.forChild(WalkthroughPage),
    SharedModule
  ],
  exports: [
    WalkthroughPage
  ]
})
export class WalkthroughPageModule {}
