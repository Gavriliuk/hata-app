import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, ModalController, ToastController, Events } from 'ionic-angular';

import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { HeaderColor } from '@ionic-native/header-color';

import Parse from 'parse';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from './app.config';

import { User } from '../providers/user-service';
import { LocalStorage } from '../providers/local-storage';
import { Preference } from '../providers/preference';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any;
  user: User;
  trans: any;

  pages: Array<{ title: string, icon: string, component: any }>;

  constructor(public platform: Platform,
    private events: Events,
    private storage: LocalStorage,
    private translate: TranslateService,
    private toastCtrl: ToastController,
    private preference: Preference,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private googleAnalytics: GoogleAnalytics,
    private headerColor: HeaderColor,
    private modalCtrl: ModalController) {

    this.initializeApp();
  }

  onMenuOpened() {
    this.events.publish('onMenuOpened');
  }

  onMenuClosed() {
    this.events.publish('onMenuClosed');
  }

  buildMenu() {

    let trans = ['CATEGORIES', 'MAP', 'ADD_PLACE', 'MY_FAVORITES',
    'SETTINGS', 'LOGOUT', 'LOGGED_OUT', 'PROFILE'];

    this.translate.get(trans).subscribe(values => {

      this.trans = values;

      this.pages = [
        { title: values.CATEGORIES, icon: 'pricetag', component: 'CategoriesPage' },
        { title: values.MAP, icon: 'map', component: 'MapPage' },
        { title: values.ADD_PLACE, icon: 'create', component: 'AddPlacePage' },
        { title: values.MY_FAVORITES, icon: 'heart', component: 'FavoritesPage' },
        { title: values.SETTINGS, icon: 'settings', component: 'SettingsPage' },
      ];

      if (User.getCurrentUser()) {
        this.pages.push({ title: values.PROFILE, icon: 'contact', component: 'ProfilePage' })
        this.pages.push({ title: values.LOGOUT, icon: 'exit', component: null })
      }

    });
  }

  initializeApp() {

    this.events.subscribe('user:login', (userEventData) => {
      this.user = userEventData[0];
      this.buildMenu();
    });

    this.events.subscribe('user:logout', () => {
      this.user = null;
      this.buildMenu();
    });

    this.events.subscribe('lang:change', (e) => {
      this.buildMenu();
    });

    this.translate.setDefaultLang(AppConfig.DEFAULT_LANG);


    this.storage.lang.then(val => {

      let lang = val || AppConfig.DEFAULT_LANG;

      this.translate.use(lang);
      this.storage.lang = lang;
      this.preference.lang = lang;

      this.storage.skipIntroPage.then((skipIntroPage) => {
        this.rootPage = skipIntroPage ? 'CategoriesPage' : 'WalkthroughPage';
      }).catch((e) => console.log(e));

      this.buildMenu();
    }).catch((e) => console.log(e));

    this.storage.unit.then(val => {
      let unit = val || AppConfig.DEFAULT_UNIT;

      this.storage.unit = unit;
      this.preference.unit = unit;
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

      if (AppConfig.TRACKING_ID) {
        this.googleAnalytics.startTrackerWithId(AppConfig.TRACKING_ID);
        this.googleAnalytics.trackEvent('', 'App opened');
        this.googleAnalytics.debugMode();
        this.googleAnalytics.enableUncaughtExceptionReporting(true);
      }

      if (AppConfig.HEADER_COLOR && this.platform.is('android')) {
        this.headerColor.tint(AppConfig.HEADER_COLOR);
      }

      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {

    if ((page.component === 'FavoritesPage' || page.component === 'AddPlacePage') && !User.getCurrentUser()) {

      this.nav.push('SignInPage');

    } else if (page.component === null && User.getCurrentUser()) {

      User.logout().then(success => {

        let toast = this.toastCtrl.create({
          message: this.trans.LOGGED_OUT,
          duration: 3000
        });

        toast.present();

        this.user = null;
        this.buildMenu();
      }, error => console.log(error));

    } else {
      this.nav.setRoot(page.component);
    }
  }
}
