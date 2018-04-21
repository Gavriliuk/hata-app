import { Injectable } from '@angular/core';
import Parse from 'parse';

@Injectable()
export class Promocode extends Parse.Object {

  constructor() {
    super('Promocode');
  }

  static apply(code, deviceId) {
    return new Promise((resolve, reject) => {
      Parse.Cloud.run('applyPromocode', { promocode: code, deviceId: deviceId }).then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  static validate(code, routeId) {
    return new Promise((resolve, reject) => {
      Parse.Cloud.run('validatePromocode', { promocode: code, routeId: routeId }).then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  get code(): string {
    return this.get('code');
  }
  get route(): string[] {
    return this.get('route');
  }
}

Parse.Object.registerSubclass('Promocode', Promocode);
