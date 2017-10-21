import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddReviewPage } from './add-review-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    AddReviewPage,
  ],
  imports: [
    IonicPageModule.forChild(AddReviewPage),
    SharedModule
  ],
  exports: [
    AddReviewPage
  ]
})
export class AddReviewPageModule {}
