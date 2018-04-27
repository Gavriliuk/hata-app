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
          // this.storage.incrementListenedStories().then(() => {
            this.playNext();

          // });
        }
      ));
    }
  }

  async playStory() {
    // let listenedStoryCount = await this.storage.listenedStories || 0;
    if (!this.routeValues.purchased && this.routeValues.listenedStoryIndex > 1) {
      this.paymentUtils.showPromoCodePrompt(this.params.route.id, () => {
        this.routeValues.purchased = true;
        this.pushStoryAudio();
      }, () => {
        console.log("KOO");
      });
    } else {
      await this.pushStoryAudio();
    }


  }

  private async pushStoryAudio() {
    this.currentAudio = this.getAudioFromStoriesByIndex(this.routeValues.listenedStoryIndex);
    this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);

    if (this.routeValues.selectedYear != this.currentAudio.selectedPeriodYear) {
      this.events.publish("periodChanged", this.currentAudio.selectedPeriodYear);
    }
  }

  async init(params) {
    await super.init(params);
    this.lang = await this.storage.lang;
    this.routeValues = await this.storage.getRouteAllValues(this.params.route.id);
    this.sortedStories = !this.sortedStories ? await this.loadSortedStories() : this.sortedStories;
    this.playBackRateIndex = await this.storage.playBackRateIndex;
    this.playBackRateValues = await this.storage.playBackRateValues;
  }

  async start() {
    if (!this.isLastStory()) {
       this.playStory();
    }
  }

  async playNext() {
    if (!this.isLastStory()) {
      ++this.routeValues.listenedStoryIndex;
      this.storage.updateRouteValues(this.params.route.id, this.routeValues).then(()=>{
        this.playStory()
      });
    }
  }

  async playPrev() {
    if (!this.isFirstStory()) {
      --this.routeValues.listenedStoryIndex;
      this.storage.updateRouteValues(this.params.route.id, this.routeValues).then(()=>{
        this.playStory()
      });
        }
  }

   changePeriod(year: any) {
    this.routeValues.selectedYear = year;
    const storyIndex = this.getStoryIndexByYear(this.sortedStories, year);
    if (storyIndex != -1) {
      this.routeValues.listenedStoryIndex = storyIndex;
       this.playStory();
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
    if (this.sortedStories.length) {
      audio.id = this.sortedStories[index].id;
      audio.src = Utils.getFileURL(this.sortedStories[index]['audio_' + this.lang].name());
      audio.title = this.sortedStories[index].name;
      audio.type = "Story";
      audio.period = this.sortedStories[index].startPeriod.getFullYear() + " - " + this.sortedStories[index].endPeriod.getFullYear();
      audio.selectedPeriodYear = this.sortedStories[index].startPeriod.getFullYear() + "";
    }
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
