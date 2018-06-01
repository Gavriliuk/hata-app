import { Component, Injector } from '@angular/core';
import { Events, ModalController, Platform } from 'ionic-angular';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Route } from '../../providers/parse-models/routes';
import { BasePage } from '../base-page/base-page';
import { User } from '../../providers/parse-models/user-service';
import { LocalStorage } from '../../providers/local-storage';
import { Place } from '../../providers/parse-models/place-service';
// import { PaymentUtils } from '../../providers/payment-utils';
// import { InAppPurchase } from '@ionic-native/in-app-purchase';

@Component({
  selector: 'page-routes',
  templateUrl: 'routes.html'
})
export class RoutesPage extends BasePage {

  // paymentUtils: PaymentUtils;
  private routes: Array<Route>;
  place: Place;
  places: Place[];
  lang: any;
  audio: any[];
  audio_ru: any;
  audio_ro: any;
  audio_en: any;
  routePlaces: any = [];
  constructor(injector: Injector,
    private storage: LocalStorage,
    private events: Events,
    private locationAccuracy: LocationAccuracy,
    private diagnostic: Diagnostic,
    public modalCtrl: ModalController, public platform: Platform) {
    super(injector);
    // this.paymentUtils = new PaymentUtils(injector);

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

  }

  enableMenuSwipe() {
    return true;
  }

  ionViewDidLoad() {
    // this.showLoadingView();
    this.loadData();
  }

  goToPlaces(route) {
    this.navigateTo('PlacesPage', route);
    console.log("GoToPlaces(route): ", route);
  }

  async loadData() {
    this.lang = await this.storage.lang;
    this.routes = await Route.load();
    // this.paymentUtils.restorePurchases().then((purchases) => {
    this.routes.forEach((route) => {
      this.storage.getRouteAllValues(route.id).then((values) => {
        route["purchased"] = values["purchased"];
        // if (purchases.includes(route.id.toLocaleLowerCase())) {
        //   route["purchased"] = true;
        // }
      })

    })
    // });
    // this.updatePurchases(this.routes);
    // .then(data => {
    //   this.routes = data;

    if (this.routes.length) {
      this.showContentView();
    } else {
      this.showEmptyView();
    }

    this.onRefreshComplete();

    // }, error => {

    //   if (error.code === 209) {
    //     User.logOut().then(
    //       res => this.events.publish('user:logout')),
    //       err => console.log(err);
    //   }

    //   this.showErrorView();
    //   this.onRefreshComplete();
    // });
  }

  // updatePurchases(routes: Array<Route>): any {
  //   routes.forEach((route) => {
  //     const product: any = {
  //       name: route.title_ru,
  //       appleProductId: 'com.innapp.dromos.' + route.id.toLocaleLowerCase(),
  //       googleProductId: 'com.innapp.dromos.' + route.id.toLocaleLowerCase()
  //     };
  //     if(route.id.toLocaleLowerCase()=='bkkexjtvzh'){
  //       // this.paymentUtils.configurePurchasing(this.store, this.platform, product, route);
  //     }
  //   })
  // }

  onReload(refresher) {
    this.refresher = refresher;
    this.loadData();
  }



  openModalAddReviewRoute(route) {

    Route.getPlacesRelation(route).then(data => {
      this.routePlaces = data;
      let modal = this.modalCtrl.create('AddReviewPage', { route: route, places: this.routePlaces, lang: this.lang });
      modal.present();

    }, error => {
      this.showErrorView();
    });

  }

  // openModalAddReviewRoute(title, information, center_map, waypoints, start_route, end_route) {
  //   let modal = this.modalCtrl.create('AddReviewPage', {title, information, center_map,start_route, end_route, waypoints, places: this.places});
  //   modal.present();
  // }


}
