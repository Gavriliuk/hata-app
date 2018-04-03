import { Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  NavController, LoadingController, ToastController, NavParams,
  AlertController, MenuController
} from 'ionic-angular';
import Parse from 'parse';


export abstract class BasePage {


  public isErrorViewVisible: boolean;
  public isEmptyViewVisible: boolean;
  public isContentViewVisible: boolean;
  public isLoadingViewVisible: boolean;

  protected refresher: any;
  protected infiniteScroll: any;
  protected navParams: NavParams;
  protected translate: TranslateService;

  private loader: any;
  private navCtrl: NavController;
  private toastCtrl: ToastController;
  private loadingCtrl: LoadingController;
  protected alertCtrl: AlertController;

  constructor(injector: Injector) {
    this.loadingCtrl = injector.get(LoadingController);
    this.toastCtrl = injector.get(ToastController);
    this.navCtrl = injector.get(NavController);
    this.alertCtrl = injector.get(AlertController);
    this.navParams = injector.get(NavParams);
    this.translate = injector.get(TranslateService);

    let menu = injector.get(MenuController);
    menu.swipeEnable(this.enableMenuSwipe());
  }

  abstract enableMenuSwipe(): boolean;

  showLoadingView() {

    this.isErrorViewVisible = false;
    this.isEmptyViewVisible = false;
    this.isContentViewVisible = false;
    this.isLoadingViewVisible = true;

    // this.translate.get('LOADING').subscribe((loadingText: string) => {

    //   this.loader = this.loadingCtrl.create({
    //     content: `<p class="item">${loadingText}</p>`,
    //   });
    //   this.loader.present();
    // });
  }

  showContentView() {

    this.isErrorViewVisible = false;
    this.isEmptyViewVisible = false;
    this.isLoadingViewVisible = false;
    this.isContentViewVisible = true;

    // this.loader.dismiss();
  }

  showEmptyView() {

    this.isErrorViewVisible = false;
    this.isLoadingViewVisible = false;
    this.isContentViewVisible = false;
    this.isEmptyViewVisible = true;

    // this.loader.dismiss();
  }

  showErrorView() {

    this.isLoadingViewVisible = false;
    this.isContentViewVisible = false;
    this.isEmptyViewVisible = false;
    this.isErrorViewVisible = true;

    this.loader.dismiss();
  }

  onRefreshComplete(data = null) {

    if (this.refresher) {
      this.refresher.complete()
    }

    if (this.infiniteScroll) {
      this.infiniteScroll.complete();

      if (data && data.length === 0) {
        this.infiniteScroll.enable(false);
      } else {
        this.infiniteScroll.enable(true);
      }
    }
  }

  showToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000
    });

    toast.present();
  }

  showConfirm(message: string): Promise<boolean> {

    return new Promise((resolve, reject) => {

      this.translate.get(['OK', 'CANCEL']).subscribe(values => {

        let confirm = this.alertCtrl.create({
          title: '',
          message: message,
          buttons: [{
            text: values.CANCEL,
            handler: () => {
              reject();
            }
          }, {
            text: values.OK,
            handler: () => {
              resolve(true);
            }
          }]
        });

        confirm.present();
      });
    });
  }

  navigateTo(page: any, params: any = {}) {
    this.navCtrl.push(page, params);
  }

  // Convert Degress to Radians
  Deg2Rad(deg) {
    return deg * Math.PI / 180;
  }

  PythagorasEquirectangular(lat1, lon1, lat2, lon2, radius) {
    lat1 = this.Deg2Rad(lat1);
    lat2 = this.Deg2Rad(lat2);
    lon1 = this.Deg2Rad(lon1);
    lon2 = this.Deg2Rad(lon2);
    var R = 6371; // km
    var x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    var y = (lat2 - lat1);
    var d = Math.sqrt(x * x + y * y) * R;
    return d;
  }

  NearestPlace(places, listened, params) {
    var mindif = 99999;
    var closestIndex;

    for (let index = 0; index < places.length; ++index) {
      var dif = this.PythagorasEquirectangular(params.location.latitude, params.location.longitude, places[index].location.latitude, places[index].location.longitude, params.distance);
      if (dif < Number.parseFloat(places[index].radius) && dif < mindif && listened.indexOf(places[index].id) == -1 && this.inSelectedPeriod(places[index], params.selectedYear)) {
        closestIndex = index;
        mindif = dif;
      }
    }
    return places[closestIndex];
  }

  getFileURL(fileName) {
    return Parse.serverURL + 'files/' + Parse.applicationId + '/' + fileName;
  }

  inSelectedPeriod(place, period) {
    return Number(new Date(place.startPeriod).getFullYear()) <= period && Number(new Date(place.endPeriod).getFullYear()) >= period;
  }

}
