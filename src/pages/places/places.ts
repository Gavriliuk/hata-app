import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { BasePage } from '../base-page/base-page';
import { Place } from '../../providers/place-service';
import { Preference } from '../../providers/preference';
import { Route } from '../../providers/routes';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { LocalStorage } from '../../providers/local-storage';
import { ChangeDetectorRef } from '@angular/core';
import { Platform, Events, Slides } from 'ionic-angular';

import { Story } from '../../providers/stories';
import Parse from 'parse';

import { MapStyle } from '../../providers/map-style';
import {
  GoogleMapsEvent, CameraPosition, GoogleMap,
  LatLng, LatLngBounds, Marker
} from '@ionic-native/google-maps';
import { ViewChild } from '@angular/core';
import { AlertController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-places',
  templateUrl: 'places.html'
})
export class PlacesPage extends BasePage {

  sortedStories: any;
  @ViewChild(Slides) slides: Slides;

  params: any = {};
  places: any = [];
  allMarkers: any[];
  route: Route;
  routeValues: any = {};

  lang: any;
  map: GoogleMap;
  mapStyle: any;
  unit: any;
  radius: any;
  isViewLoaded: boolean;

  videogularApi: any;
  playBackValues: any[] = [1, 1.5, 2, 3, 4];
  playBackRateIndex: any = 0;
  listeningPOI: Place;
  currentAudio: any = { 'src': null, 'title': null, 'type': null };
  nearAudio: any[];
  playMode: any;

  // listenedStoryIndex: any = 0;
  routeDatabasePlaces: any = [];
  routeDatabaseStories: any = [];
  storiesRelation: any = [];
  // listenedPOI: any = [];

  yearSelectionSlider = {
    periods: [],
    maximumPeriodsOnScreen: 4,
    showLeftButton: true,
    showRightButton: true,
  };

  // storyCheckboxResult: any=['storyOnly','poiOnly','storyPoi'];

