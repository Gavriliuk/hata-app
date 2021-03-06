import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Route } from './parse-models/routes';
// import { AsyncPipe } from '@angular/common';


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

  get playBackRateIndex(): Promise<any> {
    return this.storage.get('playBackRateIndex');
  }

  set playBackRateIndex(val) {
    this.storage.set('playBackRateIndex', val);
  }

  get playBackRateValues(): Promise<any> {
    return this.storage.get('playBackRateValues');
  }

  set playBackRateValues(val) {
    this.storage.set('playBackRateValues', val);
  }

  async setRouteValue(routeId, key, val): Promise<any> {
    let allRouteValues = await this.getRouteAllValues(routeId.toLocaleLowerCase());
    allRouteValues[key] = val;
    await this.updateRouteValues(routeId.toLocaleLowerCase(),allRouteValues);
  }
  updateRouteValues(routeId, allRouteValues): Promise<any> {
    return this.storage.set(routeId.toLocaleLowerCase(), allRouteValues);
  }

  async getRouteValue(routeId, key) {
    return await this.storage.get(routeId.toLocaleLowerCase())[key];
  }

  async getRouteAllValues(routeId, route: Route | any={'free': false}): Promise<any> {
    const fromStorage = await this.storage.get(routeId.toLocaleLowerCase());
    //TODO get selectedYear from route
    return fromStorage ? {...fromStorage,purchased: fromStorage.purchased || route.free} : {
      listenedPOI: [],
      listenedStories: [],
      listenedStoryIndex: 0,
      selectedYear: "",
      playMode: null,
      purchased: route.free || false
    };
  }

  async clearLocalStorage() {
    return this.storage.clear();
  }

  async setBundleValue(bundleId, key, val): Promise<any> {
    let allBundleValues = await this.getBundleAllValues(bundleId.toLocaleLowerCase());
    allBundleValues[key] = val;
    await this.updateBundleValues(bundleId.toLocaleLowerCase(),allBundleValues);
  }
  updateBundleValues(bundleId, allBundleValues): Promise<any> {
    return this.storage.set(bundleId.toLocaleLowerCase(), allBundleValues);
  }

  async getBundleValue(bundleId, key) {
    return await this.storage.get(bundleId.toLocaleLowerCase())[key];
  }

  async getBundleAllValues(bundleId): Promise<any> {
    return await this.storage.get(bundleId.toLocaleLowerCase()) || {
      purchased: false
    };
  }

}
