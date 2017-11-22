import {IonicPage} from 'ionic-angular';
import {Component, Injector} from '@angular/core';
import {BasePage} from '../base-page/base-page';
// import {AppConfig} from '../../app/app.config';
import {Place} from '../../providers/place-service';
import {Preference} from '../../providers/preference';
import {Category} from '../../providers/categories';
import {Geolocation, GeolocationOptions} from '@ionic-native/geolocation';
// import { AdMobFree, AdMobFreeBannerConfig } from '@ionic-native/admob-free';
import {AdMobFree} from '@ionic-native/admob-free';
import {LocalStorage} from '../../providers/local-storage';
import {ChangeDetectorRef} from '@angular/core';
import {Platform, Events} from 'ionic-angular';

import {MapStyle} from '../../providers/map-style';
import {
  CameraPosition, GoogleMap, GoogleMapsEvent,
  LatLng, LatLngBounds, Geocoder, GeocoderRequest,
  GeocoderResult, Marker, ILatLng
} from '@ionic-native/google-maps';

@IonicPage()
@Component({
  selector: 'page-places',
  templateUrl: 'places.html'
})
export class PlacesPage extends BasePage {

  params: any = {};
  places: Place[];
  category: Category;
  api: any;
  lang: any;
  map: GoogleMap;
  isViewLoaded: boolean;
  nearAudio: any[];
  waypoints:any=[];

  constructor(injector: Injector,
              private storage: LocalStorage,
              private geolocation: Geolocation,
              private admobFree: AdMobFree,
              private preference: Preference,
              private events: Events,
              private platform: Platform,
              private cdr: ChangeDetectorRef) {
    super(injector);

    this.events.subscribe('onMenuOpened', (e) => {
      if (this.map) {
        this.map.setClickable(false);
      }
    });

    this.events.subscribe('onMenuClosed', (e) => {
      if (this.map) {
        this.map.setClickable(true);
      }
    });

    this.params.category = this.navParams.data;
    this.params.filter = 'nearby';
    this.params.unit = this.preference.unit;
    this.places = [];
    // this.showLoadingView();
    // this.onReload();
    // this.prepareAd();
  }

  //=============Map Start==================
  // onPlayerReady(api) {
  //   this.api = api;
  //   this.api.getDefaultMedia().subscriptions.canPlay.subscribe(
  //     () => {
  //       this.api.play();
  //     });
  // }

  enableMenuSwipe() {
    return true;
  }

  ionViewDidLeave() {
    this.isViewLoaded = false;
  }

  ionViewWillEnter() {
    this.onReload();
    this.isViewLoaded = true;

    if (this.platform.is('cordova')) {

      this.showLoadingView();
      this.map = new GoogleMap('map', {
        styles: MapStyle.dark()
      });

      this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
        this.storage.unit.then(unit => {

          this.params.unit = unit;
          const options: GeolocationOptions = {
            enableHighAccuracy: true,
            timeout: 7000
          };

          this.geolocation.getCurrentPosition(options).then(pos => {

            this.params.location = pos.coords;
            this.loadData();
          }, error => {
            this.translate.get('ERROR_LOCATION_UNAVAILABLE').subscribe(str => this.showToast(str));
            this.showErrorView();
          });
          // Options: throw an error if no update is received every 30 seconds.
          this.geolocation.watchPosition({
            maximumAge: 3000,
            timeout: 3000,
            enableHighAccuracy: true
          }).filter((p) => p.coords !== undefined).subscribe(position => {

            let paramsClone = {...this.params};
            this.storage.radius.then((val) => {
              paramsClone.distance = val;
              paramsClone.location = position.coords;

              Place.loadNearPlace(paramsClone).then(place => {
                if (place && place[0]) {
                  let myDistance = place[0].distance(paramsClone.location, 'none');
                  let radius = place[0].attributes.radius;

                  if (myDistance <= radius) {
                    if (this.nearAudio[0] != place[0].audio_ru.url()) {
                      this.nearAudio = [place[0].audio_ru.url()];
                      this.api.getDefaultMedia().loadMedia();
                    }
                  }
                }
              });
            });
          });
        });
      });

      this.storage.mapStyle.then(mapStyle => {
        this.map.setMapTypeId(mapStyle);
      });

      this.map.on(GoogleMapsEvent.MY_LOCATION_BUTTON_CLICK).subscribe((map: GoogleMap) => {
        if (this.isViewLoaded) {
          let position: CameraPosition<ILatLng> = this.map.getCameraPosition();
          let target: ILatLng = position.target;

          this.params.location = {
            latitude: target.lat,
            longitude: target.lng
          };
          this.showLoadingView();
          this.onReload();

        }
      });

