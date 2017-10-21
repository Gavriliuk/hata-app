import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CategoriesPage } from './categories';
import { SharedModule } from '../../shared.module';
 
@NgModule({
  declarations: [
    CategoriesPage,
  ],
  imports: [
    IonicPageModule.forChild(CategoriesPage),
    SharedModule
  ],
  exports: [
    CategoriesPage
  ]
})
export class CategoriesPageModule {}
