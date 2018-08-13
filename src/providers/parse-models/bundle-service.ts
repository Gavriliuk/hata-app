import { Injectable } from '@angular/core';
import Parse from 'parse';

@Injectable()
export class Bundle extends Parse.Object {

  constructor() {
    super('Bundle');
  }

  static load(): Promise<Bundle[]> {

    return new Promise((resolve, reject) => {
      let query = new Parse.Query(this);
      query.include('story');
      query.find().then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }


  static apply(code, deviceId) {
    return new Promise((resolve, reject) => {
      Parse.Cloud.run('applyBundle', { bundle: code, deviceId: deviceId }).then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  static validate(code, routeId) {
    return new Promise((resolve, reject) => {
      Parse.Cloud.run('validateBundle', { bundle: code, routeId: routeId }).then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
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
  get description_ru(): string {
    return this.get('description_ru');
  }
  get description_ro(): string {
    return this.get('description_ro');
  }
  get description_en(): string {
    return this.get('description_en');
  }
  get code(): string {
    return this.get('code');
  }
  get route(): string[] {
    return this.get('route');
  }
  get isApproved(): string {
    return this.get('isApproved');
  }
  get isUsed(): string {
    return this.get('isUsed');
  }
  get sum(): string {
    return this.get('sum');
  }
  get canonical(): string {
    return this.get('canonical');
  }
}

Parse.Object.registerSubclass('Bundle', Bundle);
