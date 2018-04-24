import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { ModalController, Events } from 'ionic-angular';
import { Place } from '../../providers/parse-models/place-service';
import { Preference } from '../../providers/preference';
import { LocalStorage } from '../../providers/local-storage';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { BrowserTab } from '@ionic-native/browser-tab';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { BasePage } from '../base-page/base-page';
import { ChangeDetectorRef } from '@angular/core';
import Parse from 'parse';
import { NavController } from 'ionic-angular';
import { PaymentUtils } from '../../providers/payment-utils';
import { RoutesPage } from '../routes/routes';
import { TabsPage } from '../tabs/tabs';
@IonicPage()
@Component({
  selector: 'page-place-detail-page',
  templateUrl: 'place-detail-page.html'
})
export class PlaceDetailPage extends BasePage {

  paymentUtils: PaymentUtils;
  routeValues: any;
  params: any = {};
  places: Place[];
  images: Array<any>;
  audio: any[];
  place: Place;
  location: any;
  unit: any;
  lang: any;
  audio_ru: any;
  audio_ro: any;
  audio_en: any;
  route: any;
  markers: any;
  waypoints: any;
  zoom: any;
  imageURL: any = [];
  api: any;
  playBackValues: any[];
  playBackRateIndex: any;
  icon: any;

  constructor(injector: Injector,
    private modalCtrl: ModalController,
    private storage: LocalStorage,
    private preference: Preference,
    private geolocation: Geolocation,
    private inAppBrowser: InAppBrowser,
    private browserTab: BrowserTab,
    private launchNavigator: LaunchNavigator,
    private events: Events,
    private navPageBack: NavController,
    private cdr: ChangeDetectorRef) {
    super(injector);
    this.events = events;
    this.events.publish("onPlayerStateChanged", "playing", this.navParams.data.place);
    this.storage = storage;
    this.initLocalStorage();
    this.paymentUtils = new PaymentUtils(injector);
    this.routeValues = this.navParams.data.routeValues;
    this.place = this.navParams.data.place;
    this.playBackValues = this.navParams.data.playBackValues;
    this.playBackRateIndex = this.navParams.data.playBackRateIndex;
    this.unit = preference.unit;

    //TODO add image fileURL (podstaviti formulu urlServera i name img kak s videom)
    let imagesArray = this.place.original_images;
    imagesArray.forEach(data => {
      let fileName = data.name();
      this.imageURL.push([this.getFileURL(fileName)]);

    });
    this.places = this.navParams.data.places;
    this.route = this.navParams.data.route;
    let mapZoom: any;
    let coordinates = [];
    this.waypoints = "";
    this.zoom = 18;
    if (this.route.waypoints && this.route.waypoints !== "") {
      if (this.route.waypoints.indexOf('/') != -1) {
        coordinates = this.route.waypoints.split('/');
        mapZoom = coordinates.length;
        if (mapZoom >= 25) {
          this.zoom = 16;
        }
        coordinates.forEach(data => {
          this.waypoints += "%7C" + data;
        })
      } else {
        this.waypoints = "%7C" + this.route.waypoints;
      }
    }
    this.markers = "";
    this.places.forEach(place => {
      let placeIcon = (place.category && place.category.icon) ? place.category.icon.url() : this.route.icon.url();
      this.markers += "&markers=icon:" + placeIcon + "%7C" + place.location.latitude + "," + place.location.longitude;
    });
  }

  ionViewDidEnter() {
    document.getElementsByTagName('html')[0].className = 'ion-tab-fix';
  }
  ionViewWillEnter() {
    document.getElementsByTagName('html')[0].className = 'ion-tab-fix';
  }

  initLocalStorage() {
    Promise.all([
      this.storage.lang
    ]).then(([
      lang
    ]) => {
      this.lang = lang;
      this.loadPlace();
    });
  }

  async loadPlace() {
    // let listenedPoisCount = await this.storage.listenedPois || 0;
    if (!this.routeValues.purchased && this.routeValues.listenedPOI.length > 1) {
      this.paymentUtils.showPromoCodePrompt(this.route.id, () => {
        this.routeValues.purchased = true;
        this.storage.updateRouteValues(this.route.id, this.routeValues).then(() => {
          this.pushPlaceAudio();
        });
      }, () => {
        this.storage.updateRouteValues(this.route.id, this.routeValues).then(() => {
          this.goRoutes();
        });

      });
    } else {
      this.pushPlaceAudio();
    }
  }

  private pushPlaceAudio() {
    this.place = this.navParams.data.place;
    this.routeValues.listenedPOI.push(this.place.id);
    this.storage.updateRouteValues(this.route.id, this.routeValues).then(() => {
      let audioPOIURL = this.navParams.data.place["audio_" + this.lang].name();
      this.audio = [this.getFileURL(audioPOIURL)];
    });
  }

  //-----Auto Play player-------
  onPlayerReadyDetail(api) {
    this.api = api;
    this.api.getDefaultMedia().subscriptions.canPlayThrough.subscribe(() => {
      this.api.playbackRate = this.playBackValues[this.playBackRateIndex];
    }
    );
    this.api.getDefaultMedia().subscriptions.ended.subscribe(
      () => {
        // this.storage.incrementListenedPois().then(() => {
        this.goBack();
        // });
      }
    );
  }

  goBack() {
    this.navPageBack.pop().then(() => {
      this.events.publish("onPlayerStateChanged", "ended", this.place);
    });
  }

  goRoutes() {
    this.navPageBack.setRoot(TabsPage);
  }

  changePlayBackRate() {
    this.playBackRateIndex = this.playBackRateIndex == this.playBackValues.length - 1 ? 0 : ++this.playBackRateIndex;
    this.api.playbackRate = this.playBackValues[this.playBackRateIndex];
    this.storage.playBackRateIndex = this.playBackRateIndex;
  }

  enableMenuSwipe() {
    return false;
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }
}
