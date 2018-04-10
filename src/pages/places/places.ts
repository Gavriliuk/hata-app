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

import { MapStyle } from '../../providers/map-style';
import {
  GoogleMapsEvent, GoogleMap,
  LatLng, Marker
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

  geolocationOptions: GeolocationOptions = {
    maximumAge: 30000,
    enableHighAccuracy: false
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
    this.isViewLoaded = true;
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
    await this.loadRoutePlaces();
    this.findAndPlayNextAudio();

    if (this.platform.is('cordova')) {
      this.initGoogleMap();
    } else {
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }
  /**
   * Fired when entering a page, after it becomes the active page.
   */
  ionViewDidEnter() {
    if (this.routeDatabaseStories.length > 0) {
    this.findAndPlayNextAudio();
  }
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
    // this.findAndPlayNextAudio();
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
    // if (this.routeValues.purchased || this.routeValues.listenedPOI.length <= 3 || this.routeValues.listenedStories.length <= 3) {
    this.currentAudio.title = "Finding next Audio to play ...";
    switch (this.playMode) {
      case "storyPoi": {
        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;

        // paramsClone.location = {
        //   latitude: 47.0628917,
        //   longitude: 28.8678522
        // };
        this.geolocation.getCurrentPosition(this.geolocationOptions).then(pos => {
          paramsClone.location = pos.coords;
          // alert("Location:" + paramsClone.location);
          this.playNextPoi(this.playMode, paramsClone);
        }, error => {
          this.playNextStory();
        });
        break;
      }
      case "poiOnly": {

        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;
        // paramsClone.location = {
        //   latitude: 47.0628917,
        //   longitude: 28.8678522
        // };
        this.geolocation.getCurrentPosition(this.geolocationOptions).then(pos => {
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
  //   } else {
  //     this.showPromoCodePrompt();
  // }
  }

  playNextPoi(playMode, paramsClone) {
    paramsClone.selectedYear = this.routeValues.selectedYear;
    let nearestPlace = this.NearestPlace(this.routeDatabasePlaces, this.routeValues.listenedPOI, paramsClone)
    // alert("nearestPlace"+JSON.stringify(nearestPlace));
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
    let audio = { 'id': null, 'src': null, 'title': null, 'type': null, 'period': null, 'selectedPeriodYear': null };

    audio.id = this.sortedStories[index].id;
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
    if (this.routeValues.selectedYear != this.currentAudio.selectedPeriodYear && (this.yearSelectionSlider.periods.indexOf(this.routeValues.selectedYear) + 1) >= 3) {
      this.slideNext();
    }

    this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);

    // this.filterPlacesBySelectedYear();
  }

  playPrevStory() {
    this.listeningPOI = null;
    if (this.routeValues.listenedStoryIndex == 0) {
      alert("First story...");
      return;
    }
    this.slidePrev();
    this.currentAudio = this.getAudioFromStoriesByIndex(--this.routeValues.listenedStoryIndex);
    this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);
    this.slideTo(this.routeValues.selectedYear);
    this.slidePrev();
    // this.filterPlacesBySelectedYear();
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
      // alert("Init Gmap");
      this.refreshMarkers();
      this.onMove();
    });
  }

  animateMap(bounds) {
    this.map.animateCamera({
      target: bounds,
      zoom: 17,
      tilt: 60,
      bearing: 140,
      duration: 5000,
      padding: 0  // default = 20px
    });
  }

  onMove() {
    // Options: throw an error if no update is received every 5 seconds.
    this.geolocation.watchPosition({
      timeout: 5000,
      enableHighAccuracy: false
    }).filter((p) => p.coords !== undefined).subscribe(position => {
      // alert("On Move Detected:"+ position.coords);
      if (this.playMode === "poiOnly" && this.videogularApi.state != 'playing') {
        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;
        paramsClone.location = position.coords;
        this.playNextPoi(this.playMode, paramsClone);
      }
    });
  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', { routeValues: this.routeValues, place: place, places: this.places, route: this.params.route, playBackValues: this.playBackValues, playBackRateIndex: this.playBackRateIndex });
  }


  //-------Date Sliders---------
  selectYear(selectedYearStory) {

    this.listeningPOI = null;
    this.routeValues.selectedYear = selectedYearStory;
    this.routeValues.listenedStoryIndex = Story.getStoryIndexByYear(this.sortedStories, selectedYearStory);
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);

    this.currentAudio = this.getAudioFromStoriesByIndex(this.routeValues.listenedStoryIndex);
    // this.filterPlacesBySelectedYear();
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

  async loadRoutePlaces() {
    // alert(this.routeValues.selectedYear);
    this.routeDatabasePlaces = await Route.getPlacesRelation(this.params.route);

    // var filteredPlace = this.routeValues.selectedYear ? this.routeDatabasePlaces.filter((place) => {
    //   return place.startPeriod.getFullYear() >= this.routeValues.selectedYear;
    // }) : this.routeDatabasePlaces;

    // this.places = filteredPlace;
    this.places = this.routeDatabasePlaces;
  }


  // filterPlacesBySelectedYear() {
  //   var filteredPlace = this.routeValues.selectedYear ? this.routeDatabasePlaces.filter((place) => {
  //     return place.startPeriod.getFullYear() >= this.routeValues.selectedYear;
  //   }) : this.routeDatabasePlaces;
  //   this.places = filteredPlace;
  //   this.refreshMarkers();
  // }

  refreshMarkers() {
    this.map && this.map.clear().then(() => {
      // alert("this.places"+this.places);
      let points: Array<LatLng> = [];

      for (let place of this.places) {
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
          // this.allMarkers.push(marker);
          // console.log("this.allMarkers", this.allMarkers.length);
          marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {

            let mrk = e[1];

            // mrk.remove();
            let place = mrk.get("place");
            this.goToPlace(place);
          });
        });
        points.push(target);
      }


      if (points.length) {
        this.map.moveCamera({
          // this.map.animateCamera({
          target: points,
          // zoom: 17,
          // tilt: 60,
          // bearing: 3,
          duration: 5000,
          padding: 40  // default = 20px
        });
      }
    });

  }
  showPromoCodePrompt() {
    let prompt = this.alertCtrl.create({
      title: 'Enter Your Promocode for continue listening.',
      message: "Your reached the maximum allowed tracks per route. Please enter your Promocode to continue.",
      inputs: [
        {
          name: 'code',
          placeholder: 'Promocode'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Apply',
          handler: data => {
            console.log('Apply clicked', data);
          }
        }
      ]
    });
    prompt.present();
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
