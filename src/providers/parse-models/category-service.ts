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
  get title_ro() {
    return this.get('title_ro');
  }
}

Parse.Object.registerSubclass('Category', Category);
