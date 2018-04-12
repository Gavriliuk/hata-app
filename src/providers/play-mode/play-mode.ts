import { AbstractPlayMode } from './abstract-play-mode';
import { StoryOnlyPlayMode } from './story-only-play-mode';
import { StoryPoiPlayMode } from './story-poi-play-mode';
import { PoiOnlyPlayMode } from './poi-only-play-mode';

export class PlayMode {


  static getInstance(injector, playMode): AbstractPlayMode {
    switch (playMode) {
      case "storyOnly":
        return new StoryOnlyPlayMode(injector);
      case "storyPoi":
        return new StoryPoiPlayMode(injector);
      case "poiOnly":
        return new PoiOnlyPlayMode(injector);
      default:
        throw new Error("Play mode not implemented.");
    }
  }


}
