import { NgModule } from '@angular/core';
import { IonicPageModule} from 'ionic-angular';
import { MapPage } from './map-page';
import { SharedModule } from '../../shared.module';

import { VgCoreModule } from 'videogular2/core';
// import {VgAPI} from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';


@NgModule({
  declarations: [
    MapPage,
  ],
  imports: [
    IonicPageModule.forChild(MapPage),
    SharedModule,
    VgCoreModule,
    // VgAPI,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule
  ],
  exports: [
    MapPage
  ]
})
export class MapPageModule {}
