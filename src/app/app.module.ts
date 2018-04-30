import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

import { Route } from '../providers/parse-models/routes';
import { Promocode } from '../providers/parse-models/promocode-service';
import { Place } from '../providers/parse-models/place-service';
import { Category } from '../providers/parse-models/category-service';
import { Review } from '../providers/parse-models/review-service';
import { ParseFile } from '../providers/parse-models/parse-file-service';
import { User } from '../providers/parse-models/user-service';
import { LocalStorage } from '../providers/local-storage';
import { Preference } from '../providers/preference';
import { MapStyle } from '../providers/map-style';

import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Geolocation } from '@ionic-native/geolocation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { File } from '@ionic-native/file';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { GoogleMaps } from '@ionic-native/google-maps';
import { AppVersion } from '@ionic-native/app-version';
import { HeaderColor } from '@ionic-native/header-color';
// import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { BrowserTab } from '@ionic-native/browser-tab';

import { IonicStorageModule } from '@ionic/storage';
import { Ng2ImgFallbackModule } from 'ng2-img-fallback';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { Ionic2RatingModule } from 'ionic2-rating';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpModule, Http } from '@angular/http';
import { RoutesPage } from '../pages/routes/routes';
import { SettingsPage } from '../pages/settings-page/settings-page';
import { TabsPage } from '../pages/tabs/tabs';
import { WalkthroughPage } from '../pages/walkthrough-page/walkthrough-page';


export function HttpLoaderFactory(http: Http) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp,
    RoutesPage,
    SettingsPage,
    WalkthroughPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp,{
      tabsHideOnSubPages: true
    }),
    IonicStorageModule.forRoot(),
    Ng2ImgFallbackModule,
    LazyLoadImageModule,
    Ionic2RatingModule,
    HttpModule,
    VgCoreModule,
    // VgAPI,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,

    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [Http]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    RoutesPage,
    SettingsPage,
    WalkthroughPage,
    TabsPage
  ],
  providers: [Route, Place, Promocode,Category, ParseFile, Review, LocalStorage, User,
    StatusBar,
    SplashScreen,
    Diagnostic,
    LocationAccuracy,
    Geolocation,
    LaunchNavigator,
    // CallNumber,
    InAppBrowser,
    GoogleMaps,
    // GoogleAnalytics,
    AppVersion,
    HeaderColor,
    BrowserTab,
    File,
    Preference, MapStyle, { provide: ErrorHandler, useClass: IonicErrorHandler }]
})

export class AppModule { }
