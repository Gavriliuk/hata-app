import {IonicPage} from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { Events, ModalController} from 'ionic-angular';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Route } from '../../providers/parse-models/routes';
import { BasePage } from '../base-page/base-page';
import { User } from '../../providers/parse-models/user-service';
import {LocalStorage} from '../../providers/local-storage';
import {Place} from '../../providers/parse-models/place-service';

@IonicPage()
@Component({
  selector: 'page-routes',
  templateUrl: 'routes.html'
})
export class RoutesPage extends BasePage {
  private routes: Array<Route>;
  place: Place;
  places: Place[];
  lang: any;
  audio: any[];
  audio_ru: any;
  audio_ro: any;
  audio_en: any;
  routePlaces:any=[];
  constructor(injector: Injector,
              private storage: LocalStorage,
              private events: Events,
              private locationAccuracy: LocationAccuracy,
              private diagnostic: Diagnostic,
              public modalCtrl: ModalController) {
    super(injector);




    // Place.load(this.navParams).then(places => {
    //   this.places = places;
    // });

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

  goToPlaces(route) {
    this.navigateTo('PlacesPage', route);
console.log("GoToPlaces(route): ",route);
  }

  loadData() {
    Route.load().then(data => {
      this.routes = data;

      if (this.routes.length) {
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



  openModalAddReviewRoute(route) {

    Route.getPlacesRelation(route).then(data => {
      this.routePlaces = data;
      let modal = this.modalCtrl.create('AddReviewPage', {route:route, places: this.routePlaces});
      modal.present();

  }, error => {
    this.showErrorView();
  });

  }

  // openModalAddReviewRoute(title, information, center_map, waypoints, start_route, end_route) {
  //   let modal = this.modalCtrl.create('AddReviewPage', {title, information, center_map,start_route, end_route, waypoints, places: this.places});
  //   modal.present();
  // }


}
