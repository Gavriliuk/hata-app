import { Injector } from '@angular/core';
import { VgAPI } from 'videogular2/core';
import { StoryOnlyPlayMode } from './story-only-play-mode';
// import { Subscription } from 'rxjs/Subscription';



export class StoryPoiPlayMode extends StoryOnlyPlayMode {
  playNext() {
    console.warn("StoryPoiPlayMode playNext.");
    super.playNext();
  }
  playPrev() {
    console.warn("StoryPoiPlayMode playPrev.");

    super.playPrev();
  }
  constructor(injector: Injector) {
    super(injector);
  }
  async play() {
    console.warn("StoryPoiPlayMode play.");
    super.play()
  }

  onPlayerReady(api: VgAPI) {
    console.warn("StoryPoiPlayMode play.");
    super.onPlayerReady(api);
  }
}
