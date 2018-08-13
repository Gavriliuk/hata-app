import { Component, Injector } from '@angular/core';
import { Events } from 'ionic-angular';
import { LocalStorage } from '../../providers/local-storage';
import { Preference } from '../../providers/preference';
import { BasePage } from '../base-page/base-page';
import { WalkthroughPage } from '../walkthrough-page/walkthrough-page';
import { MyApp } from '../../app/app.component';
import { PaymentUtils } from '../../providers/payment-utils';

@Component({
  selector: 'page-settings-page',
  templateUrl: 'settings-page.html'
})
export class SettingsPage extends BasePage {

  settings: any = {};
  storage: LocalStorage;
  events: Events;
  preference: Preference;
  filterRoute: string;
  paymentUtils: PaymentUtils;

  constructor(private injector: Injector,
    localStorage: LocalStorage,
    events: Events,
    preference: Preference) {

    super(injector);
    this.paymentUtils = new PaymentUtils(injector);
    this.storage = localStorage;
    this.events = events;
    this.preference = preference;

    this.storage.lang.then(lang => this.settings.lang = lang).catch((e) => console.log(e));
    this.storage.unit.then(unit => this.settings.unit = unit).catch((e) => console.log(e));
    this.storage.radius.then(radius => this.settings.radius = radius).catch((e) => console.log(e));
    this.storage.mapStyle.then(mapStyle => this.settings.mapStyle = mapStyle).catch((e) => console.log(e));
    this.storage.distance.then(distance => this.settings.distance = distance).catch((e) => console.log(e));
    // this.storage.filterRoute.then(filterRoute => this.settings.filterRoute = filterRoute).catch((e) => console.log(e));
  }

  enableMenuSwipe() {
    return true;
  }

  ionViewDidLoad() {
  }

  onChangeLang() {
    if (this.settings.lang) {
      this.storage.lang = this.settings.lang;
      this.translate.use(this.settings.lang);
      this.events.publish('lang:change');
    }
  }

  onChangeRadius() {
    this.storage.radius = this.settings.radius;
    this.preference.radius = this.settings.radius;
  }

  // onChangeFilterRoute() {
  //   this.storage.filterRoute = this.settings.filterRoute;
  //   this.preference.filterRoute = this.settings.filterRoute;
  // }

  onChangeUnit() {
    this.storage.unit = this.settings.unit;
    this.preference.unit = this.settings.unit;
  }

  onChangeMapStyle() {
    this.storage.mapStyle = this.settings.mapStyle;
    this.preference.mapStyle = this.settings.mapStyle;
  }

  onChangeDistance() {
    this.storage.distance = this.settings.distance;
  }

  goToWalkthrough() {
    this.navigateTo(WalkthroughPage);
  }

  restorePurchases() {
    // let purchases=["bkkexjtvzh","j8nc2uhpsc"];
    this.events.publish("load", true, this.translate.instant('LOADING'));
    this.paymentUtils.restorePurchases().then((purchases) => {
      this.events.publish("load", false);
      let prompt = this.alertCtrl.create({
        title: this.translate.instant('restore_purchases'),
        message: this.translate.instant('restored_purchases_description', { 'restored': purchases.length }),
        buttons: [
          {
            text: this.translate.instant('OK'),
            handler: data => {
              console.log('OK clicked');
              this.events.publish("restoredPurchases", purchases);
            }
          }
        ]
      });
      prompt.present();
    }).catch((error) => {
      console.log(error);
  });
  }

  clearStorage() {
    let prompt = this.alertCtrl.create({
      title: this.translate.instant('clean_sure'),
      message: this.translate.instant('clean_warning'),
      buttons: [
        {
          text: this.translate.instant('clean_no'),
          handler: data => {
            console.log('Cancel clicked');

          }
        },
        {
          text: this.translate.instant('clean_yes'),
          handler: data => {
            this.storage.clearLocalStorage().then(() => {
              this.navigateTo(MyApp);
            }).catch((error) => {
              console.log(error);
          });
          }
        }
      ]
    });
    prompt.present();
  }
}
