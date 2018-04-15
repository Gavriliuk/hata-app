import { Injectable } from '@angular/core';
@Injectable()
export class Preference {

  private _playBackRateValues: number[];
  private _playBackRateIndex: number;
  private _unit;
  private _radius;
  private _mapStyle;
  private _distance;
  private _lang;
  private _playMode;

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
  get playMode(): any {
    return this._playMode;
  }

  set playMode(val) {
    this._playMode = val;
  }

  get playBackRateIndex(): any {
    return this._playBackRateIndex;
  }

  set playBackRateIndex(val) {
    this._playBackRateIndex = val;
  }
  get playBackRateValues(): number[] {
    return this._playBackRateValues;
  }

  set playBackRateValues(val) {
    this._playBackRateValues = val;
  }

}
