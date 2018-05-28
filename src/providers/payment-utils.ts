import { Injectable, Injector } from '@angular/core';
import { AlertController, Platform, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Promocode } from './parse-models/promocode-service';
import { InAppPurchase } from '@ionic-native/in-app-purchase';
import { Route } from './parse-models/routes';
import { LocalStorage } from './local-storage';
import { Cordova } from '@ionic-native/core';

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
  toastCtrl: ToastController
  constructor(injector: Injector) {
    this.alertCtrl = injector.get(AlertController);
    this.translation = injector.get(TranslateService);
    this.toastCtrl = injector.get(ToastController);
    this.localStorage = injector.get(LocalStorage);
    this.platform = injector.get(Platform);
    this.iap = injector.get(InAppPurchase);
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

  activatePromocode(promocode, routeId, okCallback, koCallback) {
    Promocode.validate(promocode, routeId).then((result) => {
      if (result["action"] == "ok") {
        Promocode.apply(promocode, "dumyInfoDeviceId").then((applyResult) => {
          if (applyResult["action"] == "ok") {
            setTimeout(() => {
              okCallback();
            }, 1000);
          } else {
            koCallback();
          }
        });
      } else {
        koCallback();
      }
    }, error => {
      koCallback();
    });
  }

  private showToast(message) {
    const toast = this.toastCtrl.create({
      message: message,
      showCloseButton: true,
      closeButtonText: 'Ok'
    });
    toast.present();
  }

   getProducts(routes: Array<Route>) {
    return this.iap.getProducts(routes.map(route => 'com.innapp.dromos.' + route.id.toLocaleLowerCase()));
  }

  async buy(productId) {
    return this.iap.getProducts(['com.innapp.dromos.' + productId.toLocaleLowerCase()]).then((productData) => {
      return this.iap.buy(productData[0].productId).then(data => {
        this.enableItem(productData[0].productId);
        return data;
      })
    })
  }

  enableItem(productId) {
    this.localStorage.setRouteValue(productId.substr(productId.lastIndexOf('.') + 1), "purchased", true);
  }

  restorePurchases() {
    if (this.platform.is('cordova')) {
      return this.iap.restorePurchases().then(purchases => {
        // Unlock the features of the purchases!
        for (let prev of purchases) {
          this.enableItem(prev.productId)
        }
        return purchases.map((purchase) => purchase.productId.substr(purchase.productId.lastIndexOf('.') + 1));
      });
    } else {
      return Promise.resolve([]);
    }
  }
}
