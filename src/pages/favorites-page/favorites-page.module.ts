import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FavoritesPage } from './favorites-page';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    FavoritesPage,
  ],
  imports: [
    IonicPageModule.forChild(FavoritesPage),
    SharedModule
  ],
  exports: [
    FavoritesPage
  ]
})
export class FavoritesPageModule {}
