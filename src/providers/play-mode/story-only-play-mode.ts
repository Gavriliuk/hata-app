import { Injector } from '@angular/core';
import { Utils } from '../utils';
import { Story } from '../parse-models/stories';
import { VgAPI } from 'videogular2/core';
import { AbstractPlayMode } from './abstract-play-mode';


export class StoryOnlyPlayMode extends AbstractPlayMode {

  sortedStories: Story[];
  subscribedEvents: any[];

  constructor(injector: Injector) {
    super(injector);
    this.subscribedEvents = this.buildEventsSubscription();
    this.subscribedEvents.forEach((event) => {
      this.events.unsubscribe(event.event)
      this.events.subscribe(event.event, event.handler)
    });
  }

  onPlayerReady(api: VgAPI) {
    this.videogularApi = api;
// debugger
    if(this.videogularApi.getDefaultMedia()){
          this.playerSubscriptions.push(this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough.subscribe(
      () => {
        console.log("StoryOnlyPlayMode: this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough: ");
        // this.videogularApi.playbackRate = 0.5;
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
    await this.init();
    this.currentAudio = this.getAudioFromStoriesByIndex(this.routeValues.listenedStoryIndex);
    // debugger
    if (this.routeValues.selectedYear != this.currentAudio.selectedPeriodYear) {
      console.log("StoryOnly, broadcast event: periodChanged");
      this.events.publish("periodChanged", this.currentAudio.selectedPeriodYear);
    }
    this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);
  }

  async init() {
    this.routeValues = await this.storage.getRouteAllValues(this.params.route.id);
    this.lang = await this.storage.lang;
    this.sortedStories = !this.sortedStories ? await this.loadSortedStories() : this.sortedStories;
  }

  playNext(): any {
    if (!this.isLastStory()) {
      ++this.routeValues.listenedStoryIndex;
      this.storage.updateRouteValues(this.params.route.id, this.routeValues);
      this.play();
    }
  }

  playPrev(): any {
    if (!this.isFirstStory()) {
      --this.routeValues.listenedStoryIndex;
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

  buildEventsSubscription(): any {
    return [
      {
        event: "onYearChanged",
        handler: (e) => {
          console.log("StoryOnlyPlayMode onYearChanged:", e);
          // debugger
          this.routeValues.selectedYear = e;
          const storyIndex = this.getStoryIndexByYear(this.sortedStories, e);
          if (storyIndex != -1) {
            this.routeValues.listenedStoryIndex = storyIndex;
            this.storage.updateRouteValues(this.params.route.id, this.routeValues);
            this.play();
          }
        }
      }
    ];
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