      this.map.setMyLocationEnabled(true);

    } else {
      this.showLoadingView();
      this.loadData();
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', {place:place, places:this.places});
  }

  onSearchAddress(event: any) {
    if (this.platform.is('cordova')) {

      let query = event.target.value;

      let request: GeocoderRequest = {
        address: query
      };

      let geocoder = new Geocoder;
      geocoder.geocode(request).then((results: GeocoderResult) => {

        let target: LatLng = new LatLng(
          results[0].position.lat,
          results[0].position.lng
        );
        let position: CameraPosition<ILatLng> = {
          target: target,
          zoom: 18,
          tilt: 30
        };

        this.map.moveCamera(position);

        this.params.location = {
          latitude: target.lat,
          longitude: target.lng
        };
        this.showLoadingView();
        this.onReload();
      });
    } else {
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

  loadData() {
    // let paramsClone = { ...this.params };
    // // paramsClone.distance = 0.5;
    // this.storage.radius.then((val) => {
    //   paramsClone.distance = val;
    //   Place.loadNearPlace(paramsClone).then(place => {
    //     if (place && place[0]) {
    //       let myDistance = place[0].distance(this.params.location, 'none');
    //       let radius = place[0].attributes.radius;
    //
    //       if (myDistance <= radius) {
    //         this.nearAudio = [place[0].audio_ru.url()];
    //       }
    //     }
    //   });
    // });

  //============= Add waypoints ==================
    this.waypoints = [];
    let coordinates = [];
    if (this.params.category.waypoints && this.params.category.waypoints !== "") {
      if(this.params.category.waypoints.indexOf('/') != -1){
        coordinates= this.params.category.waypoints.split('/');
        coordinates.forEach(data => {
          let loc = data.split(",");
          let lat = parseFloat(loc[0]);
          let lng = parseFloat(loc[1]);
          this.waypoints.push(<LatLng>{"lat":lat,"lng":lng});
        });
      }
      this.map.addPolyline({
        points: this.waypoints,
        'color' : '#C401FF',
        'width': 4,
        'geodesic': true
      });
    }
    //=============End waypoints==================

    this.storage.lang.then((val) => {
      this.lang = val;
      this.nearAudio = [];
      Place.load(this.params).then(data => {

        if(this.lang == "ru"){
          this.nearAudio = [data[0].audio_ru.url()];
        }else{
          this.nearAudio = [data[0].audio_en.url()];
        }
        if (this.platform.is('cordova')) {
          this.onPlacesLoaded(data);
        }
        for (let place of data) {
          this.places.push(place);
        }

         // this.onRefreshComplete(data);

        if (this.places.length) {
          this.showContentView();
        } else {
          this.showEmptyView();
        }

      }, error => {
        // this.onRefreshComplete();
        this.showErrorView();
      });
    });

  }

  onPlacesLoaded(places) {

    let points: Array<LatLng> = [];

    for (let place of places) {
      let target: LatLng = new LatLng(
        place.location.latitude,
        place.location.longitude
      );

      let icon = (place.category && place.category.get('icon')) ? {
        url: place.category.get('icon').url(),
        size: {
          width: 32,
          height: 32
        }
      } : 'yellow';

      this.storage.lang.then((val) => {
        this.lang = val;
        let markerOptions = {
          position: target,
          title: place['title_'+this.lang],
          snippet: place['description_'+this.lang],
          icon: icon,
          place: place,
          styles: {
            maxWidth: '80%'
          },
        };

        this.map.addMarker(markerOptions).then((marker: Marker) => {
          marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {

            let marker = e[1];
            let place = marker.get("place");
            this.goToPlace(place);
          });
          // marker.showInfoWindow();
        });
      });
      points.push(target);
    }

    if (points.length) {
      this.map.moveCamera({
        target: new LatLngBounds(points),
        zoom: 10
      });
    }
  }

  // onReload() {
  //   this.map.clear();
  //   this.places = [];
  //   this.loadData();
  // }
  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  //===========Map End==================


  //----------function Autoplay in player videogular2--------
  //   onPlayerReady(api) {
  //     this.api=api;
  //     this.api.getDefaultMedia().subscriptions.canPlay.subscribe(
  //       () => {
  //           // this.api.play();
  //       }
  //   );
  // }
  // enableMenuSwipe() {
  //   return false;
  // }

  // prepareAd() {
  //
  //   if (AppConfig.BANNER_ID) {
  //     const bannerConfig: AdMobFreeBannerConfig = {
  //       id: AppConfig.BANNER_ID,
  //       isTesting: false,
  //       autoShow: true
  //     };
  //
  //     this.admobFree.banner.config(bannerConfig);
  //
  //     this.admobFree.banner.prepare().then(() => {
  //       // banner Ad is ready
  //       // if we set autoShow to false, then we will need to call the show method here
  //     }).catch(e => console.log(e));
  //   }
  // }

  // goToPlace(place) {
  //   this.navigateTo('PlaceDetailPage', place);
  // }

  // loadData() {
  //
  //   Place.load(this.params).then(data => {
  //     // this.audio = data[0].audio.url();
  //
  //     for (let place of data) {
  //       this.places.push(place);
  //     }
  //
  //     this.onRefreshComplete(data);
  //
  //     if (this.places.length) {
  //       this.showContentView();
  //     } else {
  //       this.showEmptyView();
  //     }
  //
  //   }, error => {
  //     this.onRefreshComplete();
  //     this.showErrorView();
  //   });
  // }

  // onFilter(filter) {
  //   this.params.filter = filter;
  //   this.showLoadingView();
  //   this.onReload();
  // }
  //
  // onLoadMore(infiniteScroll) {
  //   this.infiniteScroll = infiniteScroll;
  //   this.params.page++;
  //   this.loadData();
  // }

  onReload(refresher = null) {
    this.map && this.map.clear();
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
        // this.loadData();
      }, error => {
        this.showErrorView();
        this.translate.get('ERROR_LOCATION_UNAVAILABLE').subscribe(res => this.showToast(res));
      });

    } else {
      this.params.location = null;
       // this.loadData();
    }
  }

}
