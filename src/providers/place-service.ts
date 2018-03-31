import { Injectable } from '@angular/core';
import Parse from 'parse';

@Injectable()
export class Place extends Parse.Object {

  constructor() {
    super('Place');
  }

  distance(location, unit) {

    if (!location) {
      return null;
    }

    var geoPoint = new Parse.GeoPoint({
      latitude: location.latitude,
      longitude: location.longitude
    });

    if (unit === 'km') {
      return this.location.kilometersTo(geoPoint).toFixed(2) + ' ' + unit;
    } else if (unit === 'none') {
      return this.location.kilometersTo(geoPoint).toFixed(2);
    }else {
      return this.location.milesTo(geoPoint).toFixed(2) + ' ' + unit;
    }
  }

  static like(place) {

    return new Promise((resolve, reject) => {
      Parse.Cloud.run('likePlace', { placeId: place.id }).then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  static load(params): Promise<Place[]> {

    return new Promise((resolve, reject) => {

      let page = params.page || 0;
      let limit = params.limit || 50;
      let distance = params.distance || 100;

      let query = new Parse.Query(this);
      var subQuery = new Parse.Query(this);
      var subQueryTwo = new Parse.Query(this);

      subQuery.greaterThan('expiresAt', new Date());
      subQueryTwo.doesNotExist('expiresAt');

      query = Parse.Query.or(subQuery, subQueryTwo);
      query.include('route');
      query.equalTo('isApproved', true);

      if (params.route) {
        query.equalTo('route', params.route);
      }

      if (params.search && params.search !== '') {
        query.contains('canonical', params.search);
      }

      if (params.location) {

        var point = new Parse.GeoPoint({
          latitude: params.location.latitude,
          longitude: params.location.longitude
        });

        if (params.unit && params.unit === 'km') {
          query.withinKilometers('location', point, distance);
        } else {
          query.withinMiles('location', point, distance);
        }
      } else {
        query.descending('createdAt');
      }

      query.skip(page * limit);
      query.limit(limit);

      query.find().then(data => resolve(data), error => reject(error));
    });
  }

  static loadNearPlaces(params): Promise<Place[]> {

    return new Promise((resolve, reject) => {

      let page = params.page || 0;
      let limit = params.limit || 1;
      let distance = params.distance || 1;

      let query = new Parse.Query(this);
      var subQuery = new Parse.Query(this);
      var subQueryTwo = new Parse.Query(this);

      subQuery.greaterThan('expiresAt', new Date());
      subQueryTwo.doesNotExist('expiresAt');

      query = Parse.Query.or(subQuery, subQueryTwo);
      // query.include('route');
      query.equalTo('isApproved', true);

      if (params.except) {
        query.notContainedIn("objectId", params.except);
      }
      //
      // if (params.search && params.search !== '') {
      //   query.contains('canonical', params.search);
      // }

      if (params.location) {

        var point = new Parse.GeoPoint({
          latitude: params.location.latitude,
          longitude: params.location.longitude
        });

        if (params.unit && params.unit === 'km') {
          query.withinKilometers('location', point, distance);
        } else {
          query.withinMiles('location', point, distance);
        }
      }

      if (params && params.selectedYear && params.selectedYear != null) {
        query.lessThanOrEqualTo('startPeriod', new Date('01/01/'+params.selectedYear));
        query.greaterThanOrEqualTo('endPeriod', new Date('01/01/'+params.selectedYear));
      }

      // else {
      //   query.descending('createdAt');
      // }

      query.skip(page * limit);
      query.limit(limit);

      query.find().then(data => resolve(data), error => reject(error));
    });
  }

  static loadFavorites(params): Promise<Place[]> {

    return new Promise((resolve, reject) => {

      let page = params.page || 0;
      let limit = params.limit || 50;

      let query = new Parse.Query(this);
      query.equalTo('isApproved', true);
      query.equalTo('likes', Parse.User.current());

      query.skip(page * limit);
      query.limit(limit);

      query.find().then(data => resolve(data), error => reject(error));
    });
  }

  static create(data): Promise<Place> {

    return new Promise((resolve, reject) => {

      let place = new Parse.Object('Place');

      place.save(data).then(data => {
        resolve(data);
      }, error => {
        reject(error);
      });
    });
  }

  get title_ru(): string {
    return this.get('title_ru');
  }
  set title_ru(val) {
    this.set('title_ru', val);
  }

  get title_ro(): string {
    return this.get('title_ro');
  }
  set title_ro(val) {
    this.set('title_ro', val);
  }

  get title_en(): string {
    return this.get('title_en');
  }
  set title_en(val) {
    this.set('title_en', val);
  }

  get description_ru(): string {
    return this.get('description_ru');
  }
  set description_ru(val) {
    this.set('description_ru', val);
  }

  get description_ro(): string {
    return this.get('description_ro');
  }
  set description_ro(val) {
    this.set('description_ro', val);
  }

  get description_en(): string {
    return this.get('description_en');
  }
  set description_en(val) {
    this.set('description_en', val);
  }
  get address_ru(): string {
    return this.get('address_ru');
  }
  set address_ru(val) {
    this.set('address_ru', val);
  }

  get address_ro(): string {
    return this.get('address_ro');
  }
  set address_ro(val) {
    this.set('address_ro', val);
  }

  get address_en(): string {
    return this.get('address_en');
  }
  set address_en(val) {
    this.set('address_en', val);
  }

  get radius() {
    return this.get('radius');
  }
  set radius(val) {
    this.set('radius', val);
  }

  get route() {
    return this.get('route');
  }
  set route(val) {
    this.set('route', val);
  }

  get images() {
    return this.get('images');
  }

  set images(val) {
    this.set('images', val);
  }
  get original_images() {
    return this.get('original_images');
  }

  set original_images(val) {
    this.set('original_images', val);
  }

  get location() {
    return this.get('location');
  }

  set location(val) {
    var geoPoint = new Parse.GeoPoint({
      latitude: val.lat,
      longitude: val.lng
    });
    this.set('location', geoPoint);
  }

  get audio_ru() {
    return this.get('audio_ru');
  }
  set audio_ru(val) {
     this.set('audio_ru', val);
  }

  get audio_ro() {
    return this.get('audio_ro');
  }
  set audio_ro(val) {
    this.set('audio_ro', val);
  }

  get audio_en() {
    return this.get('audio_en');
  }
  set audio_en(val) {
    this.set('audio_en', val);
  }

  get startPeriod() {
    return this.get('startPeriod');
  }
  set startPeriod(val) {
    this.set('startPeriod', val);
  }

  get endPeriod() {
    return this.get('endPeriod');
  }
  set endPeriod(val) {
    this.set('endPeriod', val);
  }

  get imageThumb() {
    return this.get('imageThumb');
  }

  get ratingCount() {
    return this.get('ratingCount');
  }

  get ratingTotal() {
    return this.get('ratingTotal');
  }

  get rating() {

    if (!this.ratingCount && !this.ratingTotal) {
      return null;
    }

    return Math.round(this.ratingTotal / this.ratingCount);
  }

}

Parse.Object.registerSubclass('Place', Place);
