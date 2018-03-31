import {Injectable} from '@angular/core';
import Parse from 'parse';

@Injectable()
export class Route extends Parse.Object {

  constructor() {
    super('Route');
  }

  static load(): Promise<Route[]> {

    return new Promise((resolve, reject) => {
      let query = new Parse.Query(this);
      query.find().then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
      query.include('story');
    });
  }

  static getPlacesRelation(route) {
    return new Promise((resolve, reject) => {
      var relation = route.relation('placesRelation');
      var query = relation.query();
      query.find().then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  static getStoriesRelation(route) {
    return new Promise((resolve, reject) => {
      var relation = route.relation('storiesRelation');
      var query = relation.query();
      query.find().then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  get placesRelation(): string {
    return this.get('placesRelation');
  }
  get storiesRelation(): string {
    return this.get('storiesRelation');
  }

  get title_ru(): string {
    return this.get('title_ru');
  }
  get title_ro(): string {
    return this.get('title_ro');
  }
  get title_en(): string {
    return this.get('title_en');
  }

  get information_ru(): string {
    return this.get('information_ru');
  }
  get information_ro(): string {
    return this.get('information_ro');
  }
  get information_en(): string {
    return this.get('information_en');
  }

  get start_route(): string {
    return this.get('start_route');
  }

  get waypoints(): string {
    return this.get('waypoints');
  }

  get end_route(): string {
    return this.get('end_route');
  }

  get center_map(): string {
    return this.get('center_map');
  }

  get icon() {
    return this.get('icon');
  }

  get image() {
    return this.get('image');
  }

  get imageThumb() {
    return this.get('imageThumb');
  }

}

Parse.Object.registerSubclass('Route', Route);
