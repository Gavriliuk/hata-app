import {  Injector } from '@angular/core';
import { Utils } from '../utils';
import { Story } from '../parse-models/stories';
import { VgAPI } from 'videogular2/core';
import { AbstractPlayMode } from './abstract-play-mode';


export class StoryOnlyPlayMode extends AbstractPlayMode {


  sortedStories: Story[];

  constructor(injector: Injector) {
    super(injector);

    this.events.subscribe('onYearChanged', (e) => {
      console.log("StoryOnlyPlayMode onYearChanged:", e);
      // debugger
      this.routeValues.selectedYear = e;
      const storyIndex = this.getStoryIndexByYear(this.sortedStories, e);
      if (storyIndex != -1) {
        this.routeValues.listenedStoryIndex = storyIndex;
        this.storage.updateRouteValues(this.navParams.data.id, this.routeValues);
        this.play();
      }
    });
  }

  async initLocalStorage() {
    this.routeValues = await this.storage.getRouteAllValues(this.navParams.data.id);
    this.lang = await this.storage.lang;
  }

  async play() {
    await this.initLocalStorage();

    this.sortedStories = !this.sortedStories ? await this.loadSortedStories() : this.sortedStories;
    this.currentAudio = this.getAudioFromStoriesByIndex(this.routeValues.listenedStoryIndex);
    // debugger
    if (this.routeValues.selectedYear != this.currentAudio.selectedPeriodYear) {
      this.events.publish("periodChanged", this.currentAudio.selectedPeriodYear);
    }

    this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    this.storage.updateRouteValues(this.navParams.data.id, this.routeValues);
  }

  onPlayerReady(api: VgAPI) {
    this.videogularApi = api;
    this.playerSubscriptions.push(this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough.subscribe(
      () => {
        console.log("StoryOnlyPlayMode: this.videogularApi.getDefaultMedia().subscriptions.playing: ");
        this.videogularApi.playbackRate = 0.5;
      }
    ));
    this.playerSubscriptions.push(this.videogularApi.getDefaultMedia().subscriptions.playing.subscribe(
      () => {
        console.log("StoryOnlyPlayMode: this.videogularApi.getDefaultMedia().subscriptions.playing: ");
      }
    ));
    this.playerSubscriptions.push(this.videogularApi.getDefaultMedia().subscriptions.ended.subscribe(
      () => {
        this.playNext();
      }
    ));
  }

  playNext(): any {
    if (this.routeValues.listenedStoryIndex != this.sortedStories.length - 1) {
      ++this.routeValues.listenedStoryIndex;
      this.storage.updateRouteValues(this.navParams.data.id, this.routeValues);
      this.play();
    }
  }

  playPrev(): any {
    if (this.routeValues.listenedStoryIndex != 0) {
      --this.routeValues.listenedStoryIndex;
      this.storage.updateRouteValues(this.navParams.data.id, this.routeValues);
      this.play();
    }
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
    private getStoryIndexByYear(stories, selectedYear) {
      for (let index = 0; index < stories.length; index++) {
        if (stories[index].startPeriod.getFullYear() + "" == selectedYear) {
          return index;
        }
      }
      return -1;
    }
}
