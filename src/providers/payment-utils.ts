import { Injectable, Injector } from '@angular/core';
import { AlertController, Platform, ToastController, Events } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Promocode } from './parse-models/promocode-service';
import { Bundle } from './parse-models/bundle-service';
import { InAppPurchase } from '@ionic-native/in-app-purchase';
import { Route } from './parse-models/routes';
import { LocalStorage } from './local-storage';
// import { Cordova } from '@ionic-native/core';

@Injectable()
export class PaymentUtils {

  iap: InAppPurchase;
  platform: Platform;
  localStorage: LocalStorage;
  // updatePurchases(arg0: any): any {
  //   throw new Error("Method not implemented.");
  // }
  translation: TranslateService;
  alertCtrl: AlertController;
  events: Events;
  toastCtrl: ToastController
  bandleRoutes: any = [];
  constructor(injector: Injector) {
    this.alertCtrl = injector.get(AlertController);
    this.translation = injector.get(TranslateService);
    this.toastCtrl = injector.get(ToastController);
    this.localStorage = injector.get(LocalStorage);
    this.platform = injector.get(Platform);
    this.iap = injector.get(InAppPurchase);
    this.events = injector.get(Events);
  }

  showPromoCodePrompt(routeId, okCallback, koCallback, title = this.translation.instant('promocode_title'), message = this.translation.instant('promocode_description')) {
    let prompt = this.alertCtrl.create({
      title: title,
      message: message,
      inputs: [
        {
          name: 'code',
          placeholder: this.translation.instant('promocode')
        },
      ],
      buttons: [
        {
          text: this.translation.instant('CANCEL'),
          handler: data => {
            console.log('Cancel clicked');
            koCallback();
          }
        },
        {
          text: this.translation.instant('CONTINUE'),
          handler: data => {
            prompt.data.message = this.translation.instant("promocode_check");
            Promocode.validate(data.code, routeId).then((result) => {
              if (result["action"] == "ok") {
                prompt.data.message = this.translation.instant("promocode_valid");
                Promocode.apply(data.code, "dumyDeviceId").then((applyResult) => {
                  if (applyResult["action"] == "ok") {
                    setTimeout(() => {
                      okCallback();
                      prompt.dismiss();
                    }, 2000);
                  } else {
                    prompt.data.message = this.translation.instant("promocode_check_error");
                  }
                });

              } else {
                prompt.data.message = this.translation.instant("promocode_invalid");
                setTimeout(() => {
                  koCallback();
                }, 2000);
              }
            }, error => {
              prompt.data.message = this.translation.instant("promocode_check_error");
              setTimeout(() => {
                koCallback();
              }, 2000);

            });
            return false;
          }
        }
      ]
    });
    prompt.present();
  }

  getProducts(routes: Array<Route>) {
    return this.iap.getProducts(routes.map(route => 'com.innapp.dromos.' + route.id.toLocaleLowerCase()));
  }

  async getProductBundlRoute(productId) {
    return this.iap.getProducts(['com.innapp.dromos.' + productId.toLocaleLowerCase()]).then((productData) => {
      return productData;
    }).catch((err) => {
      console.log(err);
    });
  }

  async buy(productId) {
    return this.iap.getProducts(['com.innapp.dromos.' + productId.toLocaleLowerCase()]).then((productData) => {
      return this.iap.buy(productData[0].productId).then(data => {

        this.events.publish("purchased", productId.toLocaleLowerCase());
        this.enableRoute(productData[0].productId);

        return data;
      }).catch((err) => {
        console.log(err);
      });
    }).catch((error) => {
      console.log(error);
    });
  }

  enableBundle(bundle) {
    this.localStorage.setBundleValue(bundle.id, "purchased", true);
    for (let routeId of bundle.route) {
      this.enableRoute(routeId);
    }
  }

  enableRoute(productId) {
    this.localStorage.setRouteValue(productId.substr(productId.lastIndexOf('.') + 1), "purchased", true);
  }

  async restorePurchases() {
    let bundleRoutes = [];
    if (this.platform.is('cordova')) {
      let bundlesLoadAll = await Bundle.load();
      return this.iap.restorePurchases().then(purchases => {

        // Unlock the features of the purchases!
        let bundlesFiltered = purchases.filter((bundl) => bundl.productId.indexOf('bundle') != -1);
        let routesFiltered = purchases.filter((route) => route.productId.indexOf('bundle') == -1);

        bundlesFiltered.forEach((bundle) => {
          let bundleValue = bundlesLoadAll.filter(dataBundle => bundle.productId.includes(dataBundle.id.toLocaleLowerCase()));

          bundleValue[0].route.forEach((routeId) => {
            bundleRoutes.push(routeId.toLocaleLowerCase());
          })

          this.enableBundle(bundleValue[0]);
        });

        routesFiltered.forEach((route) => {
          this.enableRoute(route.productId);
        });

        let purchasesALL = purchases.map((purchase) => purchase.productId.substr(purchase.productId.lastIndexOf('.') + 1));
        purchasesALL = purchasesALL.concat(bundleRoutes);
        purchasesALL = Array.from(new Set(purchasesALL));
        return purchasesALL;
      }).catch((error) => {
        console.log(error);
      });
    } else {
      return Promise.resolve([]);
    }
  }

  // ----------LOAD BUNDLES--------------
  getProductsBundles(bundles: Array<Bundle>) {
    return this.iap.getProducts(bundles.map(bundle => 'com.innapp.dromos.bundle.' + bundle.id.toLocaleLowerCase()));
  }

  async buyBundle(bundle) {
    let productId = bundle.id;
    return this.iap.getProducts(['com.innapp.dromos.bundle.' + productId.toLocaleLowerCase()]).then((productData) => {
      return this.iap.buy(productData[0].productId).then(data => {

        bundle.purchased = true;
        bundle.routes.forEach((route) => {
          route.purchased = true;
        });

        this.enableBundle(bundle);
        return data;
      }).catch((err) => {
        console.log(err);
      });
    }).catch((error) => {
      console.log(error);
    });
  }

  activateBundle(bundle, routeId, okCallback, koCallback) {
    Bundle.validate(bundle, routeId).then((result) => {
      if (result["action"] == "ok") {
        Bundle.apply(bundle, "dumyInfoDeviceId").then((applyResult) => {
          if (applyResult["action"] == "ok") {
            setTimeout(() => {
              okCallback();
            }, 1000);
          } else {
            koCallback();
          }
        }).catch((error) => {
          console.log(error);
        });
      } else {
        koCallback();
      }
    }, error => {
      koCallback();
    });
  }
  // activatePromocode(promocode, routeId, okCallback, koCallback) {
  //   Promocode.validate(promocode, routeId).then((result) => {
  //     if (result["action"] == "ok") {
  //       Promocode.apply(promocode, "dumyInfoDeviceId").then((applyResult) => {
  //         if (applyResult["action"] == "ok") {
  //           setTimeout(() => {
  //             okCallback();
  //           }, 1000);
  //         } else {
  //           koCallback();
  //         }
  //       });
  //     } else {
  //       koCallback();
  //     }
  //   }, error => {
  //     koCallback();
  //   });
  // }

  // private showToast(message) {
  //   const toast = this.toastCtrl.create({
  //     message: message,
  //     showCloseButton: true,
  //     closeButtonText: 'Ok'
  //   });
  //   toast.present();
  // }


}
