import { VgAPI } from 'videogular2/core';
import { StoryPoiPlayMode } from './story-poi-play-mode';



export class PoiOnlyPlayMode extends StoryPoiPlayMode {

  playNext() {
  }

  playPrev() {
  }

  async play() {
    await super.init();
    super.onMove();
  }

  onPlayerReady(api: VgAPI) {
    this.videogularApi = api;
    this.videogularApi.playbackRate = this.playBackRateValues[this.playBackRateIndex];
  }

}
