import { VgAPI } from 'videogular2/core';
import { StoryPoiPlayModeMock } from './mock-story-poi-play-mode';



export class PoiOnlyPlayModeMock extends StoryPoiPlayModeMock {


  async start() {
    this.routeValues = await this.storage.getRouteAllValues(this.params.route.id);
    super.onMove();
  }
  async playNext() {

  }

  async playPrev() {
  }

  onPlayerReady(api: VgAPI) {
    // this.videogularApi = api;
    // this.videogularApi.playbackRate = this.playBackRateValues[this.playBackRateIndex];
  }

}
