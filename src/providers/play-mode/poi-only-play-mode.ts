import { VgAPI } from 'videogular2/core';
import { StoryPoiPlayMode } from './story-poi-play-mode';



export class PoiOnlyPlayMode extends StoryPoiPlayMode {

  async start() {
    this.routeValues = await this.storage.getRouteAllValues(this.params.route.id,this.params.route);
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
