import { Injector } from '@angular/core';
import { VgAPI } from 'videogular2/core';
import { StoryPoiPlayMode } from './story-poi-play-mode';



export class PoiOnlyPlayMode extends StoryPoiPlayMode {

  constructor(injector: Injector) {
    super(injector);
  }

  playNext() {
    //throw new Error("Method not implemented.");
  }
  playPrev() {
    //throw new Error("Method not implemented.");
  }

  async play() {
    await super.init();
    super.onMove();

    console.log("Playing PoiOnlyPlayMode");
  }

    onPlayerReady(api: VgAPI) {
      // this.videogularApi = api;

      // this.playerSubscriptions.push(this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough.subscribe(
      //   () => {
      //     console.log("StoryOnlyPlayMode: this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough: ");
      //     // this.videogularApi.playbackRate = 0.5;
      //   }
      // ));
  }

  buildEventsSubscription(): any {
    return [
      {
        event: "onPlayerStateChanged",
        handler: (state, place) => {
          this.playerState = state;
        }
      }
    ];
  }
}
