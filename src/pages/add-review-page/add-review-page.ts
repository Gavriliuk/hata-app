import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { ViewController } from 'ionic-angular';
// import { Review } from '../../providers/review-service';
import { BasePage } from '../base-page/base-page';
import {LocalStorage} from '../../providers/local-storage';

@IonicPage()
@Component({
  selector: 'page-add-review-page',
  templateUrl: 'add-review-page.html'
})
export class AddReviewPage extends BasePage {
    routeModal: any = [];
    review: any = {};
    markers: any;
    waypoints:any;
    mapZoom:any;
    lang:any;
    route: any;
    placeMarkers:any;
    routePlaces: any =[];
  constructor(injector: Injector,
              private viewCtrl: ViewController,
              private storage: LocalStorage) {
    super(injector);
    this.storage.lang.then((val) => {
        this.lang = val;
        this.routeModal = this.navParams.data.route;
        this.routePlaces = this.navParams.data.places;
      this.route = this.navParams.data.route;
    console.log("Route",this.routeModal);
       let zoom: any;
       let coordinates = [];
       this.waypoints = "";
       this.mapZoom = 17;
       if (this.routeModal.waypoints && this.routeModal.waypoints !== "") {
          if(this.routeModal.waypoints.indexOf('/') != -1){
            coordinates = this.routeModal.waypoints.split('/');
            zoom = coordinates.length;
            if(zoom >= 10 ){
              this.mapZoom = 15;
            }else if(zoom >= 15){
              this.mapZoom = 14;
            }
            coordinates.forEach(data => {
              this.waypoints += "%7C" + data;
            })
          }else{
            this.waypoints = "%7C"+this.routeModal.waypoints;
          }
       }
       this.markers = "";
       this.placeMarkers = {};
       this.routePlaces.forEach(place => {
         if (place) {
            this.markers += "&markers=size:mid%7Ccolor:0xff0000%7C" + place.location.latitude + "," + place.location.longitude;
         }
       });
    });

  }

  enableMenuSwipe() {
    return false;
  }

  ionViewDidLoad() {
  }

  onDismiss() {
    this.viewCtrl.dismiss();
  }
}

