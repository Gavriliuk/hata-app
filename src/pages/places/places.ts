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

import { Story } from '../../providers/parse-models/stories';

import { MapStyle } from '../../providers/map-style';
import {
  GoogleMapsEvent, GoogleMap,
  LatLng, Marker
} from '@ionic-native/google-maps';
import { ViewChild } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { VgStates } from 'videogular2/core';
import { Observable } from 'rxjs/Observable';
import { Utils } from '../../providers/utils';
import { PlayMode } from '../../providers/play-mode/play-mode';
import { AbstractPlayMode } from '../../providers/play-mode/abstract-play-mode';
// import { StoryOnlyPlayMode } from '../../providers/play-mode/story-only-play-mode';
// import { StoryPoiPlayMode } from '../../providers/play-mode/story-poi-play-mode';
// import { PoiOnlyPlayMode } from '../../providers/play-mode/poi-only-play-mode';

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
  routeDatabasePlaces: any = [];
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

  fakeLocations: any[] = [
    {
      coords: {
        latitude: 47.055382671941324,
        longitude: 28.865062589965873
      }
    },
    {
      coords: {
        latitude: 47.055528860953046,
        longitude: 28.864204283081108
      }
    },
    {
      coords: {
        latitude: 47.05573352489612,
        longitude: 28.863345976196342
      }
    },
    {
      coords: {
        latitude: 47.05605513807681,
        longitude: 28.86167227777105
      }
    },
    {
      coords: {
        latitude: 47.056376749317764,
        longitude: 28.860041494689995
      }
    },
    {
      coords: {
        latitude: 47.05652293560425,
        longitude: 28.8589256957398
      }
    }
  ];

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

    this.events.subscribe('playing', (e) => {
      this.playing = e;
      console.log("received playing: ", this.playing);
    });

    this.events.subscribe('periodChanged', (e) => {
      if (e > this.yearSelectionSlider.selectedYear) {
        if ((this.yearSelectionSlider.periods.indexOf(e) + 1) >= 3) {
          this.slideNext();
        }
      } else {
        this.slidePrev();
      }
      this.yearSelectionSlider.selectedYear = e;
      console.log("received periodChanged: ", e);
    });

    this.events.subscribe('playModeChanged', (e) => {
      console.log("received playModeChanged: ", e);
      this.storage.playMode = e;
      this.playMode = e;
      // this.preference.playMode = e;

      this.playingMode && this.playingMode.unsubscribePlayer();
      this.playingMode = PlayMode.getInstance(this.injector, e);
      this.playingMode.onPlayerReady(this.videogularApi);

      this.playingMode.play();
    });

    this.params.route = this.navParams.data;
    this.params.unit = this.preference.unit;
    this.places = [];
    this.allMarkers = [];
    this.yearSelectionSlider.periods = this.params.route.periods;
  }
  /**
   * Fired only when a view is stored in memory.
   * This event is NOT fired on entering a view that is already cached.
   * It’s a nice place for init related tasks.
   */
  async ionViewDidLoad() {
    this.loading = true;
    await this.initLocalStorage()
    // this.playingMode = PlayMode.getInstance(this.injector, this.playMode);
    // await new Promise(function (resolve, reject) {
    //   setTimeout(function () { resolve() }, 20000);
    // });
    // await this.loadAndSortStories();

    await this.loadRoutePlaces();
    this.loading = false;
    // this.events.publish('playing', true);

    // this.ionViewDidEnter();

    if (this.platform.is('cordova')) {
      this.initGoogleMap();
    } else {
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

  ionViewWillEnter() {
    this.events.publish('playing', false);
  }

  /**
   * Fired when entering a page, after it becomes the active page.
   */
  ionViewDidEnter() {
    if (!this.loading) {
      this.events.publish("playModeChanged", this.playMode);

      // this.playingMode.play();
      // this.events.publish("playModeChanged");
      // this.onMove();
      // this.onFakeMove();
      // this.findAndPlayNextAudio();
    }
  }
  /**
   * Fired when you leave a page, before it stops being the active one.
   * Use it for things you need to run every time you are leaving a page (deactivate event listeners, etc.).
   */
  ionViewWillLeave() {
    // this.events.publish('playing',false);
    this.videogularApi.pause();
    this.watchPositionSubscriber.unsubscribe();
  }

  /**
   * Fired when you leave a page, after it stops being the active one.
   */
  ionViewDidLeave() {
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
  // async loadAndSortStories() {
  //   this.routeDatabaseStories = await Route.getStoriesRelation(this.params.route);

  //   this.sortedStories = await this.routeDatabaseStories.sort((a, b) => {
  //     if (a.startPeriod.getFullYear() == b.startPeriod.getFullYear()) {
  //       return a.name.slice(0, 2) - b.name.slice(0, 2)
  //     } else {
  //       return a.startPeriod.getFullYear() - b.startPeriod.getFullYear();
  //     }
  //   });
  //   //TODO get periods from Route
  //   this.yearSelectionSlider.periods = Array.from(new Set(this.sortedStories.map((story) => story.startPeriod.getFullYear())));
  // }

  //-----Auto Play player-------
  onPlayerReady(api) {
    this.videogularApi = api;
    // this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough.subscribe(
    //   () => {
    //     this.videogularApi.playbackRate = this.playBackValues[this.playBackRateIndex];
    //   }
    // );
    // this.videogularApi.getDefaultMedia().subscriptions.playing.subscribe(
    //   () => {
    //     this.events.publish("playing", true);
    //     console.log("this.videogularApi.getDefaultMedia().subscriptions.playing: ", this.playing);

    //   }
    // );
    // this.videogularApi.getDefaultMedia().subscriptions.ended.subscribe(
    //   () => {
    //     this.events.publish("playing", false);
    //     console.log("this.videogularApi.getDefaultMedia().subscriptions.ended: ", this.playing);

    //     this.findAndPlayNextAudio();
    //   }
    // );
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
  }

  playNextPoi(playMode, paramsClone) {
    // paramsClone.selectedYear = this.routeValues.selectedYear;
    let nearestPlace = Place.NearestPlace(this.routeDatabasePlaces, this.routeValues.listenedPOI, paramsClone)
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

  // private getAudioFromStoriesByIndex(index) {
  //   let audio = { 'id': null, 'src': null, 'title': null, 'type': null, 'period': null, 'selectedPeriodYear': null };

  //   audio.id = this.sortedStories[index].id;
  //   audio.src = Utils.getFileURL(this.sortedStories[index]['audio_' + this.lang].name());
  //   audio.title = this.sortedStories[index].name;
  //   audio.type = "Story";
  //   audio.period = this.sortedStories[index].startPeriod.getFullYear() + " - " + this.sortedStories[index].endPeriod.getFullYear();
  //   audio.selectedPeriodYear = this.sortedStories[index].startPeriod.getFullYear();
  //   // }
  //   return audio;
  // }

  //------Add Player--------
  playNextStory() {
    this.playingMode.playNext();
    // this.listeningPOI = null;
    // if (this.routeValues.listenedStoryIndex == this.sortedStories.length - 1) {
    //   // alert("No more Stories...");
    //   return;
    // }

    // this.currentAudio = this.getAudioFromStoriesByIndex(++this.routeValues.listenedStoryIndex);

    // if (this.routeValues.selectedYear != this.currentAudio.selectedPeriodYear && (this.yearSelectionSlider.periods.indexOf(this.routeValues.selectedYear) + 1) >= 3) {
    //   this.slideNext();
    // }

    // this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    // this.storage.updateRouteValues(this.params.route.id, this.routeValues);
  }

  playPrevStory() {
    this.playingMode.playPrev();
    // this.listeningPOI = null;
    // if (this.routeValues.listenedStoryIndex == 0) {
    //   alert("First story...");
    //   return;
    // }
    // // this.slidePrev();
    // // this.currentAudio = this.getAudioFromStoriesByIndex(--this.routeValues.listenedStoryIndex);
    // this.routeValues.selectedYear = this.currentAudio.selectedPeriodYear;
    // this.storage.updateRouteValues(this.params.route.id, this.routeValues);
    // this.slideTo(this.routeValues.selectedYear);
    // this.slidePrev();
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
      this.findAndPlayNearestPoi(position);
    });
  }

  onFakeMove() {
    // Options: throw an error if no update is received every 5 seconds.
    // for (let i = 0; i < 50; i++) {
    //   (function (ind) {
    //     setTimeout(function () { console.log(ind); }, 500 * ind);
    //   })(i);
    // }
    let data = new Observable(observer => {
      for (let i = 0; i < this.fakeLocations.length; i++) {
        (function (locations, ind) {
          setTimeout(function () {
            observer.next(locations[ind]);
          }, ind * 2000);
        })(this.fakeLocations, i);
      }

      // setTimeout(() => {
      //     observer.next(42);
      // }, 5000);

      // setTimeout(() => {
      //     observer.next(43);
      // }, 5000);
      // setTimeout(() => {
      //     observer.next(44);
      // }, 5000);
      // setTimeout(() => {
      //     observer.next(45);
      // }, 5000);
      // setTimeout(() => {
      //     observer.next(46);
      // }, 5000);

      // setTimeout(() => {
      //   observer.complete();
      // }, 3000);
    });

    this.watchPositionSubscriber = data.subscribe(
      position => {
        console.log("position:", position);
        console.log("playing: ", this.playing);

        //this.watchPositionSubscriber.unsubscribe();
        if (!this.playing) {
          this.findAndPlayNearestPoi(position)

        }
      },
      error => console.log("error", error),
      () => console.log("finished")
    );
  }

  findAndPlayNearestPoi(position) {
    if (!this.playing) {
      let paramsClone = { ...this.params };
      paramsClone.distance = this.radius;
      paramsClone.location = position.coords;
      this.playNextPoi(this.playMode, paramsClone);
    }
  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', { routeValues: this.routeValues, place: place, places: this.places, route: this.params.route, playBackValues: this.playBackValues, playBackRateIndex: this.playBackRateIndex });
  }


  //-------Date Sliders---------
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
    this.routeDatabasePlaces = await Route.getPlacesRelation(this.params.route);
    this.places = this.routeDatabasePlaces;
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
        // console.log('Checkbox data:', data);
        this.events.publish("playModeChanged", data);

      }
    });
    alert.present();
  }
}
