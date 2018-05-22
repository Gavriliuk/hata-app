import { IonicPage, ActionSheetController, Platform } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { ViewController } from 'ionic-angular';
// import { Review } from '../../providers/review-service';
import { BasePage } from '../base-page/base-page';
import { LocalStorage } from '../../providers/local-storage';
import { PaymentUtils } from '../../providers/payment-utils';
import { InAppPurchase2 } from '@ionic-native/in-app-purchase-2';
// import { AlertController } from 'ionic-angular';


@IonicPage()
@Component({
  selector: 'page-add-review-page',
  templateUrl: 'add-review-page.html'
})
export class AddReviewPage extends BasePage {
  paymentUtils: PaymentUtils;

  routeModal: any = [];
  review: any = {};
  markers: any;
  waypoints: any;
  mapZoom: any;
  lang: any;
  // route: any;
  placeMarkers: any;
  routePlaces: any = [];
  routeValues: any = {
    listenedPOI: [],
    listenedStories: [],
    listenedStoryIndex: 0,
    selectedYear: "",
    playMode: null,
    purchased: false,
    promocode: "",
  };
  product: any = {
    name: 'Адреса и имена старого Кишинева',
    appleProductId: 'com.innapp.dromos.BKKExJtVzH',
    googleProductId: 'com.innapp.dromos.bkkexjtvzh'
  };

  constructor(injector: Injector,
    private viewCtrl: ViewController,
    private storage: LocalStorage, private actionSheetCtrl: ActionSheetController, private store: InAppPurchase2,
    public platform: Platform) {
    super(injector);
    // this.alertCtrl = injector.get(AlertController);

    this.paymentUtils = new PaymentUtils(injector);
    this.lang = this.navParams.data.lang;
    this.routeModal = this.navParams.data.route;
    this.routePlaces = this.navParams.data.places;
    this.addWaypointsAndMarkers();
    // this.paymentUtils.configurePurchasing(this.store, this.platform, this.product);
  }
  ionViewDidEnter() {
    // this.paymentUtils.configurePurchasing(this.store, this.platform, this.product);
  }

  private addWaypointsAndMarkers() {
    let zoom: any;
    let coordinates = [];
    this.waypoints = "";
    this.mapZoom = 17;
    if (this.routeModal.waypoints && this.routeModal.waypoints !== "") {
      if (this.routeModal.waypoints.indexOf('/') != -1) {
        coordinates = this.routeModal.waypoints.split('/');
        zoom = coordinates.length;
        if (zoom >= 10) {
          this.mapZoom = 15;
        }
        else if (zoom >= 15) {
          this.mapZoom = 14;
        }
        coordinates.forEach(data => {
          this.waypoints += "%7C" + data;
        });
      }
      else {
        this.waypoints = "%7C" + this.routeModal.waypoints;
      }
    }
    this.markers = "";
    this.placeMarkers = {};
    this.routePlaces.forEach(place => {
      if (place) {
        this.markers += "&markers=size:mid%7Ccolor:0xff0000%7C" + place.location.latitude + "," + place.location.longitude;
      }
    });
  }

  activatePromocode() {
    this.paymentUtils.activatePromocode(this.routeValues.promocode, this.routeModal.id, () => {
      this.routeValues.purchased = true;
      this.storage.updateRouteValues(this.routeModal.id, this.routeValues);
    }, () => {
      let alert = this.alertCtrl.create({
        title: this.translate.instant('promocode_invalid'),
        subTitle: this.translate.instant('promocode_check_error'),
        buttons: ['OK']
      });
      alert.present();
    });
  }

  enableMenuSwipe() {
    return false;
  }

  async ionViewDidLoad() {
    this.routeValues = await this.storage.getRouteAllValues(this.routeModal.id);

  }

  onDismiss() {
    this.viewCtrl.dismiss();
  }
  purchaseByPromocode() {
    this.paymentUtils.showPromoCodePrompt(this.routeModal.id, () => {
      this.routeValues.purchased = true;
      this.storage.updateRouteValues(this.routeModal.id, this.routeValues).then(() => {
      });
    }, () => {
    }, this.translate.instant('activate_promocode_title'), this.translate.instant('activate_promocode_description'));
  }

  presentActionSheet() {
    let actionSheet = this.actionSheetCtrl.create({
      title: this.translate.instant('ROUTE_ACTIVATE'),
      buttons: [
        {
          text: 'Using Promocode',
          handler: () => {
            this.purchaseByPromocode();
          }
        },
        {
          text: 'In-app Purchase',
          handler: () => {
            this.paymentUtils.purchase(this.store, this.platform, this.product);
            // console.log('In-app Purchase');
          }
        },
        {
          text: 'Using Qiwi Code',
          handler: () => {
            console.log('Using Qiwi Code');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }
}

