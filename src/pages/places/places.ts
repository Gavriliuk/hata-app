import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { BasePage } from '../base-page/base-page';
import { Place } from '../../providers/parse-models/place-service';
import { Preference } from '../../providers/preference';
import { Route } from '../../providers/parse-models/routes';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { LocalStorage } from '../../providers/local-storage';
import { ChangeDetectorRef } from '@angular/core';
import { Platform, Events, Slides } from 'ionic-angular';
import { VgAPI } from 'videogular2/core';

import { MapStyle } from '../../providers/map-style';
import {
  GoogleMapsEvent, GoogleMap,
  LatLng, Marker
} from '@ionic-native/google-maps';
import { ViewChild } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { PlayMode } from '../../providers/play-mode/play-mode';
import { AbstractPlayMode } from '../../providers/play-mode/abstract-play-mode';

@IonicPage()
@Component({
  selector: 'page-places',
  templateUrl: 'places.html'
})
export class PlacesPage extends BasePage {
  injector: Injector;
  playingMode: AbstractPlayMode;


  watchPositionSubscriber: any;
  n: any = 0;
  loading: boolean;
  playing: boolean = true;
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

  videogularApi: VgAPI;
  playBackValues: any[] = [1, 1.5, 2, 3, 4];
  playBackRateIndex: any = 0;
  listeningPOI: Place;
  currentAudio: any = { 'src': null, 'title': null, 'type': null };
  nearAudio: any[];
  playMode: any;

  // listenedStoryIndex: any = 0;
  // routeDatabasePlaces: any = [];
  routeDatabaseStories: any = [];
  storiesRelation: any = [];
  // listenedPOI: any = [];

  yearSelectionSlider = {
    periods: [],
    selectedYear: "",
    maximumPeriodsOnScreen: 4,
    showLeftButton: true,
    showRightButton: true,
  };

  geolocationOptions: GeolocationOptions = {
    maximumAge: 30000,
    enableHighAccuracy: false
  };

  constructor(injector: Injector,
    private storage: LocalStorage,
    private geolocation: Geolocation,
    private preference: Preference,
    private events: Events,
    private platform: Platform,
    public alertCtrl: AlertController,
    private cdr: ChangeDetectorRef) {
    super(injector);
    this.storage = storage;
    this.injector = injector;
    this.params.route = this.navParams.data;
    this.params.unit = this.preference.unit;
    this.places = [];
    this.allMarkers = [];
    this.yearSelectionSlider.periods = this.params.route.periods;

    this.getEventsSubscription().forEach(event => {
      this.events.unsubscribe(event.event);
      this.events.subscribe(event.event, event.handler);
    });
  }

  getEventsSubscription(): any {
    return [
      {
        event: "onMenuOpened",
        handler: (e) => {
          console.log("Places recieved onMenuOpened:", e);
          if (this.map) {
            this.map.setClickable(false);
          }
        }
      },
      {
        event: "onMenuClosed",
        handler: (e) => {
          console.log("Places recieved onMenuClosed:", e);
          if (this.map) {
            this.map.setClickable(true);
          }
        }
      },
      {
        event: "playPoi",
        handler: (e) => {
          console.log("Places recieved playPoi:", e);
          this.goToPlace(e);
        }
      },
      {
        event: "periodChanged",
        handler: (e) => {
          console.log("Places recieved periodChanged:", e);
          if (e > this.yearSelectionSlider.selectedYear) {
            if ((this.yearSelectionSlider.periods.indexOf(e) + 1) >= 3) {
              this.slideNext();
            }
          } else {
            this.slidePrev();
          }
          this.yearSelectionSlider.selectedYear = e;
        }
      }
    ];
  }

  changePlayMode(playMode) {
    console.log(" playModeChanged: ", playMode);
    this.storage.playMode = playMode;
    this.playMode = playMode;

    this.playingMode && this.playingMode.unsubscribeEvents();
    this.playingMode = PlayMode.getInstance(this.injector, playMode);
    this.playingMode.loadParams(this.params);
    this.playingMode.onPlayerReady(this.videogularApi);
    this.playingMode.play();
  }
  /**
   * Fired only when a view is stored in memory.
   * This event is NOT fired on entering a view that is already cached.
   * It’s a nice place for init related tasks.
   */
  async ionViewDidLoad() {
    this.loading = true;
    await this.initLocalStorage()
    this.params.radius = this.radius;
    await this.loadRoutePlaces();
    this.loading = false;

    if (this.platform.is('cordova')) {
      this.initGoogleMap();
    } else {
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

  ionViewWillEnter() {
    // this.events.publish('playing', false);
  }

  /**
   * Fired when entering a page, after it becomes the active page.
   */
  ionViewDidEnter() {
    if (!this.loading) {
      this.changePlayMode(this.playMode);
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
    // debugger;
    // this.playingMode=null;
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


  //-----Auto Play player-------
  onPlayerReady(api) {
    this.videogularApi = api;
  }

  findAndPlayNextAudio() {

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
          this.playNextPoi(this.playMode, paramsClone);
        }, error => {
          //this.playNextStory();
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
        //this.playNextStory();
        break;
      }
    }
  }

  playNextPoi(playMode, paramsClone) {
    // paramsClone.selectedYear = this.routeValues.selectedYear;
    let nearestPlace = Place.NearestPlace(this.places, this.routeValues.listenedPOI, paramsClone)
    if (nearestPlace) {
      this.routeValues.listenedPOI.push(nearestPlace.id);
      this.storage.updateRouteValues(this.params.route.id, this.routeValues);
      this.goToPlace(nearestPlace);
    } else if (playMode == "storyPoi") {
      //this.playNextStory();
    }
  }

  changePlayBackRate() {
    this.playBackRateIndex = this.playBackRateIndex == this.playBackValues.length - 1 ? 0 : ++this.playBackRateIndex;
    this.videogularApi.playbackRate = this.playBackValues[this.playBackRateIndex];
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
    });
  }

  onMove() {
    // Options: throw an error if no update is received every 5 seconds.
    //TODO check if POI play mode
    this.watchPositionSubscriber = this.geolocation.watchPosition({
      timeout: 5000,
      enableHighAccuracy: false
    }).filter((p) => p.coords !== undefined).subscribe(position => {
      //this.findAndPlayNearestPoi(position);
    });
  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', { routeValues: this.routeValues, place: place, places: this.places, route: this.params.route, playBackValues: this.playBackValues, playBackRateIndex: this.playBackRateIndex });
  }

  playNextStory() {
    this.playingMode.playNext();
  }

  playPrevStory() {
    this.playingMode.playPrev();
  }

  selectYear(selectedYearStory) {
    this.events.publish("onYearChanged", selectedYearStory);
    this.yearSelectionSlider.selectedYear = selectedYearStory;
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
    this.places = await Route.getPlacesRelation(this.params.route);
    this.params.places = this.places;
  }


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
          marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {
            let mrk = e[1];
            let place = mrk.get("place");
            this.goToPlace(place);
          });
        });
        points.push(target);
      }


      if (points.length) {
        this.map.moveCamera({
          target: points,
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
        this.changePlayMode(data);
        // console.log('Checkbox data:', data);
        // this.events.publish("playModeChanged", data);

      }
    });
    alert.present();
  }
}
