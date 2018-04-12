import {  Injector } from '@angular/core';
import { VgAPI } from 'videogular2/core';
import { AbstractPlayMode } from './abstract-play-mode';
// import { Subscription } from 'rxjs/Subscription';



export class PoiOnlyPlayMode extends AbstractPlayMode {

  playNext() {
    throw new Error("Method not implemented.");
  }
  playPrev() {
    throw new Error("Method not implemented.");
  }
  constructor(injector: Injector) {
    super(injector);
  }
  play() {
    console.log("Playing PoiOnlyPlayMode");
  }
  onPlayerReady(api: VgAPI) {
    throw new Error("Method not implemented.");
  }
}
