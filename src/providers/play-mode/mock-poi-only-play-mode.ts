import { VgAPI } from 'videogular2/core';
import { StoryPoiPlayModeMock } from './mock-story-poi-play-mode';



export class PoiOnlyPlayModeMock extends StoryPoiPlayModeMock {

  playNext() {
  }

  playPrev() {
  }

  async play() {
    this.routeValues = await this.storage.getRouteAllValues(this.params.route.id);
    super.onMove();
  }

  onPlayerReady(api: VgAPI) {
    // this.videogularApi = api;
    // this.videogularApi.playbackRate = this.playBackRateValues[this.playBackRateIndex];
  }

}
