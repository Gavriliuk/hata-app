import {IonicPage} from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { Events, ModalController} from 'ionic-angular';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Category } from '../../providers/categories';
import { BasePage } from '../base-page/base-page';
import { User } from '../../providers/user-service';
import {LocalStorage} from '../../providers/local-storage';
import {Place} from '../../providers/place-service';

@IonicPage()
@Component({
  selector: 'page-categories',
  templateUrl: 'categories.html'
})
export class CategoriesPage extends BasePage {
  private categories: Array<Category>;
  place: Place;
  places: Place[];
  lang: any;
  audio: any[];
  audio_ru: any;
  audio_ro: any;
  audio_en: any;

  constructor(injector: Injector,
              private storage: LocalStorage,
              private events: Events,
              private locationAccuracy: LocationAccuracy,
              private diagnostic: Diagnostic,
              public modalCtrl: ModalController) {
    super(injector);

    Place.load(this.navParams).then(places => {
      this.places = places;
    });

    this.locationAccuracy.canRequest().then((canRequest: boolean) => {

      if (canRequest) {

        let priority = this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY;

        this.locationAccuracy.request(priority)
          .then(() => console.log('Request successful'))
          .catch((error) => {

            if (error && error.code !== this.locationAccuracy.ERROR_USER_DISAGREED) {
              this.translate.get('ERROR_LOCATION_MODE').subscribe((res: string) => {
                this.showConfirm(res).then(() => this.diagnostic.switchToLocationSettings());
              });
            }

          });
      }
    }).catch((err) => console.log(err));

    this.storage.lang.then((val) => {
      this.lang = val;
    });
  }

  enableMenuSwipe() {
    return true;
  }

  ionViewDidLoad() {
    // this.showLoadingView();
    this.loadData();
  }

  goToPlaces(category) {
    this.navigateTo('PlacesPage', category);
console.log("GoToPlaces(category): ",category);
  }

  loadData() {
    Category.load().then(data => {
      this.categories = data;

      if (this.categories.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

      this.onRefreshComplete();

    }, error => {

      if (error.code === 209) {
        User.logOut().then(
          res => this.events.publish('user:logout')),
          err => console.log(err);
      }

      this.showErrorView();
      this.onRefreshComplete();
    });
  }

  onReload(refresher) {
    this.refresher = refresher;
    this.loadData();
  }

  openModalAddReviewRoute(title, information, center_map, waypoints, start_route, end_route) {
    let modal = this.modalCtrl.create('AddReviewPage', {title, information, center_map,start_route, end_route, waypoints, places: this.places});
    modal.present();
  }
}