  constructor(injector: Injector,
    private storage: LocalStorage,
    private geolocation: Geolocation,
    private preference: Preference,
    private events: Events,
    private platform: Platform,
    public alertCtrl: AlertController,
    private cdr: ChangeDetectorRef) {
    super(injector);
    this.isViewLoaded=true;
    this.storage = storage;

    this.events.subscribe('onMenuOpened', (e) => {
      if (this.map) {
        this.map.setClickable(false);
      }
    });

    this.events.subscribe('onMenuClosed', (e) => {
      if (this.map) {
        this.map.setClickable(true);
      }
    });

    this.params.route = this.navParams.data;
    this.params.unit = this.preference.unit;
    this.places = [];
    this.allMarkers = [];
  }
  /**
   * Fired only when a view is stored in memory.
   * This event is NOT fired on entering a view that is already cached.
   * It’s a nice place for init related tasks.
   */
  async ionViewDidLoad() {
    await this.initLocalStorage()
    await this.loadStories();

    this.map && this.map.clear();
    this.places = [];
    this.params.page = 0;

    this.isViewLoaded = true;
    this.showLoadingView();

    if (this.platform.is('cordova')) {
      this.initGoogleMap();
    } else {
      this.loadRoutePlaces();
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }
  /**
   * Fired when entering a page, after it becomes the active page.
   */
  ionViewDidEnter() {
   this.findAndPlayNextAudio();
  }
  /**
   * Fired when you leave a page, before it stops being the active one.
   * Use it for things you need to run every time you are leaving a page (deactivate event listeners, etc.).
   */
  ionViewWillLeave() {
    this.videogularApi.pause();
  }

  /**
   * Fired when you leave a page, after it stops being the active one.
   */
  ionViewDidLeave() {
    this.isViewLoaded = false;
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  async initLocalStorage() {
    this.routeValues = await this.storage.getRouteAllValues(this.params.route.id);
    this.mapStyle = await this.storage.mapStyle;
    this.radius = await this.storage.radius;
    this.playMode = await this.storage.playMode;
    this.unit = await this.storage.unit;
    this.lang = await this.storage.lang;
  }

  //-------Date Sliders---------
  async loadStories() {
    this.routeDatabaseStories = await Route.getStoriesRelation(this.params.route);
    this.sortedStories = await this.routeDatabaseStories.sort((a, b) => {
      if (a.startPeriod.getFullYear() == b.startPeriod.getFullYear()) {
        return a.name.slice(0, 2) - b.name.slice(0, 2)
      } else {
        return a.startPeriod.getFullYear() - b.startPeriod.getFullYear();
      }
    });
    this.yearSelectionSlider.periods = Array.from(new Set(this.sortedStories.map((story) => story.startPeriod.getFullYear())));
  }

  //-----Auto Play player-------
  onPlayerReady(api) {
    this.videogularApi = api;
    this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough.subscribe(
      () => {
        this.videogularApi.playbackRate = this.playBackValues[this.playBackRateIndex];
      }
    );
    this.videogularApi.getDefaultMedia().subscriptions.ended.subscribe(
      () => {
        this.findAndPlayNextAudio();
      }
    );
  }

  findAndPlayNextAudio() {
    this.currentAudio.title = "Finding next Audio to play ...";
    switch (this.playMode) {
      case "storyPoi": {
        const options: GeolocationOptions = {
          enableHighAccuracy: true,
          timeout: 10000
        };
        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;
        // paramsClone.location = {
        //   latitude: 47.0628917,
        //   longitude: 28.8678522
        // };
        this.geolocation.getCurrentPosition(options).then(pos => {
          paramsClone.location = pos.coords;
          this.playNextPoi(this.playMode, paramsClone);
        }, error => {
          this.playNextStory();
        });
        break;
      }
      case "poiOnly": {
        const options: GeolocationOptions = {
          enableHighAccuracy: true,
          timeout: 10000
        };
        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;
        // paramsClone.location = {
        //   latitude: 47.0628917,
        //   longitude: 28.8678522
        // };
        this.geolocation.getCurrentPosition(options).then(pos => {
          paramsClone.location = pos.coords;
          this.playNextPoi(this.playMode, paramsClone);
        });
        break;
      }
      case "storyOnly": {
        this.playNextStory();
        break;
      }
    }
  }

  playNextPoi(playMode, paramsClone) {
    paramsClone.selectedYear = this.routeValues.selectedYear;
    let nearestPlace = this.NearestPlace(this.routeDatabasePlaces, this.routeValues.listenedPOI, paramsClone)
    if (nearestPlace) {
      this.routeValues.listenedPOI.push(nearestPlace.id);
      this.storage.updateRouteValues(this.params.route.id, this.routeValues);
      this.goToPlace(nearestPlace);
    } else if (playMode == "storyPoi") {
      this.playNextStory();
    }
  }

  changePlayBackRate() {
    this.playBackRateIndex = this.playBackRateIndex == this.playBackValues.length - 1 ? 0 : ++this.playBackRateIndex;
    this.videogularApi.playbackRate = this.playBackValues[this.playBackRateIndex];
  }

  private getAudioFromStoriesByIndex(index) {
    let audio = { 'src': null, 'title': null, 'type': null, 'period': null, 'selectedPeriodYear': null };

    audio.src = this.getFileURL(this.sortedStories[index]['audio_' + this.lang].name());
    audio.title = this.sortedStories[index].name;
    audio.type = "Story";
    audio.period = this.sortedStories[index].startPeriod.getFullYear() + " - " + this.sortedStories[index].endPeriod.getFullYear();
    audio.selectedPeriodYear = this.sortedStories[index].startPeriod.getFullYear();
    // }
    return audio;
  }

  //------Add Player--------
  playNextStory() {
    this.listeningPOI = null;
    if (this.routeValues.listenedStoryIndex == this.sortedStories.length - 1) {
      alert("No more Stories...");
      return;
    }
    this.currentAudio = this.getAudioFromStoriesByIndex(++this.routeValues.listenedStoryIndex);
    // this.routeValues.listenedStoryIndex = this.routeValues.selectedYear != this.currentAudio.selectedPeriodYear ? 0 : this.routeValues.listenedStoryIndex;
    this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);
    this.slideTo(this.routeValues.selectedYear);
    this.reloadPlacesSortDate();
  }

  playPrevStory() {
    this.listeningPOI = null;
    if (this.routeValues.listenedStoryIndex == 0) {
      alert("First story...");
      return;
    }
    this.currentAudio = this.getAudioFromStoriesByIndex(--this.routeValues.listenedStoryIndex);
    this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);
    this.slideTo(this.routeValues.selectedYear);
    this.reloadPlacesSortDate();
  }

  enableMenuSwipe() {
    return true;
  }

