import { AbstractPlayMode } from './abstract-play-mode';
import { StoryOnlyPlayMode } from './story-only-play-mode';
import { StoryPoiPlayMode } from './story-poi-play-mode';
import { PoiOnlyPlayMode } from './poi-only-play-mode';
import { StoryPoiPlayModeMock } from './mock-story-poi-play-mode';
import { PoiOnlyPlayModeMock } from './mock-poi-only-play-mode';

export class PlayMode {


  static getInstance(injector, playMode): AbstractPlayMode {
    switch (playMode) {
      case "storyOnly":
        return new StoryOnlyPlayMode(injector);
      case "storyPoi":
        return new StoryPoiPlayModeMock(injector);
      case "poiOnly":
        return new PoiOnlyPlayModeMock(injector);
      default:
        throw new Error("Play mode not implemented.");
    }
  }


}
