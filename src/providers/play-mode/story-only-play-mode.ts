import { Injector } from '@angular/core';
import { Utils } from '../utils';
import { Story } from '../parse-models/stories';
import { VgAPI } from 'videogular2/core';
import { AbstractPlayMode } from './abstract-play-mode';


export class StoryOnlyPlayMode extends AbstractPlayMode {


  sortedStories: Story[];
  subscribedEvents: any[] = [];

  constructor(injector: Injector) {
    super(injector);
  }

  onPlayerReady(api: VgAPI) {
    this.videogularApi = api;
    // debugger
    if (this.videogularApi.getDefaultMedia()) {
      this.playerSubscriptions.push(this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough.subscribe(
        () => {
          this.videogularApi.playbackRate = this.playBackRateValues[this.playBackRateIndex];
        }
      ));
      this.playerSubscriptions.push(this.videogularApi.getDefaultMedia().subscriptions.playing.subscribe(
        () => {
          console.log("StoryOnlyPlayMode: this.videogularApi.getDefaultMedia().subscriptions.playing: ");
        }
      ));
      this.playerSubscriptions.push(this.videogularApi.getDefaultMedia().subscriptions.ended.subscribe(
        () => {
          console.log("StoryOnlyPlayMode: subscriptions.ended");

          this.playNext();
        }
      ));
    }
  }

  async play() {
    this.routeValues = await this.storage.getRouteAllValues(this.params.route.id);
    this.currentAudio = this.getAudioFromStoriesByIndex(this.routeValues.listenedStoryIndex);
    // debugger
    if (this.routeValues.selectedYear != this.currentAudio.selectedPeriodYear) {
      console.log("StoryOnly, broadcast event: periodChanged");
      this.events.publish("periodChanged", this.currentAudio.selectedPeriodYear);
    }
    this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);
  }

  async init(params) {
    super.init(params);
    this.lang = await this.storage.lang;
    this.sortedStories = !this.sortedStories ? await this.loadSortedStories() : this.sortedStories;
    this.playBackRateIndex = await this.storage.playBackRateIndex;
    this.playBackRateValues = await this.storage.playBackRateValues;
  }

  async playNext() {
    if (!this.isLastStory()) {
      ++this.routeValues.listenedStoryIndex;
      await this.storage.updateRouteValues(this.params.route.id, this.routeValues);
      this.play();
    }
  }

  async playPrev() {
    if (!this.isFirstStory()) {
      --this.routeValues.listenedStoryIndex;
      await this.storage.updateRouteValues(this.params.route.id, this.routeValues);
      this.play();
    }
  }

  changePeriod(year: any) {
    this.routeValues.selectedYear = year;
    const storyIndex = this.getStoryIndexByYear(this.sortedStories, year);
    if (storyIndex != -1) {
      this.routeValues.listenedStoryIndex = storyIndex;
      this.storage.updateRouteValues(this.params.route.id, this.routeValues);
      this.play();
    }
  }

  isLastStory() {
    return this.routeValues.listenedStoryIndex == this.sortedStories.length - 1;
  }

  isFirstStory() {
    return this.routeValues.listenedStoryIndex == 0;
  }
  getSubscribedEvents(): any[] {
    return this.subscribedEvents;
  }

  private getAudioFromStoriesByIndex(index) {
    let audio = { 'id': null, 'src': null, 'title': null, 'type': null, 'period': null, 'selectedPeriodYear': null };
    // const index =

    audio.id = this.sortedStories[index].id;
    audio.src = Utils.getFileURL(this.sortedStories[index]['audio_' + this.lang].name());
    audio.title = this.sortedStories[index].name;
    audio.type = "Story";
    audio.period = this.sortedStories[index].startPeriod.getFullYear() + " - " + this.sortedStories[index].endPeriod.getFullYear();
    audio.selectedPeriodYear = this.sortedStories[index].startPeriod.getFullYear() + "";
    // }
    return audio;
  }

  //TODO get story between start-end by period
  getStoryIndexByYear(stories, selectedYear) {
    for (let index = 0; index < stories.length; index++) {
      if (stories[index].startPeriod.getFullYear() + "" == selectedYear) {
        return index;
      }
    }
    return -1;
  }
}
