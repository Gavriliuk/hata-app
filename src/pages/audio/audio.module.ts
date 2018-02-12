import {NgModule, NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicPageModule } from 'ionic-angular';
import { AudioPage } from './audio';
import { IonicAudioModule, defaultAudioProviderFactory } from 'ionic-audio';

@NgModule({
  declarations: [
    AudioPage,
  ],
  imports: [
    CommonModule,
    IonicPageModule.forChild(AudioPage),
    IonicAudioModule.forRoot(defaultAudioProviderFactory)
  ],
  exports: [
    AudioPage
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AudioPageModule {}
