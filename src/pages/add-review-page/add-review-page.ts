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
    route: any = [];
    review: any = {};
    markers: any;
    waypoints:any;
    zoom:any;
    lang:any;
    placeMarkers:any;
  constructor(injector: Injector,
              private viewCtrl: ViewController,
              private storage: LocalStorage) {
    super(injector);
    this.storage.lang.then((val) => {
        this.lang = val;
        this.route = this.navParams.data;
    console.log("Route",this.route);
       let mapZoom: any;
       let coordinates = [];
       this.waypoints = "";
       this.zoom = 15;
       if (this.route.waypoints && this.route.waypoints !== "") {
          if(this.route.waypoints.indexOf('/') != -1){
            coordinates = this.route.waypoints.split('/');
            mapZoom = coordinates.length;
            if(mapZoom >= 15 ){
              this.zoom = 14;
            }
            coordinates.forEach(data => {
              this.waypoints += "%7C" + data;
            })
          }else{
            this.waypoints = "%7C"+this.route.waypoints;
          }
       }
       this.markers = "";
       this.placeMarkers = {};
       this.route.places.forEach(place => {
         let routeTitle = place.category["title_"+this.lang];
         if (this.route.title == routeTitle) {
            this.markers += "&markers=size:mid%7Ccolor:0xff8f2e%7C" + place.location.latitude + "," + place.location.longitude;
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

//==========================
//   review: any = {
//     rating: 3,
//     comment: ''
//   };
//
//   constructor(injector: Injector, private viewCtrl: ViewController) {
//     super(injector);
//     this.review.place = this.navParams.get('place');
//   }
//
//   enableMenuSwipe() {
//     return false;
//   }
//
//   ionViewDidLoad() {
//   }
//
//   onSubmit() {
//
//     this.showLoadingView();
//
//     Review.create(this.review).then(review => {
//       this.showContentView();
//       this.onDismiss();
//       this.translate.get('REVIEW_ADDED').subscribe(str => this.showToast(str));
//     }, error => {
//       this.showErrorView();
//       this.translate.get('ERROR_REVIEW_ADD').subscribe(str => this.showToast(str));
//     });
//   }
//
//   onDismiss() {
//     this.viewCtrl.dismiss();
//   }
//
//==========================

