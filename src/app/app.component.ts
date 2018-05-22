import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, ModalController, ToastController, Events, Loading, LoadingController } from 'ionic-angular';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HeaderColor } from '@ionic-native/header-color';

import Parse from 'parse';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from './app.config';

import { User } from '../providers/parse-models/user-service';
import { LocalStorage } from '../providers/local-storage';
import { Preference } from '../providers/preference';
import { TabsPage } from '../pages/tabs/tabs';
import { WalkthroughPage } from '../pages/walkthrough-page/walkthrough-page';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any ;
  user: User;
  trans: any;

  loadingPopup: Loading;
  loading: boolean;
  // pages: Array<{ title: string, icon: string, component: any }>;

  constructor(public platform: Platform,
    private events: Events,
    private storage: LocalStorage,
    private translate: TranslateService,
    private toastCtrl: ToastController,
    private preference: Preference,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    // private googleAnalytics: GoogleAnalytics,
    private headerColor: HeaderColor,
    private modalCtrl: ModalController,
    public loadCtrl: LoadingController) {

    this.initializeApp();
  }

  initializeApp() {

    this.events.subscribe('load', (e, content) => {
      console.log("Places recieved load:", e);
      if (e) {
        if (this.loadingPopup) {
          this.loadingPopup.setContent(content);
        } else {
          this.loadingPopup = this.loadCtrl.create({
            content: content
          });
          this.loadingPopup.present();
        }
      } else {
        this.loadingPopup && this.loadingPopup.dismiss();
        this.loadingPopup = null;
      }
    });

    this.translate.setDefaultLang(AppConfig.DEFAULT_LANG);


    this.storage.lang.then(val => {

      let lang = val || AppConfig.DEFAULT_LANG;

      this.translate.use(lang);
      this.storage.lang = lang;
      this.preference.lang = lang;

      this.storage.skipIntroPage.then((skipIntroPage) => {
        //--------Open First Page Map---------------
        this.rootPage = skipIntroPage ? TabsPage : WalkthroughPage;
      }).catch((e) => console.log(e));

      // this.buildMenu();
    }).catch((e) => console.log(e));

    this.storage.unit.then(val => {
      let unit = val || AppConfig.DEFAULT_UNIT;

      this.storage.unit = unit;
      this.preference.unit = unit;
    }).catch((e) => console.log(e));

    this.storage.radius.then(val => {
      let radius = val || AppConfig.DEFAULT_RADIUS;

      this.storage.radius = radius;
      this.preference.radius = radius;
    }).catch((e) => console.log(e));

    this.storage.playBackRateIndex.then(val => {
      let playBackRateIndex = val || AppConfig.DEFAULT_PLAYBACK_RATE_INDEX;

      this.storage.playBackRateIndex = playBackRateIndex;
      this.preference.playBackRateIndex = playBackRateIndex;
    }).catch((e) => console.log(e));

    this.storage.playBackRateValues.then(val => {
      let playBackRateValues = val || AppConfig.DEFAULT_PLAYBACK_RATE_VALUES;

      this.storage.playBackRateValues = playBackRateValues;
      this.preference.playBackRateValues = playBackRateValues;
    }).catch((e) => console.log(e));

    this.storage.mapStyle.then(val => {

      let mapStyle = val || AppConfig.DEFAULT_MAP_STYLE;

      this.storage.mapStyle = mapStyle;
      this.preference.mapStyle = mapStyle;
    }).catch((e) => console.log(e));

    Parse.serverURL = AppConfig.SERVER_URL;
    Parse.initialize(AppConfig.APP_ID);

    User.getInstance();
    this.user = User.getCurrentUser();

    if (this.user) {
      this.user.fetch();
    }

    this.platform.ready().then(() => {

      if (AppConfig.HEADER_COLOR && this.platform.is('android')) {
        this.headerColor.tint(AppConfig.HEADER_COLOR);
      }

      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

}