  private initGoogleMap() {
    this.map = new GoogleMap('map', {
      styles: MapStyle.default(),
      building: false
    });
    this.map.setMapTypeId(this.mapStyle);

    this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      this.map.setMyLocationEnabled(true);
      console.log("Init Gmap");
      this.getCurrentPosition();
    });
    // TODO zakomentiroval Valentin
    //     this.map.on(GoogleMapsEvent.MY_LOCATION_BUTTON_CLICK).subscribe((map: GoogleMap) => {
    //       if (this.isViewLoaded) {
    //         let position: CameraPosition<ILatLng> = this.map.getCameraPosition();
    //         let target: ILatLng = position.target;
    //
    //         this.params.location = {
    //           latitude: target.lat,
    //           longitude: target.lng
    //         };
    //         this.showLoadingView();
    //         this.onReload();
    //       }
    //     });
    //
    //     this.map.setMyLocationEnabled(true);
  }

  animateMap(lat, lng) {
    this.map.animateCamera({
      target: { lat: lat, lng: lng },
      zoom: 17,
      tilt: 60,
      bearing: 140,
      duration: 5000,
      padding: 0  // default = 20px
    });
  }

  private getCurrentPosition() {
    this.params.unit = this.unit;
    const options: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 7000
    };

    this.geolocation.getCurrentPosition(options).then(pos => {
      // this.animateMap(pos.coords.latitude,pos.coords.longitude);
      this.params.location = pos.coords;
      this.loadRoutePlaces();
    }, error => {
      this.translate.get('ERROR_LOCATION_UNAVAILABLE').subscribe(str => this.showToast(str));
      this.showErrorView();
    });
    this.onMove();
  }

  onMove() {
    // Options: throw an error if no update is received every 30 seconds.
    this.geolocation.watchPosition({
      timeout: 10000,
      enableHighAccuracy: true
    }).filter((p) => p.coords !== undefined).subscribe(position => {
      if (this.playMode === "poiOnly" && this.videogularApi.state != 'playing') {
        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;
        paramsClone.location = position.coords;
        this.playNextPoi(this.playMode, paramsClone);
      }
    });
  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', { place: place, places: this.places, route: this.params.route, playBackValues: this.playBackValues, playBackRateIndex: this.playBackRateIndex });
    // console.log("PlaceGoToPlace(place): ", this.places);
  }


  //-------Date Sliders---------
  selectYear(selectedYearStory) {

    this.listeningPOI = null;
    this.routeValues.selectedYear = selectedYearStory;
    this.routeValues.listenedStoryIndex = Story.getStoryIndexByYear(this.sortedStories, selectedYearStory);
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);

    this.currentAudio = this.getAudioFromStoriesByIndex(this.routeValues.listenedStoryIndex);
    this.reloadPlacesSortDate();
  }

  // Method executed when the slides are changed
  slideChanged() {
    let currentIndex = this.slides.getActiveIndex();
    this.yearSelectionSlider.showLeftButton = currentIndex !== 0;
    this.yearSelectionSlider.showRightButton = currentIndex !== Math.ceil(this.slides.length() / 4);
  }

  // Method that shows the next slide
  slideTo(selectedYear) {
    this.slides.slideTo(this.yearSelectionSlider.periods.indexOf(selectedYear));
  }
  // Method that shows the next slide
  slideNext() {
    this.slides.slideNext();
  }

  // Method that shows the previous slide
  slidePrev() {
    this.slides.slidePrev();
  }

  loadRoutePlaces() {
    Route.getPlacesRelation(this.params.route).then(data => {
      this.routeDatabasePlaces = data;
      if (this.platform.is('cordova')) {
        this.addPlacesMarkers(data);
      }
      this.places = data;

      if (this.places.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

    }, error => {
      this.showErrorView();
    });
  }


  reloadPlacesSortDate() {
    var filteredPlace = this.routeValues.selectedYear ? this.routeDatabasePlaces.filter((place) => {
      return place.startPeriod.getFullYear() >= this.routeValues.selectedYear;
    }) : this.routeDatabasePlaces;

    if (this.platform.is('cordova')) {
      for (let marker of this.allMarkers) {
        marker.marker.remove();
      }
      this.addPlacesMarkers(filteredPlace);
    }

    this.places = filteredPlace;
    // console.log("reLoadPlacesSortDate: ", this.places);
    if (this.places.length) {
      this.showContentView();
    } else {
      this.showEmptyView();
    }
  }

  addPlacesMarkers(places) {

    let points: Array<LatLng> = [];

    for (let place of places) {
      let target: LatLng = new LatLng(
        place.location.latitude,
        place.location.longitude
      );
      //TODO check icon
      let icon = (this.params.route && this.params.route.get('icon')) ? {
        url: this.params.route.get('icon').url(),
        size: {
          width: 32,
          height: 32
        }
      } : 'yellow';

      let markerOptions = {
        position: target,
        title: place['title_' + this.lang],
        snippet: place['description_' + this.lang],
        icon: icon,
        place: place,
        styles: {
          maxWidth: '60%'
        },
      };

      this.map.addMarker(markerOptions).then((marker: Marker) => {
        this.allMarkers.push({ marker: marker });
        // console.log("this.allMarkers", this.allMarkers.length);
        marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {

          let marker = e[1];
          let place = marker.get("place");
          this.goToPlace(place);
        });
      });
      points.push(target);
    }

    if (points.length) {
      this.map.animateCamera({
        target: new LatLngBounds(points),
        zoom: 17,
        tilt: 60,
        bearing: 140,
        duration: 5000,
        padding: 0  // default = 20px
      });
    }
  }

  showCheckbox() {
    let alert = this.alertCtrl.create();
    alert.setTitle('Select Playback Mode');

    alert.addInput({
      type: 'radio',
      label: 'Story Only',
      value: 'storyOnly',
      checked: this.playMode.indexOf('storyOnly') !== -1
    });
    alert.addInput({
      type: 'radio',
      label: 'Story & POI',
      value: 'storyPoi',
      checked: this.playMode.indexOf('storyPoi') !== -1
    });
    alert.addInput({
      type: 'radio',
      label: 'POI Only',
      value: 'poiOnly',
      disabled: false,
      checked: this.playMode.indexOf('poiOnly') !== -1
    });
    alert.addButton('Cancel');
    alert.addButton({
      text: 'Ok',
      handler: data => {
        // console.log('Checkbox data:', data);
        this.storage.playMode = data;
        this.playMode = data;
        this.preference.playMode = data;
      }
    });
    alert.present();
  }
}
