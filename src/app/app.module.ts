import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler,Slides } from 'ionic-angular';
import { MyApp } from './app.component';

import { VgCoreModule } from 'videogular2/core';
// import { VgAPI } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';

import { Category } from '../providers/categories';
import { Place } from '../providers/place-service';
import { Review } from '../providers/review-service';
import { ParseFile } from '../providers/parse-file-service';
import { User } from '../providers/user-service';
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
import { GoogleAnalytics } from '@ionic-native/google-analytics';
import { BrowserTab } from '@ionic-native/browser-tab';

import { IonicStorageModule } from '@ionic/storage';
import { Ng2ImgFallbackModule } from 'ng2-img-fallback';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { Ionic2RatingModule } from 'ionic2-rating';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpModule, Http } from '@angular/http';

export function HttpLoaderFactory(http: Http) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
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
    MyApp
  ],
  providers: [Category, Place, ParseFile, Review, LocalStorage, User,
    StatusBar,
    SplashScreen,
    Diagnostic,
    LocationAccuracy,
    Geolocation,
    LaunchNavigator,
    // CallNumber,
    InAppBrowser,
    GoogleMaps,
    GoogleAnalytics,
    AppVersion,
    HeaderColor,
    BrowserTab,
    File,
    Preference, MapStyle, { provide: ErrorHandler, useClass: IonicErrorHandler }]
})

export class AppModule {}
