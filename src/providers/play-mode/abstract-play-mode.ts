import { Injector } from '@angular/core';
import { LocalStorage } from '../local-storage';
import { Events, NavParams } from 'ionic-angular';
import { Route } from '../parse-models/routes';
import { VgAPI } from 'videogular2/core';

export abstract class AbstractPlayMode {

  lang: any;
  routeValues: any;
  navParams: NavParams;
  events: Events;
  storage: LocalStorage;
  videogularApi: VgAPI;
  playerSubscriptions: any[] = [];
  currentAudio: any = {
    'id': null,
    // 'src': "https://dromos.innovapp.eu/parse/files/dromos-cms/86a0cd15001fbfd788c2c160ed3d0a65_audio.mp3",
    'src': null,
    'title': null,
    'type': null,
    'period': null,
    'selectedPeriodYear': null
  };

  constructor(injector: Injector) {
    this.storage = injector.get(LocalStorage);
    this.events = injector.get(Events);
    this.navParams = injector.get(NavParams);
  }

  async loadSortedStories() {
    const routeDatabaseStories = await Route.getStoriesRelation(this.navParams.data);

    const sortedStories = await routeDatabaseStories.sort((a, b) => {
      if (a.startPeriod.getFullYear() == b.startPeriod.getFullYear()) {
        return a.name.localeCompare(b.name)
      } else {
        return a.startPeriod.getFullYear() - b.startPeriod.getFullYear();
      }
    });
    return sortedStories;
    //TODO get periods from Route
    //this.yearSelectionSlider.periods = Array.from(new Set(this.sortedStories.map((story) => story.startPeriod.getFullYear())));
  }

  unsubscribePlayer() {
    this.playerSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    })
  }

  abstract play();
  abstract playNext();
  abstract playPrev();
  abstract onPlayerReady(api: VgAPI);

}
