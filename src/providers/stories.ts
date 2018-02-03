import {Injectable} from '@angular/core';
import Parse from 'parse';


@Injectable()
export class Story extends Parse.Object {

  constructor() {
    super('Story');
  }

  static load(): Promise<Story[]> {

    return new Promise((resolve, reject) => {
      let query = new Parse.Query(this);
      query.find().then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  get year(): string {
    return this.get('year');
  }


  get audios_ru(): string {
    return this.get('audios_ru');
  }

  get audios_ro(): string {
    return this.get('audios_ro');
  }

  get audios_en(): string {
    return this.get('audios_en');
  }
}

Parse.Object.registerSubclass('Story', Story);
