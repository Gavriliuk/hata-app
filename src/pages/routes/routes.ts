import { Component, Injector } from '@angular/core';
import { Events, ModalController, Platform } from 'ionic-angular';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Route } from '../../providers/parse-models/routes';
import { BasePage } from '../base-page/base-page';
// import { User } from '../../providers/parse-models/user-service';
import { LocalStorage } from '../../providers/local-storage';
import { Place } from '../../providers/parse-models/place-service';
import { PaymentUtils } from '../../providers/payment-utils';
// import { InAppPurchase } from '@ionic-native/in-app-purchase';
import { Bundle } from '../../providers/parse-models/bundle-service';

@Component({
  selector: 'page-routes',
  templateUrl: 'routes.html'
})
export class RoutesPage extends BasePage {

  paymentUtils: PaymentUtils;
  private routes: Array<Route>;
  place: Place;
  places: Place[];
  lang: any;
  audio: any[];
  audio_ru: any;
  audio_ro: any;
  audio_en: any;
  routePlaces: any = [];
  bundles: Array<Bundle>;
  bundlesSorted: any = [];

  constructor(injector: Injector,
    private storage: LocalStorage,
    private events: Events,
    private locationAccuracy: LocationAccuracy,
    private diagnostic: Diagnostic,
    public modalCtrl: ModalController, public platform: Platform) {
    super(injector);
    this.paymentUtils = new PaymentUtils(injector);

    this.locationAccuracy.canRequest().then((canRequest: boolean) => {
      if (canRequest) {
        let priority = this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY;
        this.locationAccuracy.request(priority)
          .then(() => console.log('Request successful'))
          .catch((error) => {
            if (error && error.code !== this.locationAccuracy.ERROR_USER_DISAGREED) {
              this.translate.get('ERROR_LOCATION_MODE').subscribe((res: string) => {
                this.showConfirm(res).then(() => this.diagnostic.switchToLocationSettings());
              });
            }
          });
      }
    }).catch((err) => console.log(err));

    this.events.subscribe('restoredPurchases', (purchasedItems) => {
      this.routes.forEach((route) => {
        if (purchasedItems.includes(route.id.toLocaleLowerCase())) {
          route["purchased"] = true;
        }
      });
    });

    this.events.subscribe('purchased', (purchasedItem) => {
      this.routes.forEach((route) => {
        if (purchasedItem.includes(route.id.toLocaleLowerCase())) {
          route["purchased"] = true;
        }
      });
    });
    
  }

  enableMenuSwipe() {
    return false;
  }

  ionViewDidLoad() {
    this.events.publish("load", false);
    this.loadData();
  }
  

  goToPlaces(route) {
    this.navigateTo('PlacesPage', route);
    console.log("GoToPlaces(route): ", route);
  }

  async loadData() {
    this.lang = await this.storage.lang;
    this.routes = await Route.load();
    this.routes.forEach((route) => {
      this.storage.getRouteAllValues(route.id, route).then((values) => {
        route["purchased"] = values["purchased"];
      }).catch((error) => {
          console.log(error);
      });

    })
    if (this.routes.length) {
      this.showContentView();
    } else {
      this.showEmptyView();
    }
    this.onRefreshComplete();
  }

  onReload(refresher) {
    this.refresher = refresher;
    this.loadData();
  }

  async openEnableRoute(routeSelected) { 
    this.bundles = await Bundle.load();
    this.bundles = this.bundles.filter(bundle => bundle.route.indexOf(routeSelected.id) !== -1);
    let routesAll = this.routes;
    Route.getPlacesRelation(routeSelected).then(data => {
      this.routePlaces = data;

      this.navigateTo('EnableRoutePage', { route: routeSelected, places: this.routePlaces, lang: this.lang , bundles: this.bundles, routesAll: routesAll});
        console.log('Bundles Sorted in routes: ', this.bundles);
    }, error => {
      this.showErrorView();
    });
  }
}
