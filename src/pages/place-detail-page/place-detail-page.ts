import {IonicPage} from 'ionic-angular';
import {Component, Injector} from '@angular/core';
import {ModalController, Events} from 'ionic-angular';
import {Place} from '../../providers/place-service';
import {Preference} from '../../providers/preference';
import {LocalStorage} from '../../providers/local-storage';
import {Geolocation, GeolocationOptions} from '@ionic-native/geolocation';
import {InAppBrowser} from '@ionic-native/in-app-browser';
import {BrowserTab} from '@ionic-native/browser-tab';
import {LaunchNavigator} from '@ionic-native/launch-navigator';
import {BasePage} from '../base-page/base-page';
import {ChangeDetectorRef} from '@angular/core';
import Parse from 'parse';
import { NavController } from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-place-detail-page',
  templateUrl: 'place-detail-page.html'
})
export class PlaceDetailPage extends BasePage {
  params: any={};
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
  waypoints:any;
  zoom:any;
  imageURL: any=[];
  api: any;
  playBackValues: any[];
  playBackRateIndex: any;
  icon:any;

  constructor(injector: Injector,
              private modalCtrl: ModalController,
              private storage: LocalStorage,
              private preference: Preference,
              private geolocation: Geolocation,
              private inAppBrowser: InAppBrowser,
              private browserTab: BrowserTab,
              private launchNavigator: LaunchNavigator,
              private events: Events,
              private navPageBack:NavController,
              private cdr: ChangeDetectorRef) {
    super(injector);
    this.storage = storage;
    this.initLocalStorage();

    this.place = this.navParams.data.place;
    this.playBackValues = this.navParams.data.playBackValues;
    this.playBackRateIndex = this.navParams.data.playBackRateIndex;
    this.unit = preference.unit;

//TODO add image fileURL (podstaviti formulu urlServera i name img kak s videom)
    let imagesArray = this.place.original_images;
    imagesArray.forEach(data => {
      let fileName = data.name();
      console.log("fileName :",fileName);
      this.imageURL.push([this.getFileURL(fileName)]);

    });
    console.log("imageName :",this.imageURL);
    this.places = this.navParams.data.places;
    this.route = this.navParams.data.route;
    let mapZoom: any;
    let coordinates = [];
    this.waypoints = "";
    this.zoom = 18;
    if (this.route.waypoints && this.route.waypoints !== "") {
      if(this.route.waypoints.indexOf('/') != -1){
        coordinates = this.route.waypoints.split('/');
        mapZoom = coordinates.length;
        if(mapZoom >= 25){
          this.zoom = 16;
        }
        coordinates.forEach(data => {
          this.waypoints += "%7C" + data;
        })
      }else{
        this.waypoints = "%7C"+this.route.waypoints;
      }
    }
    this.markers = "";
    this.icon = this.route.icon.url();
    this.places.forEach(place => {
      this.markers += "&markers=icon:"+this.icon+"%7C" + place.location.latitude + "," + place.location.longitude;
    });
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
loadPlace(){
  this.place = this.navParams.data.place;
       let audioPOIURL = this.navParams.data.place["audio_"+this.lang].name();
       this.audio = [this.getFileURL(audioPOIURL)];
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
        this.navPageBack.pop();
      }
    );
  }
  changePlayBackRate() {
    this.playBackRateIndex = this.playBackRateIndex == this.playBackValues.length - 1 ? 0 : ++this.playBackRateIndex;
    this.api.playbackRate = this.playBackValues[this.playBackRateIndex];
  }

  enableMenuSwipe() {
    return false;
  }

  openSignUpModal() {
    this.navigateTo('SignInPage');
  }

  // openAddReviewModal() {
  //   let modal = this.modalCtrl.create('AddReviewPage', {place: this.place});
  //   modal.present();
  // }

  // onLike() {
  //
  //   if (User.getCurrentUser()) {
  //     Place.like(this.place);
  //     this.showToast('Liked');
  //   } else {
  //     this.openSignUpModal();
  //   }
  // }

  // onRate() {
  //   if (User.getCurrentUser()) {
  //     this.openAddReviewModal();
  //   } else {
  //     this.openSignUpModal();
  //   }
  // }

  // onShare() {
  //   this.socialSharing.share(this.lang == "ru"?this.place.title_ru:this.place.title_en, null, null, this.place.website);
  // }

  // onCall() {
  //   // this.callNumber.callNumber(this.place.phone, true)
  // }

  // openUrl() {
  //
  //   this.browserTab.isAvailable().then((isAvailable: boolean) => {
  //
  //     if (isAvailable) {
  //       this.browserTab.openUrl(this.place.website);
  //     } else {
  //       this.inAppBrowser.create(this.place.website, '_system');
  //     }
  //
  //   });
  //
  // }

  // openUrl() {
  //
  //   this.browserTab.isAvailable().then((isAvailable: boolean) => {
  //
  //     if (isAvailable) {
  //       this.browserTab.openUrl(this.place.website);
  //     } else {
  //       this.inAppBrowser.create(this.place.website, '_system');
  //     }
  //
  //   });
  //
  // }

  // goToMap() {
  //   this.launchNavigator.navigate([this.place.location.latitude, this.place.location.longitude], {
  //     start: [this.location.latitude, this.location.longitude]
  //   });
  // }

  goToReviews() {
    this.navigateTo('ReviewsPage', this.place);
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }
}
