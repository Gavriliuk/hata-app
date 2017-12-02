import {IonicPage} from 'ionic-angular';
import {Component, Injector} from '@angular/core';
import {ModalController, Events} from 'ionic-angular';
import {Place} from '../../providers/place-service';
import {Preference} from '../../providers/preference';
import {LocalStorage} from '../../providers/local-storage';
// import {CallNumber} from '@ionic-native/call-number';
import {Geolocation, GeolocationOptions} from '@ionic-native/geolocation';
import {InAppBrowser} from '@ionic-native/in-app-browser';
import {BrowserTab} from '@ionic-native/browser-tab';
import {LaunchNavigator} from '@ionic-native/launch-navigator';
import {BasePage} from '../base-page/base-page';
import {ChangeDetectorRef} from '@angular/core';

@IonicPage()
@Component({
  selector: 'page-place-detail-page',
  templateUrl: 'place-detail-page.html'
})
export class PlaceDetailPage extends BasePage {
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
  category: any;
  markers: any;
  waypoints:any;
  zoom:any;

  constructor(injector: Injector,
              private modalCtrl: ModalController,
              private storage: LocalStorage,
              private preference: Preference,
              private geolocation: Geolocation,
              private inAppBrowser: InAppBrowser,
              private browserTab: BrowserTab,
              private launchNavigator: LaunchNavigator,
              private events: Events,
              private cdr: ChangeDetectorRef) {
    super(injector);

    const options: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000
    };

    this.geolocation.getCurrentPosition(options).then(pos => {
      this.location = pos.coords;
    }, err => {
      console.log("Error Geolocation");
    });

    this.storage.lang.then((val) => {
      this.lang = val;
      this.place = this.navParams.data.place;

      if (this.lang == "ru") {
        this.audio = [this.navParams.data.place.audio_ru.url()];
      } else if (this.lang == "ro"){
        this.audio = [this.navParams.data.place.audio_ro.url()];
      }else{
        this.audio = [this.navParams.data.place.audio_en.url()];
      }
    });

    this.place = this.navParams.data.place;
    this.unit = preference.unit;
    this.images = [];
    this.places = this.navParams.data.places;
    this.category = this.places[0].category;
    let mapZoom: any;
    let coordinates = [];
    this.waypoints = "";
    this.zoom = 18;
    if (this.category.waypoints && this.category.waypoints !== "") {
       if(this.category.waypoints.indexOf('/') != -1){
         coordinates = this.category.waypoints.split('/');
         mapZoom = coordinates.length;
         if(mapZoom >= 3 ){
             this.zoom = 17;
         }
         coordinates.forEach(data => {
             this.waypoints += "%7C" + data;
         })
       }else{
          this.waypoints = "%7C"+this.category.waypoints;
       }
    }
    this.markers = "";
    this.places.forEach(place => {
       this.markers += "&markers=size:mid%7Ccolor:red%7C" + place.location.latitude + "," + place.location.longitude;
    });

    this.audio_ru = this.navParams.data.place.audio_ru.url();
    this.audio_ro = this.navParams.data.place.audio_ro.url();
    this.audio_en = this.navParams.data.place.audio_en.url();

    if (this.place.image) {
      this.images.push(this.place.image);
    }

    if (this.place.imageTwo) {
      this.images.push(this.place.imageTwo);
    }

    if (this.place.imageThree) {
      this.images.push(this.place.imageThree);
    }

    if (this.place.imageFour) {
      this.images.push(this.place.imageFour);
    }
  }

  enableMenuSwipe() {
    return false;
  }

  openSignUpModal() {
    this.navigateTo('SignInPage');
  }

  openAddReviewModal() {
    let modal = this.modalCtrl.create('AddReviewPage', {place: this.place});
    modal.present();
  }

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

  goToMap() {
    this.launchNavigator.navigate([this.place.location.latitude, this.place.location.longitude], {
      start: [this.location.latitude, this.location.longitude]
    });
  }

  goToReviews() {
    this.navigateTo('ReviewsPage', this.place);
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }
}
