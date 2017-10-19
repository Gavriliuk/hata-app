import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { BasePage } from '../base-page/base-page';
import { AppConfig } from '../../app/app.config';
import { Place } from '../../providers/place-service';
import { Preference } from '../../providers/preference';
import { Category } from '../../providers/categories';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { AdMobFree, AdMobFreeBannerConfig } from '@ionic-native/admob-free';

@IonicPage()
@Component({
  selector: 'page-places',
  templateUrl: 'places.html'
})
export class PlacesPage extends BasePage {

  params: any = {};
  places: Place[];
  category: Category;

  constructor(injector: Injector,
    private geolocation: Geolocation,
    private admobFree: AdMobFree,
    private preference: Preference) {
    super(injector);

    this.params.category = this.navParams.data;
    this.params.filter = 'nearby';
    this.params.unit = this.preference.unit;

    this.showLoadingView();
    this.onReload();
    this.prepareAd();
  }

  enableMenuSwipe() {
    return false;
  }

  prepareAd() {

    if (AppConfig.BANNER_ID) {
      const bannerConfig: AdMobFreeBannerConfig = {
        id: AppConfig.BANNER_ID,
        isTesting: false,
        autoShow: true
      };
      
      this.admobFree.banner.config(bannerConfig);
      
      this.admobFree.banner.prepare().then(() => {
        // banner Ad is ready
        // if we set autoShow to false, then we will need to call the show method here
      }).catch(e => console.log(e));
    }
  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', place);
  }

  loadData() {

    Place.load(this.params).then(data => {

      for (let place of data) {
        this.places.push(place);
      }

      this.onRefreshComplete(data);

      if (this.places.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

    }, error => {
      this.onRefreshComplete();
      this.showErrorView();
    });
  }

  onFilter(filter) {
    this.params.filter = filter;
    this.showLoadingView();
    this.onReload();
  }

  onLoadMore(infiniteScroll) {
    this.infiniteScroll = infiniteScroll;
    this.params.page++;
    this.loadData();
  }

  onReload(refresher = null) {

    this.refresher = refresher;

    this.places = [];
    this.params.page = 0;

    if (this.params.filter === 'nearby') {

      const options: GeolocationOptions = {
        enableHighAccuracy: true,
        timeout: 10000
      };

      this.geolocation.getCurrentPosition(options).then(pos => {
        this.params.location = pos.coords;
        this.loadData();
      }, error => {
        this.showErrorView();
        this.translate.get('ERROR_LOCATION_UNAVAILABLE').subscribe(res => this.showToast(res));
      });

    } else {
      this.params.location = null;
      this.loadData();
    }
  }

}
