import { Injectable, Injector } from '@angular/core';
import { AlertController, Platform, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Promocode } from './parse-models/promocode-service';
import { InAppPurchase2, IAPProduct } from '@ionic-native/in-app-purchase-2';

@Injectable()
export class PaymentUtils {

  updatePurchases(arg0: any): any {
    throw new Error("Method not implemented.");
  }
  translation: TranslateService;
  alertCtrl: AlertController;
  toastCtrl: ToastController
  constructor(injector: Injector) {
    this.alertCtrl = injector.get(AlertController);
    this.translation = injector.get(TranslateService);
    this.toastCtrl = injector.get(ToastController);

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
  /**
   *
   * @param store
   * @param platform
   * @param product
   * public product: any = {
   *    name: 'My Product',
   *    appleProductId: '1234',
   *    googleProductId: 'com.38plank.spartan_one'
   *  };
   */
  configurePurchasing(store: InAppPurchase2, platform: Platform, product: any, route = {}) {
    if (!platform.is('cordova')) {
      console.log('not cordova');
      return;
    }
    let productId;
    try {
      if (platform.is('ios')) {
        productId = product.appleProductId;
      } else if (platform.is('android')) {
        productId = product.googleProductId;
      }

      // Register Product
      // Set Debug High
      store.verbosity = store.DEBUG;
      // Register the product with the store
      store.register({
        id: productId,
        alias: productId,
        type: store.NON_CONSUMABLE
      });

      this.registerHandlers(store, productId, route);

      store.ready().then((status) => {
        // alert('Store is Ready: '+JSON.stringify(store.get(productId)));

        console.log(JSON.stringify(store.get(productId)));
        console.log('Store is Ready: ' + JSON.stringify(status));
        console.log('Products: ' + JSON.stringify(store.products));
      });

      // Errors On The Specific Product
      store.when(productId).error((error) => {
        //this.showToast("An error occurred: " + error);
      });
      // Refresh Always
      console.log('Refresh Store');
      store.refresh();
      route['purchased'] = "loading";
    } catch (err) {
      console.log('Error On Store Issues' + JSON.stringify(err));
    }
  }

  private showToast(message) {
    const toast = this.toastCtrl.create({
      message: message,
      showCloseButton: true,
      closeButtonText: 'Ok'
    });
    toast.present();
  }

  private registerHandlers(store, productId, route) {
    // Handlers
    store.when(productId).approved((product: IAPProduct) => {
      // Purchase was approved
      product.finish();
      //this.showToast("Payment approved for: " + product.title);
    });

    store.when(productId).registered((product: IAPProduct) => {
      // route['purchased'] = product.owned;
      // alert('P registered: '+JSON.stringify(product));
      console.log('Registered: ' + JSON.stringify(product));
    });

    store.when(productId).updated((product: IAPProduct) => {
      route['purchased'] = product.owned;
      if (product.loaded && product.valid && product.state === store.APPROVED) {
        product.finish();
      }
    });

    store.when(productId).cancelled((product) => {
      this.showToast('Purchase was Cancelled');
    });

    // Overall Store Error
    store.error((err) => {
      this.showToast('Store Error ' + JSON.stringify(err));
    });
  }

  async purchase(store: InAppPurchase2, platform: Platform, product: any) {
    /* Only configuring purchase when you want to buy, because when you configure a purchase
    It prompts the user to input their apple id info on config which is annoying */
    if (!platform.is('cordova')) { return };

    let productId;

    if (platform.is('ios')) {
      productId = product.appleProductId;
    } else if (platform.is('android')) {
      productId = product.googleProductId;
    }

    alert('Products: ' + JSON.stringify(store.products));
    console.log('Ordering From Store: ' + productId);
    try {
      let product = store.get(productId);
      console.log('Product Info: ' + JSON.stringify(product));
      let order = await store.order(productId);
      this.showToast('Finished Purchase');
    } catch (err) {
      console.log('Error Ordering ' + JSON.stringify(err));
    }
  }
}
