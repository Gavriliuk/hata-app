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
import {Category} from '../../providers/categories';

// import {GoogleMaps,GoogleMap,GoogleMapsEvent,
//         CameraPosition,GeocoderResult,Polyline,PolylineOptions,LatLng,
//         LatLngBounds, Geocoder, GeocoderRequest,MarkerOptions,Marker
// } from '@ionic-native/google-maps';
import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  // GoogleMapOptions,
  CameraPosition,
  // MarkerOptions,
  // Marker,
  LatLngBounds,
  // Circle,
  LatLng, ILatLng,
  // GeocoderRequest,
  // Geocoder,
  // GeocoderResult
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
  nearAudio: any[];
  api: any;
  lang: any;
  category: Category;
  place:any;
  waypoints:any=[];
  start:any;
  end:any;
  categories:any;
  colorLine= '#c401ff';

  constructor(public injector: Injector,
              private googleMaps: GoogleMaps,
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

    this.storage.lang.then((val) => {
      this.lang = val;
      console.log("LanguageMap: ", val);
    });

    //----
    this.isViewLoaded = true;

        if (this.platform.is('cordova')) {
          console.log("Init cordova");

          this.showLoadingView();
          this.map = new GoogleMap('map', {
            styles: MapStyle.dark()
          });


          this.map.one(GoogleMapsEvent.MAP_READY).then(() => {

            this.map.setMyLocationEnabled(true);
            console.log("Init Gmap");

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
              this.onMove();
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
          console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
        }
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

  ionViewDidLoad() {

  }
  onMove() {
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
            let audioURL = place[0]['audio_' + this.lang].url();
            if (this.nearAudio[0] != audioURL && myDistance <= radius) {
              this.nearAudio = [audioURL];
              this.api.getDefaultMedia().loadMedia();
            }
          }
        });
      });
    });
  }
  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', place);
  }

  // onSearchAddress(event: any) {
  //   if (this.platform.is('cordova')) {
  //     let query = event.target.value;
  //     let request: GeocoderRequest = {
  //       address: query
  //     };
  //     let geocoder = new Geocoder;
  //     geocoder.geocode(request).then((results: GeocoderResult) => {
  //
  //       let target: LatLng = new LatLng(
  //         results[0].position.lat,
  //         results[0].position.lng
  //       );
  //       let position: CameraPosition<ILatLng> = {
  //         target: target,
  //         zoom: 18,
  //         tilt: 30
  //       };
  //
  //       this.map.moveCamera(position);
  //
  //       this.params.location = {
  //         latitude: target.lat,
  //         longitude: target.lng
  //       };
  //       this.showLoadingView();
  //       this.onReload();
  //     });
  //   } else {
  //     console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
  //   }
  // }

  loadData() {
    let paramsClone = {...this.params};
    this.storage.radius.then((val) => {
      paramsClone.distance = val;
      Place.loadNearPlace(paramsClone).then(place => {
        if (place && place[0]) {
          let myDistance = place[0].distance(this.params.location, 'none');
          let radius = place[0].radius;
          // let radius = place[0].attributes.radius;
          if (myDistance <= radius) {
            this.storage.lang.then((val) => {
              this.lang = val;
              this.nearAudio = [];
              if (this.lang == "ru") {
                this.nearAudio = [place[0].audio_ru.url()];
              } else if(this.lang == "ro"){
                this.nearAudio = [place[0].audio_ro.url()];
              }else{
                this.nearAudio = [place[0].audio_en.url()];
              }
            })
          }
        }
      });
    });

    Category.load().then(data => {
      let num = 1;
      data.forEach(category => {
        num++;
        if(num ==3){
          // let color1 = '#fff72'+num;
          // this.colorLine = color1;
          this.colorLine = '#8eff90';
        }else if(num ==4){
          this.colorLine = '#cfff85';
        }
        this.waypoints = [];
        let coordinates = [];
        if (category.waypoints && category.waypoints !== "") {
          if(category.waypoints.indexOf('/') != -1){
            coordinates= category.waypoints.split('/');
            coordinates.forEach(data => {
              let loc = data.split(",");
              let lat = parseFloat(loc[0]);
              let lng = parseFloat(loc[1]);
              this.waypoints.push(<LatLng>{"lat":lat,"lng":lng});
            });
          }
          this.map.addPolyline({
            points: this.waypoints,
            'color' : this.colorLine,
            'width': 4,
            'geodesic': true
          });
        }
      })
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

      this.storage.lang.then((val) => {
        this.lang = val;

        let markerOptions = {
          position: target,
          draggable: true,
          title: place['title_'+this.lang],
          snippet: place['description_'+this.lang],
          animation:'NodeFX',
          icon: icon,
          place: place,
          places: places,
          styles: {
            maxWidth: '80%'
          },
        };

        this.map.addMarker(markerOptions).then((marker) => {
          marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {
            let marker = e[1];
            let place = marker.get("place");
            let places = marker.get("places");
            this.goToPlace({"place":place,"places":places});
          });

          this.map.addCircle({
            center: marker.getPosition(),
            radius: place.radius*1000,
            fillColor: "rgba(0, 0, 255, 0.1)",
            strokeColor: "rgba(0, 0, 255, 0.75)",
            strokeWidth: 1
          });

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

  onReload() {
    this.map.clear();
    this.places = [];
    this.loadData();
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  // onSearchButtonTapped() {
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
