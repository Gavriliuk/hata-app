import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { BasePage } from '../base-page/base-page';
import { Preference } from '../../providers/preference';
import { Route } from '../../providers/parse-models/routes';
import { Geolocation } from '@ionic-native/geolocation';
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
import { PaymentUtils } from '../../providers/payment-utils';


@IonicPage()
@Component({
  selector: 'page-places',
  templateUrl: 'places.html'
})
export class PlacesPage extends BasePage {
  paymentUtils: PaymentUtils;
  injector: Injector;
  playingMode: AbstractPlayMode;
  loading: boolean;
  @ViewChild(Slides) slides: Slides;

  params: any = {};
  places: any = [];
  allMarkers: any[];
  routeValues: any = {};

  lang: any;
  map: GoogleMap;
  mapStyle: any;
  unit: any;

  videogularApi: VgAPI;
  playBackRateValues: any[];
  playBackRateIndex: any;
  playMode: any;

  yearSelectionSlider = {
    periods: [],
    selectedYear: "",
    maximumPeriodsOnScreen: 4,
    showLeftButton: true,
    showRightButton: true,
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
    this.playMode = this.params.route.defaultPlayMode;
    this.allMarkers = [];
    this.yearSelectionSlider.periods = this.params.route.periods;
    this.paymentUtils = new PaymentUtils(injector);

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
      },
      {
        event: "onChangePlayBackRate",
        handler: (e) => {
          this.playBackRateIndex = e;
          this.videogularApi.playbackRate = this.playBackRateValues[this.playBackRateIndex];
        }
      }
    ];
  }

  async changePlayMode(playMode) {
    console.log(" playModeChanged: ", playMode);
    this.routeValues = await this.storage.getRouteAllValues(this.params.route.id);
    this.routeValues.playMode = playMode;
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);
    this.playMode = playMode;

    this.playingMode && this.playingMode.unsubscribeEvents();
    this.playingMode = PlayMode.getInstance(this.injector, playMode);
    await this.playingMode.init(this.params);
    await this.playingMode.start();
    this.playingMode.onPlayerReady(this.videogularApi);
  }
  /**
   * Fired only when a view is stored in memory.
   * This event is NOT fired on entering a view that is already cached.
   * It’s a nice place for init related tasks.
   */
  async ionViewDidLoad() {
    //document.getElementsByTagName('html')[0].className += 'ion-tab-fix';

    this.loading = true;
    await this.initLocalStorage()
    await this.loadRoutePlaces();
    this.loading = false;

    if (this.platform.is('cordova')) {
      this.initGoogleMap();
    } else {
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

  ionViewWillEnter() {
    document.getElementsByTagName('html')[0].className = 'ion-tab-fix';
  }

  /**
   * Fired when entering a page, after it becomes the active page.
   */
  ionViewDidEnter() {
    document.getElementsByTagName('html')[0].className = 'ion-tab-fix';
    if (!this.loading) {
      this.initLocalStorage().then(() => {
        this.changePlayMode(this.playMode);
      });
    }
  }
  /**
   * Fired when you leave a page, before it stops being the active one.
   * Use it for things you need to run every time you are leaving a page (deactivate event listeners, etc.).
   */
  ionViewWillLeave() {
    document.getElementsByTagName('html')[0].className = '';
    this.videogularApi && this.videogularApi.pause();
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
    let savedPlayMode = this.routeValues.playMode;
    this.playMode = savedPlayMode ? savedPlayMode : this.params.route.defaultPlayMode;
    this.unit = await this.storage.unit;
    this.lang = await this.storage.lang;
    this.playBackRateIndex = await this.storage.playBackRateIndex;
    this.playBackRateValues = await this.storage.playBackRateValues;
  }


  //-----Auto Play player-------
  onPlayerReady(api) {
    this.videogularApi = api;
  }

  changePlayBackRate() {
    this.playBackRateIndex = this.playBackRateIndex == this.playBackRateValues.length - 1 ? 0 : ++this.playBackRateIndex;
    this.videogularApi.playbackRate = this.playBackRateValues[this.playBackRateIndex];
    this.storage.playBackRateIndex = this.playBackRateIndex;
    this.playingMode.changePlaybackRate(this.playBackRateIndex);
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
      this.refreshMarkers();
    });
  }

  goToPlace(place) {
    this.events.publish("onPlayerStateChanged", "playing", place);
    if (this.routeValues.playMode == 'storyPoi') {
      this.playingMode.currentAudio.src = "assets/audio/btw/"+(Math.floor(Math.random() * 5)+1)+".mp3";
      const vgSubs = this.videogularApi.getDefaultMedia().subscriptions.ended.subscribe(
        () => {
          this.navigateTo('PlaceDetailPage', { routeValues: this.routeValues, place: place, places: this.places, route: this.params.route, playBackValues: this.playBackRateValues, playBackRateIndex: this.playBackRateIndex }).then(() => {
            vgSubs.unsubscribe();
          });
        });
    } else {
      this.navigateTo('PlaceDetailPage', { routeValues: this.routeValues, place: place, places: this.places, route: this.params.route, playBackValues: this.playBackRateValues, playBackRateIndex: this.playBackRateIndex });
    }
  }

  playNextStory() {
    this.playingMode.playNext();
  }

  playPrevStory() {
    this.playingMode.playPrev();
  }

  selectYear(selectedYearStory) {
    this.yearSelectionSlider.selectedYear = selectedYearStory;
    this.playingMode.changePeriod(selectedYearStory);
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
    this.slides && this.slides.slideNext();
  }

  // Method that shows the previous slide
  slidePrev() {
    this.slides && this.slides.slidePrev();
  }

  async loadRoutePlaces() {
    this.places = await Route.getPlacesRelation(this.params.route);
    this.params.places = this.places;
  }


  refreshMarkers() {
    this.map && this.map.clear().then(() => {
      let points: Array<LatLng> = [];

      for (let place of this.places) {
        let target: LatLng = new LatLng(
          place.location.latitude,
          place.location.longitude
        );
        let iconUrl = (place.category && place.category.get('icon')) ? place.category.get('icon').url() : this.params.route.get('icon').url();
        let icon = {
          url: iconUrl,
          size: {
            width: 32,
            height: 32
          }
        };

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

  showCheckbox() {
    let alert = this.alertCtrl.create();
    alert.setTitle(this.translate.instant('select_playback_mode'));
    this.params.route.playModes.forEach((mode) => {
      alert.addInput({
        type: 'radio',
        label: this.translate.instant(mode),
        value: mode,
        checked: this.playMode == mode
      });
    })

    alert.addButton(this.translate.instant('CANCEL'));
    alert.addButton({
      text: this.translate.instant('OK'),
      handler: data => {
        this.changePlayMode(data);
      }
    });
    alert.present();
  }

  activatePromocode() {
    this.paymentUtils.activatePromocode(this.routeValues.promocode, this.params.route.id, () => {
      this.routeValues.purchased = true;
      this.storage.updateRouteValues(this.params.route.id, this.routeValues).then(() => {
        this.playingMode.init(this.params).then(() => {
          this.playingMode.start();
        });
      });
    }, () => {
      let alert = this.alertCtrl.create({
        title: this.translate.instant('promocode_invalid'),
        subTitle: this.translate.instant('promocode_check_error'),
        buttons: ['OK']
      });
      alert.present();
    });
  }
}
