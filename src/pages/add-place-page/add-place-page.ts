import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { ActionSheetController, Platform, Events } from 'ionic-angular';
import { BasePage } from '../base-page/base-page';
import { Place } from '../../providers/place-service';
import { MapStyle } from '../../providers/map-style';
import { ParseFile } from '../../providers/parse-file-service';
import { Category } from '../../providers/categories';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { CameraPosition, GoogleMap, GoogleMaps, GoogleMapsEvent, Marker,
  MarkerOptions, LatLng, Geocoder, GeocoderRequest, GeocoderResult } from '@ionic-native/google-maps';

@IonicPage()
@Component({
  selector: 'page-add-place-page',
  templateUrl: 'add-place-page.html'
})
export class AddPlacePage extends BasePage {

  form: FormGroup;
  categories: any;
  private map: GoogleMap;
  private marker: Marker;
  trans: any;
  isViewLoaded: boolean;

  constructor(injector: Injector,
    private formBuilder: FormBuilder,
    private platform: Platform,
    private place: Place,
    private googleMaps: GoogleMaps,
    private camera: Camera,
    private events: Events,
    private actionSheetCtrl: ActionSheetController) {

    super(injector);

    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      category: new FormControl('', Validators.required),
      description: new FormControl(''),
      address: new FormControl(''),
      phone: new FormControl(''),
      website: new FormControl('http://')
    });

    let trans = ['PROFILE_UPDATED', 'PROFILE_UPDATE_ERROR', 'CAMERA', 'CANCEL',
      'CHOOSE_AN_OPTION', 'PHOTO_LIBRARY', 'FILE_UPLOADED', 'ERROR_FILE_UPLOAD'];

    this.translate.get(trans).subscribe(values => {
      this.trans = values;
    });

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

    Category.load().then(categories => {
      this.categories = categories;
    });

    if (this.platform.is('cordova')) {

      this.map = new GoogleMap('map_add', {
        styles: MapStyle.dark(),
        backgroundColor: '#333333'
      });

      let markerOptions: MarkerOptions = {
        position: new LatLng(0, 0),
        icon: 'yellow'
      };

      this.map.addMarker(markerOptions).then((marker: Marker) => {
        this.marker = marker;
      });

      this.map.one(GoogleMapsEvent.MAP_READY);
      this.map.setMyLocationEnabled(true);

      this.map.on(GoogleMapsEvent.MY_LOCATION_BUTTON_CLICK).subscribe((map: GoogleMap) => {

        if (this.isViewLoaded) {

          this.map.getCameraPosition().then((camera: CameraPosition) => {

            let target: LatLng = <LatLng> camera.target;
            this.marker.setPosition(target);
          });
        }

      });

      this.map.on(GoogleMapsEvent.CAMERA_CHANGE).subscribe(camera => {
        this.marker.setPosition(camera.target);
      });
    }
  }

  onSearchAddress(event: any) {

    let query = event.target.value;

    let request: GeocoderRequest = {
      address: query
    };

    let geocoder = new Geocoder;
    geocoder.geocode(request).then((results: GeocoderResult) => {

      // create LatLng object
      let target: LatLng = new LatLng(
        results[0].position.lat,
        results[0].position.lng
      );

      // create CameraPosition
      let position: CameraPosition = {
        target: target,
        zoom: 10
      };

      // move the map camera to position
      this.map.moveCamera(position);

      // update marker position
      this.marker.setPosition(target);
    });
  }

  chooseImage(sourceType: number) {

    let options: CameraOptions = {
      sourceType: sourceType,
      destinationType: this.camera.DestinationType.DATA_URL,
      targetWidth: 1000,
      targetHeight: 1000,
      quality: 80,
    }
    this.camera.getPicture(options).then((imageData) => {

      this.showLoadingView();

      ParseFile.upload(imageData).then(file => {
        this.place.image = file;
        this.showContentView();
        this.showToast(this.trans.FILE_UPLOADED);
      }, error => {
        this.showContentView();
        this.showToast(this.trans.ERROR_FILE_UPLOAD);
      })
    });
  }

  onUpload() {

    let actionSheet = this.actionSheetCtrl.create({
      title: this.trans.CHOOSE_AN_OPTION,
      buttons: [{
        text: this.trans.PHOTO_LIBRARY,
        handler: () => {
          this.chooseImage(this.camera.PictureSourceType.PHOTOLIBRARY);
        }
      }, {
        text: this.trans.CAMERA,
        handler: () => {
          this.chooseImage(this.camera.PictureSourceType.CAMERA);
        }
      },{
        text: this.trans.CANCEL,
        role: 'cancel'
      }]
    });
    actionSheet.present();
  }

  onSubmit() {

    this.place.title = this.form.value.name;
    this.place.category = this.form.value.category;
    this.place.description = this.form.value.description;
    this.place.address = this.form.value.address;
    this.place.website = this.form.value.website;
    this.place.phone = this.form.value.phone;

    this.showLoadingView();

    this.marker.getPosition().then(position => {

      this.place.location = position;

      this.place.save().then(place => {
        this.showContentView();
        this.translate.get('PLACE_ADDED').subscribe(str => this.showToast(str));
      }, error => {
        this.showContentView();
        this.translate.get('ERROR_PLACE_ADD').subscribe(str => this.showToast(str));
      });
    });

  }

}
