import { Injectable } from '@angular/core';
import Parse from 'parse';


@Injectable()
export class Category extends Parse.Object {

  constructor() {
    super('Category');
  }

  get icon() {
    return this.get('icon');
  }
}

Parse.Object.registerSubclass('Category', Category);
