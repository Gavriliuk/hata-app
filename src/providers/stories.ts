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
  static getStoryIndexByYear(stories, selectedYear) {
    for (let index = 0; index < stories.length; index++) {
      if (stories[index].startPeriod.getFullYear() == selectedYear) {
        return index;
      }
    }
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
