import { Injectable } from '@angular/core';
import Parse from 'parse';


@Injectable()
export class Story extends Parse.Object {

  constructor() {
    super('Story');
  }

  static load(): Promise<Story[]> {

    return new Promise((resolve, reject) => {
      let query = new Parse.Query(this);
      query.ascending('startPeriod');
      query.find().then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  static filterStoriesByYear(routeDatabaseStories, selectedYearStory) {
    var filteredStories = selectedYearStory ? routeDatabaseStories.filter((story) => {
      return story.attributes.startPeriod.getFullYear() >= selectedYearStory;
    }) : routeDatabaseStories;
    let formatedStories = { 'ro': [], 'ru': [], 'en': [] };
    for (let lang of Object.keys(formatedStories)) {
      formatedStories[lang] = [];
      for (let story of filteredStories) {
        var tempObject: any = {};
        tempObject.name = story.attributes.name;
        tempObject.audio = story.attributes['audio_' + lang];
        tempObject.startPeriod = story.attributes.startPeriod;
        tempObject.endPeriod = story.attributes.endPeriod;
        formatedStories[lang].push(tempObject);
      }
      formatedStories[lang] = formatedStories[lang].sort(function (a, b) {
        return a.name.slice(0, 2) - b.name.slice(0, 2)
      });
    }
    return formatedStories;
  }

  get year(): string {
    return this.get('year');
  }

  get name(): string {
    return this.get('name');
  }

  get route() {
    return this.get('route');
  }

  get audio_ru(): string {
    return this.get('audio_ru');
  }

  get audio_ro(): string {
    return this.get('audio_ro');
  }

  get audio_en(): string {
    return this.get('audio_en');
  }

  get startPeriod(): string {
    return this.get('startPeriod');
  }

  get endPeriod(): string {
    return this.get('endPeriod');
  }
}

Parse.Object.registerSubclass('Story', Story);
