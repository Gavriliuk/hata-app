import {IonicPage} from 'ionic-angular';
import {Component, Injector} from '@angular/core';
import {Platform, Events} from 'ionic-angular';
import {Place} from '../../providers/place-service';
import {MapStyle} from '../../providers/map-style';
import {BasePage} from '../base-page/base-page';
import {LocalStorage} from '../../providers/local-storage';
import {Geolocation, GeolocationOptions} from '@ionic-native/geolocation';
import {ChangeDetectorRef} from '@angular/core';
import 'rxjs/add/operator/filter'

import {
  CameraPosition, GoogleMap, GoogleMapsEvent,
  LatLng, LatLngBounds, Geocoder, GeocoderRequest,
  GeocoderResult, Marker
} from '@ionic-native/google-maps';

@IonicPage()
@Component({
  selector: 'page-map-page',
  templateUrl: 'map-page.html'
})
export class MapPage extends BasePage {

  params: any = {};
  places: Place[];
  map: GoogleMap;
  isViewLoaded: boolean;

  audio: any;
  nearPlaces: Place[];
  nearAudio: any[];
  api: any;
  lang: any;

  constructor(public injector: Injector,
              private events: Events,
              private storage: LocalStorage,
              private geolocation: Geolocation,
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

    // Place.load(this.params).then(places => {
    //   this.nearPlaces = places;
    //   this.nearAudio = [this.nearPlaces[0].audio.url()];
    //   this.api.getDefaultMedia().loadMedia();
    // });

    this.storage.lang.then((val) => {
      this.lang = val;
      console.log("LanguageMap: ", val);
    });
  }

  onPlayerReady(api) {
    this.api = api;
    this.api.getDefaultMedia().subscriptions.canPlay.subscribe(
      () => {
        this.api.play();
      }
    );
  }

  enableMenuSwipe() {
    return true;
  }

  ionViewDidLeave() {

    this.isViewLoaded = false;

    // if (this.map) {
    //   this.map.clear();
    //   this.map.setZoom(0.5);
    //   this.map.setCenter(new LatLng(0, 0));
    // }
  }

  ionViewWillEnter() {
    this.isViewLoaded = true;

    if (this.platform.is('cordova')) {

      this.showLoadingView();

      this.map = new GoogleMap('map', {
        styles: MapStyle.dark(),
        backgroundColor: '#333333'
      });

      this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
        // let HND_AIR_PORT = new LatLng(47.025554,28.8304086);
        // let SFO_AIR_PORT = new LatLng(47.025829,28.830839);
        const HND_AIR_PORT = <LatLng>{"lat": 47.025554, "lng": 28.8304086};
        const SFO_AIR_PORT = <LatLng>{"lat": 47.025829, "lng": 28.830839};
        // this.map.addEventListener(plugin.google.maps.event.MAP_READY, function() {
        // this.map.addCircle({
        //     'center': <LatLng>{"lat": 47.025554, "lng": 28.8304086}, 'radius': 30,
        //     'strokeColor': '#AA00FF',
        //     'strokeWidth': 5,
        //     'fillColor': '#880000'
        //   });

        this.map.addPolyline({
          'points': [
            HND_AIR_PORT,
            SFO_AIR_PORT
          ]}
        );
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
            // paramsClone.distance = 0.02;
            this.storage.radius.then((val) => {
              paramsClone.distance = val;
              console.log("Distance:", val);
              paramsClone.location = position.coords;

              Place.loadNearPlace(paramsClone).then(place => {
                if (place && place[0]) {
                  let myDistance = place[0].distance(paramsClone.location, 'none');
                  let radius = place[0].attributes.radius;

                  if (myDistance <= radius) {
                    if (this.nearAudio[0] != place[0].audio.url()) {
                      this.storage.lang.then((val) => {
                        this.lang = val;
                        this.nearAudio = [];
                        if (this.lang == "ru") {
                          this.nearAudio = [place[0].audio_ru.url()];
                        } else {
                          this.nearAudio = [place[0].audio_en.url()];
                        }
                      });
                      // this.nearAudio = [place[0].audio.url()];
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

          this.map.getCameraPosition().then((camera: CameraPosition) => {

            let target: LatLng = <LatLng>camera.target;

            this.params.location = {
              latitude: target.lat,
              longitude: target.lng
            };

            this.showLoadingView();
            this.onReload();
          });
        }
      });

      this.map.setMyLocationEnabled(true);
      // let HND_AIR_PORT = new LatLng(35.548852, 139.784086);
      // let SFO_AIR_PORT = new LatLng(37.615223, -122.389979);
      // let HNL_AIR_PORT = new LatLng(21.324513, -157.925074);
      // let AIR_PORTS1 = [
      //   HND_AIR_PORT,SFO_AIR_PORT,HNL_AIR_PORT
      //
      // ];
      // this.map.addPolyline({
      //   points: AIR_PORTS1,
      //   'color' : '#AA00FF',
      //   'width': 10,
      //   'geodesic': true
      // });

      // });
    } else {
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', place);
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
        // code
        let position: CameraPosition = {
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
    let paramsClone = {...this.params};
    // paramsClone.distance = 0.5;
    this.storage.radius.then((val) => {
      paramsClone.distance = val;
      Place.loadNearPlace(paramsClone).then(place => {
        if (place && place[0]) {
          let myDistance = place[0].distance(this.params.location, 'none');
          let radius = place[0].attributes.radius;
          if (myDistance <= radius) {
            this.storage.lang.then((val) => {
              this.lang = val;
              this.nearAudio = [];
              if (this.lang == "ru") {
                this.nearAudio = [place[0].audio_ru.url()];
              } else {
                this.nearAudio = [place[0].audio_en.url()];
              }
            })
          }
        }
      });
    });

    Place.load(this.params).then(places => {
      this.onPlacesLoaded(places);
      this.showContentView();

      if (!places.length) {
        this.translate.get('EMPTY_PLACES').subscribe(str => this.showToast(str));
      }
    }, error => {
      this.translate.get('ERROR_PLACES').subscribe(str => this.showToast(str));
      this.showErrorView();
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

      let markerOptions = {
        position: target,
        title: place.title,
        snippet: place.description,
        icon: icon,
        place: place,
        styles: {
          maxWidth: '80%'
        },
      };

      this.map.addMarker(markerOptions).then((marker: Marker) => {

        marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {
          this.goToPlace(e.get('place'));
        });
        // marker.showInfoWindow();
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

  onReload() {
    this.map.clear();
    this.places = [];
    this.loadData();
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  // onSearchButtonTapped() {
  //
  //   if (this.platform.is('cordova')) {
  //     this.map.getCameraPosition().then(camera => {
  //       let position: LatLng = <LatLng>camera.target;
  //
  //       this.params.location = {
  //         latitude: position.lat,
  //         longitude: position.lng
  //       };
  //       this.showLoadingView();
  //       this.onReload();
  //     });
  //   } else {
  //     console.warn('Native: tried calling GoogleMaps.getCameraPosition, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
  //   }
  // }


}
