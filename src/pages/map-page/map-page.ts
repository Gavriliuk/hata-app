import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { Platform, Events } from 'ionic-angular';
import { Place } from '../../providers/place-service';
import { MapStyle } from '../../providers/map-style';
import { BasePage } from '../base-page/base-page';
import { LocalStorage } from '../../providers/local-storage';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { CameraPosition, GoogleMap, GoogleMapsEvent,
  LatLng, LatLngBounds, Geocoder, GeocoderRequest,
  GeocoderResult, Marker } from '@ionic-native/google-maps';

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

  constructor(public injector: Injector,
    private events: Events,
    private storage: LocalStorage,
    private geolocation: Geolocation,
    private platform: Platform) {

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
  }

  enableMenuSwipe() {
    return true;
  }

  ionViewWillUnload() {

    this.isViewLoaded = false;

    if (this.map) {
      this.map.clear();
      this.map.setZoom(1);
      this.map.setCenter(new LatLng(0, 0));
    }
  }

  ionViewDidLoad() {

    this.isViewLoaded = true;

    if (this.platform.is('cordova')) {

      this.showLoadingView();

      this.map = new GoogleMap('map', {
        styles: MapStyle.dark(),
        backgroundColor: '#333333'
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
      
        });
      });

      this.storage.mapStyle.then(mapStyle => {
        this.map.setMapTypeId(mapStyle);
      });

      this.map.on(GoogleMapsEvent.MY_LOCATION_BUTTON_CLICK).subscribe((map: GoogleMap) => {

        if (this.isViewLoaded) {

          this.map.getCameraPosition().then((camera: CameraPosition) => {

            let target: LatLng = <LatLng> camera.target;

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

        let position: CameraPosition = {
          target: target,
          zoom: 10
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

    for(let place of places) {

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

  onSearchButtonTapped() {

    if (this.platform.is('cordova')) {
      this.map.getCameraPosition().then(camera => {
        let position:LatLng = <LatLng> camera.target;

        this.params.location = {
          latitude: position.lat,
          longitude: position.lng
        };
        this.showLoadingView();
        this.onReload();
      });
    } else {
      console.warn('Native: tried calling GoogleMaps.getCameraPosition, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

}
