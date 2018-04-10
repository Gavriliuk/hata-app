import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AsyncPipe } from '@angular/common';


@Injectable()
export class LocalStorage {

  constructor(private storage: Storage) {
  }
  getStorage() {
    return this.storage;
  }
  get skipIntroPage(): Promise<any> {
    return this.storage.get('skipIntroPage');
  }

  set skipIntroPage(val) {
    this.storage.set('skipIntroPage', val);
  }

  get unit(): Promise<any> {
    return this.storage.get('unit');
  }

  set unit(val) {
    this.storage.set('unit', val);
  }

  get radius(): Promise<any> {
    return this.storage.get('radius');
  }

  set radius(val) {
    this.storage.set('radius', val);
  }

  get mapStyle(): Promise<any> {
    return this.storage.get('mapStyle');
  }

  set mapStyle(val) {

    this.storage.set('mapStyle', val);
  }

  get distance(): Promise<any> {
    return this.storage.get('distance');
  }

  set distance(val) {
    this.storage.set('distance', val);
  }

  get lang(): Promise<any> {
    return this.storage.get('lang');
  }

  set lang(val) {
    this.storage.set('lang', val);
  }

  get listenedPOI(): Promise<any> {
    return this.storage.get('listenedPOI');
  }

  set listenedPOI(val) {
    this.storage.set('listenedPOI', val);
  }

  get listenedStoryIndex(): Promise<any> {
    return this.storage.get('listenedStoryIndex');
  }

  set listenedStoryIndex(val) {
    this.storage.set('listenedStoryIndex', val);
  }

  set selectedYear(val) {
    this.storage.set('selectedYear', val);
  }

  get selectedYear(): Promise<any> {
    return this.storage.get('selectedYear');
  }

  get playMode(): Promise<any> {
    return this.storage.get('playMode');
  }

  set playMode(val) {
    this.storage.set('playMode', val);
  }

  setRouteValue(routeId, key, val) {
    let allRouteValues = this.storage.get(routeId)
    allRouteValues[key] = val;
    this.storage.set(routeId, allRouteValues);
  }
  updateRouteValues(routeId, allRouteValues) {
    this.storage.set(routeId, allRouteValues);
  }

  getRouteValue(routeId, key) {
    return this.storage.get(routeId)[key];
  }

  async getRouteAllValues(routeId) {
    //TODO get selectedYear from route
    return await this.storage.get(routeId) || {
      listenedPOI: [],
      listenedStories: [],
      listenedStoryIndex: -1,
      selectedYear: 1436,
      purchased:false
    };
  }

  clearLocalStorage() {
    this.storage.clear().then(() => {
      console.log('Keys have been cleared');
    });
  }

}
