import { Injectable } from '@angular/core';
@Injectable()
export class Preference {

  private _unit;
  private _radius;
  private _mapStyle;
  private _distance;
  private _lang;
  private _filterCategory;

  get unit(): any {
    return this._unit;
  }

  set unit(val) {
    this._unit = val;
  }

  get radius(): any {
    return this._radius;
  }

  set radius(val) {
    this._radius = val;
  }

  get mapStyle(): any {
    return this._mapStyle;
  }

  set mapStyle(val) {
    this._mapStyle = val;
  }

  get distance(): any {
    return this._distance;
  }

  set distance(val) {
    this._distance = val;
  }

  get lang(): any {
    return this._lang;
  }

  set lang(val) {
    this._lang = val;
  }
  get filterCategory(): any {
    return this._filterCategory;
  }

  set filterCategory(val) {
    this._filterCategory = val;
  }

}
