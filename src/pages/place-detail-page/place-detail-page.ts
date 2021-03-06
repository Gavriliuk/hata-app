import { IonicPage, Loading } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { ModalController, Events } from 'ionic-angular';
import { Place } from '../../providers/parse-models/place-service';
import { Preference } from '../../providers/preference';
import { LocalStorage } from '../../providers/local-storage';
import { Geolocation } from '@ionic-native/geolocation';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { BrowserTab } from '@ionic-native/browser-tab';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { BasePage } from '../base-page/base-page';
import { ChangeDetectorRef } from '@angular/core';
// import Parse from 'parse';
import { NavController } from 'ionic-angular';
import { PaymentUtils } from '../../providers/payment-utils';
// import { RoutesPage } from '../routes/routes';
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
  loadingPopup: Loading;


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
    // this.events.publish("onPlayerStateChanged", "playing", this.navParams.data.place);
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

    this.getEventsSubscription().forEach(event => {
      this.events.unsubscribe(event.event);
      this.events.subscribe(event.event, event.handler);
    });

    // this.events.publish("load", true, this.translate.instant('LOADING_POI'));
  }

  getEventsSubscription(): any {
    return [
      //   {
      //     event: "load-details",
      //     handler: (e) => {
      //       console.log("PlaceDetails recieved load:", e);
      //       if (e) {
      //         this.loadingPopup = this.loadingCtrl.create({
      //           content: this.translate.instant('LOADING')
      //         });
      //         this.loadingPopup.present();
      //       } else {
      //         this.loadingPopup && this.loadingPopup.dismiss();
      //         this.loadingPopup=null;
      //       }
      //     }
      //   }
    ];
  }

  ionViewDidEnter() {
    document.getElementsByTagName('html')[0].className = 'ion-tab-fix';
  }
  ionViewWillEnter() {
    document.getElementsByTagName('html')[0].className = 'ion-tab-fix';
  }

  async initLocalStorage() {
    this.lang = await this.storage.lang;
    this.loadPlace();
  }

  async loadPlace() {
    // let listenedPoisCount = await this.storage.listenedPois || 0;
    if (!this.routeValues.purchased && this.routeValues.listenedPOI.length > 1) {
      this.paymentUtils.buy(this.route.id).then((data) => {
        if(data){
          this.pushPlaceAudio();
          this.api.play();
          this.routeValues.purchased = true;
        }
      }).catch((error) => {
        this.routeValues.listenedStoryIndex = 1;
        this.storage.updateRouteValues(this.route.id, this.routeValues).then(() => {
          // this.events.publish("load", false);
          this.goRoutes();
        }).catch(error => console.log(error) );
      });
    } else {
      this.pushPlaceAudio();
    }
  }

async pushPlaceAudio() {
    let place = this.navParams.data.place;
    this.routeValues.listenedPOI.push(place.id);
    if(place["audio_" + this.lang] && place["audio_" + this.lang].name()){
      let audioURL = place["audio_" + this.lang].name();
      this.audio = await [this.getFileURL(audioURL)];
      await this.storage.updateRouteValues(this.route.id, this.routeValues);
    }else{
      alert(this.translate.instant('NOT_AUDIO'));
    }
  }

  //-----Auto Play player-------
  onPlayerReadyDetail(api) {
    this.api = api;
    this.api.getDefaultMedia().subscriptions.canPlayThrough.subscribe(() => {
      // this.events.publish("load", false);
      this.api.playbackRate = this.playBackValues[this.playBackRateIndex];
    }
    );
    this.api.getDefaultMedia().subscriptions.ended.subscribe(
      () => {
        this.goBack();
      }
    );
  }

  goBack() {
    // if (this.routeValues.playMode == 'storyPoi') {
    //   this.audio = ["assets/audio/back-to-story/" + (Math.floor(Math.random() * 4) + 1) + ".mp3"];
    //   this.api.getDefaultMedia().subscriptions.ended.subscribe(
    //     () => {
    //       this.navPageBack.pop().then(() => {
    //         this.events.publish("onPlayerStateChanged", "ended", this.place);
    //       });
    //     }
    //   );
    // } else {

    this.navPageBack.pop().then(() => {
      this.events.publish("onPlayerStateChanged", "ended", this.place);
    }).catch((error) => {
      console.log(error);
    });
    // }
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
