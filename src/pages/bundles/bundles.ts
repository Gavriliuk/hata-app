import { Component, Injector } from '@angular/core';
import { IonicPage, Events, ModalController, Platform } from 'ionic-angular';
import { Route } from '../../providers/parse-models/routes';
import { BasePage } from '../base-page/base-page';
import { LocalStorage } from '../../providers/local-storage';
import { PaymentUtils } from '../../providers/payment-utils';

@IonicPage()
@Component({
  selector: 'page-bundles',
  templateUrl: 'bundles.html'
})
export class BundlesPage extends BasePage {

  paymentUtils: PaymentUtils;
  routes: Array<Route>;
  bundle: any = {};
  lang: any;
  routePlaces: any = [];
  bundleValues: any = {
    purchased: false
  };

  constructor(injector: Injector,
    private storage: LocalStorage,
    private events: Events,
    public modalCtrl: ModalController, public platform: Platform) {
    super(injector);
    this.paymentUtils = new PaymentUtils(injector);

    this.bundle = this.navParams.data.bundle;
    this.routes = this.navParams.data.routes;
    this.bundle.productData = {};
  }

  enableMenuSwipe() {
    return false;
  }

  async ionViewDidLoad() {
    this.lang = await this.storage.lang;
    this.bundleValues = await this.storage.getBundleAllValues(this.bundle.id);
    
    this.bundle.routes.forEach((bundlRoute) => {
        this.storage.getRouteAllValues(bundlRoute.id,bundlRoute).then((values) => {
          bundlRoute["purchased"] = values["purchased"];
        }).catch((error) => {
          console.log(error);
        });
    });
    
    this.paymentUtils.getProducts(this.bundle.routes).then((productsData) => {
      this.bundle.routes.forEach((route) => {
        route.productData = productsData.filter((product) => product.productId.includes(route.id.toLocaleLowerCase()))[0];
      });
    }).catch((err) => {
      console.log(err);
    });

    this.paymentUtils.getProductsBundles([this.bundle]).then((productsData) => {
        this.bundle.productData = productsData[0];
      }).catch((err) => {
        console.log(err);
    });
  }

  async purchaseBundleByIAP() {
    await this.paymentUtils.buyBundle(this.bundle).then((data) => {
      if(data){
        this.bundleValues.purchased = true;
      }
    }).catch((error) => {
      console.log(error);
    });
  };

}
