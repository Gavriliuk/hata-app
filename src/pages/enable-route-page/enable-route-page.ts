import { IonicPage, ActionSheetController, Platform, ModalController } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { ViewController, Events, NavController } from 'ionic-angular';
import { BasePage } from '../base-page/base-page';
import { LocalStorage } from '../../providers/local-storage';
import { PaymentUtils } from '../../providers/payment-utils';

@IonicPage()
@Component({
  selector: 'page-enable-route-page',
  templateUrl: 'enable-route-page.html'
})

export class EnableRoutePage extends BasePage {

  paymentUtils: PaymentUtils;

  routeModal: any = [];
  bundles: any = [];
  bundle: any = {};
  // review: any = {};
  markers: any;
  waypoints: any;
  mapZoom: any;
  lang: any;
  routesAll: any = [];
  placeMarkers: any;
  routePlaces: any = [];
  routeValues: any = {
    listenedPOI: [],
    listenedStories: [],
    listenedStoryIndex: 0,
    selectedYear: "",
    playMode: null,
    purchased: false
  };

  bundleValues: any = {
    purchased: false
  };

  constructor(injector: Injector,
    private viewCtrl: ViewController,
    private storage: LocalStorage,
    private actionSheetCtrl: ActionSheetController,
    public platform: Platform,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public events: Events) {
    super(injector);
    // this.alertCtrl = injector.get(AlertController);

    this.paymentUtils = new PaymentUtils(injector);
    this.lang = this.navParams.data.lang;
    this.routeModal = this.navParams.data.route;
    this.routesAll = this.navParams.data.routesAll;
    this.bundles = this.navParams.data.bundles;
    this.routeModal.productData = {};
    this.routePlaces = this.navParams.data.places;
    this.addWaypointsAndMarkers();

    this.events.subscribe('restoredPurchases', (purchasedItems) => {
      this.bundles.forEach((bundle) => {
        if (purchasedItems.includes(bundle.id.toLocaleLowerCase())) {
          bundle["purchased"] = true;
        }
      });
    });

    this.events.subscribe('purchased', (purchasedItem) => {
      this.bundles.forEach((bundle) => {
        if (purchasedItem.includes(bundle.id.toLocaleLowerCase())) {
          bundle["purchased"] = true;
        }
      });
    });
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

  enableMenuSwipe() {
    return false;
  }

  ionViewDidLoad() {
    this.getProductsPrice();
  }

  ionViewWillEnter() {
    this.loadDataBundles();
  }

  async loadDataBundles() {
    this.lang = await this.storage.lang;
    this.routeValues = await this.storage.getRouteAllValues(this.routeModal.id,this.routeModal);
    this.onRefreshComplete();
  };

  getProductsPrice() {
    this.paymentUtils.getProducts([this.routeModal]).then((productsData) => {
      this.routeModal.productData = productsData[0];
    }).catch((err) => {
      console.log(err);
    });

    this.paymentUtils.getProductsBundles(this.bundles).then((productsData) => {
      this.bundles.forEach((bundle) => {
        bundle.productData = productsData.filter((product) => product.productId.toLocaleLowerCase().includes(bundle.id.toLocaleLowerCase()))[0];
      });
    }).catch((err) => {
      console.log(err);
    });
  }

  onDismiss() {
    this.viewCtrl.dismiss();
  }

  purchaseByIAP() {
    this.paymentUtils.buy(this.routeModal.id).then((data) => {
      if (data) {
        this.routeValues.purchased = true;
      }
    }).catch((error) => {
      console.log(error);
    });
  };

  async goToBundle(bundle) {
    bundle.routes = bundle.route.map((routeId) => {
      let bundleRoute = this.routesAll.filter(route => route.id.includes(routeId));
      return bundleRoute[0];
    });
    this.navigateTo('BundlesPage', { bundle: bundle, routes: this.routesAll });
  };
  // async goToBundle(bundle) {
  //   bundle.routes = bundle.route.map((routeId) => {
  //     let bundleRoute = this.routesAll.filter(route => route.id.includes(routeId));
  //     return bundleRoute[0];
  //   });
  //   this.navigateTo('BundlesPage', { bundle: bundle, routes: this.routesAll });
  // };

  async purchaseBundleByIAP(bundle) {
    await this.paymentUtils.buyBundle(bundle).then((data) => {
      if(data){
        bundle.purchased = true;
        this.routeValues.purchased = true;
      }
    }).catch((error) => {
      console.log(error);
    });
  };
}

