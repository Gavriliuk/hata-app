import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReviewsPage } from './reviews-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    ReviewsPage,
  ],
  imports: [
    IonicPageModule.forChild(ReviewsPage),
    SharedModule
  ],
  exports: [
    ReviewsPage
  ]
})
export class ReviewsPageModule {}
