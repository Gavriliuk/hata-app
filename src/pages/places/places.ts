import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { BasePage } from '../base-page/base-page';
import { Place } from '../../providers/place-service';
import { Preference } from '../../providers/preference';
import { Route } from '../../providers/routes';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { LocalStorage } from '../../providers/local-storage';
import { ChangeDetectorRef } from '@angular/core';
import { Platform, Events, Slides } from 'ionic-angular';

import { Story } from '../../providers/stories';
import Parse from 'parse';

import { MapStyle } from '../../providers/map-style';
import {
  GoogleMapsEvent, CameraPosition, GoogleMap,
  LatLng, LatLngBounds, Marker
} from '@ionic-native/google-maps';
import { ViewChild } from '@angular/core';
import { AlertController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-places',
  templateUrl: 'places.html'
})
export class PlacesPage extends BasePage {
  @ViewChild(Slides) slides: Slides;

  params: any = {};
  places: any = [];
  allMarkers: any[];
  route: Route;

  lang: any;
  map: GoogleMap;
  mapStyle: any;
  unit: any;
  radius: any;
  isViewLoaded: boolean;

  videogularApi: any;
  playBackValues: any[] = [1, 1.5, 2, 3, 4];
  playBackRateIndex: any = 0;
  listeningPOI: Place;
  currentAudio: any = { 'src': null, 'title': null, 'type': null };
  nearAudio: any[];
  playMode: any;

  formatedStories: any = { 'ro': [], 'ru': [], 'en': [] };
  allDatabaseStories: any = [];
  listenedStoryIndex: any = 0;
  routeDatabasePlaces: any = [];
  routeDatabaseStories: any = [];
  storiesRelation: any = [];
  listenedPOI: any = [];

  yearSelectionSlider = {
    periods: [1436, 1667, 1812, 1823, 1877, 1900, 1918],
    selectedYear: null,
    maximumPeriodsOnScreen: 4,
    showLeftButton: true,
    showRightButton: true,
  };

  // storyCheckboxResult: any=['storyOnly','poiOnly','storyPoi'];

  constructor(injector: Injector,
    private storage: LocalStorage,
    private geolocation: Geolocation,
    private preference: Preference,
    private events: Events,
    private platform: Platform,
    public alertCtrl: AlertController,
    private cdr: ChangeDetectorRef) {
    super(injector);
    this.storage = storage;
    this.initLocalStorage();

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

    this.params.route = this.navParams.data;
    this.params.unit = this.preference.unit;
    this.places = [];
    this.allMarkers = [];
  }

  ionViewDidEnter() {
    this.findAndPlayNextAudio();
    console.log("ionViewDidEnter - start");
  }

  ionViewWillLeave() {
    this.videogularApi.pause();
  }

  ionViewDidLeave() {
    this.isViewLoaded = false;
  }

  ionViewDidLoad() {
    this.onReload();
    this.isViewLoaded = true;
    this.showLoadingView();

    if (this.platform.is('cordova')) {
      this.initGoogleMap();
    } else {
      // this.loadStoriesRelation();
      this.loadRoutePlaces();
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

  initLocalStorage() {
    Promise.all([
      this.storage.mapStyle,
      this.storage.radius,
      this.storage.playMode,
      this.storage.listenedPOI,
      this.storage.selectedYear,
      this.storage.listenedStoryIndex,
      this.storage.unit,
      this.storage.lang
    ]).then(([
      mapStyle,
      radius,
      playMode,
      listenedPOI,
      selectedYear,
      listenedStoryIndex,
      unit,
      lang
    ]) => {
      this.mapStyle = mapStyle;
      this.radius = radius;
      this.playMode = playMode;
      this.listenedPOI = listenedPOI || [];
      this.yearSelectionSlider.selectedYear = selectedYear || this.yearSelectionSlider.periods[0];
      this.listenedStoryIndex = listenedStoryIndex || 0;
      this.unit = unit;
      this.lang = lang;
      this.loadStories();
    });
  }

  //-------Date Sliders---------
  loadStories() {
    Route.getStoriesRelation(this.params.route).then(data => {
      this.routeDatabaseStories = data;
      this.filterStoriesByYear(this.yearSelectionSlider.selectedYear);
      // this.currentAudio = this.getAudioFromStoriesByIndex(this.listenedStoryIndex);
      this.yearSelectionSlider.selectedYear = this.currentAudio.selectedPeriodYear;
    }, error => {
      this.showErrorView();
      console.log("No story...");
    }
    );
  }

  //-----Auto Play player-------
  onPlayerReady(api) {
    this.videogularApi = api;
    this.videogularApi.getDefaultMedia().subscriptions.canPlayThrough.subscribe(
      () => {
        this.videogularApi.playbackRate = this.playBackValues[this.playBackRateIndex];
      }
    );

    this.videogularApi.getDefaultMedia().subscriptions.ended.subscribe(
      () => {
        this.findAndPlayNextAudio();
      }
    );
  }

  findAndPlayNextAudio() {
    this.currentAudio.title = "Finding next Audio to play ...";
    switch (this.playMode) {
      case "storyPoi": {
        const options: GeolocationOptions = {
          enableHighAccuracy: true,
          timeout: 10000
        };
        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;
        // paramsClone.location = {
        //   latitude: 47.0628917,
        //   longitude: 28.8678522
        // };
        this.geolocation.getCurrentPosition(options).then(pos => {
          paramsClone.location = pos.coords;
          this.playNextPoi(this.playMode, paramsClone);
        });
        break;
      }
      case "poiOnly": {
        const options: GeolocationOptions = {
          enableHighAccuracy: true,
          timeout: 10000
        };
        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;
        // paramsClone.location = {
        //   latitude: 47.0628917,
        //   longitude: 28.8678522
        // };
        this.geolocation.getCurrentPosition(options).then(pos => {
          paramsClone.location = pos.coords;
          this.playNextPoi(this.playMode, paramsClone);
        });
        break;
      }
      case "storyOnly": {
        this.playNextStory();
        break;
      }
    }
  }

  playNextPoi(playMode, paramsClone) {
    paramsClone.selectedYear = this.yearSelectionSlider.selectedYear;
    let nearestPlace = this.NearestPlace(this.routeDatabasePlaces, this.listenedPOI, paramsClone.location.latitude, paramsClone.location.longitude, paramsClone.distance)
    if (nearestPlace) {
      // TODO To be deleted
      // let audioPOIName = nearestPlace['audio_' + this.lang].name();
      // let audioPOIURL = this.getFileURL(audioPOIName);
      // let title = nearestPlace['title_' + this.lang];
      // this.listeningPOI = nearestPlace;

      // this.currentAudio.src = audioPOIURL;
      // this.currentAudio.title = title;
      // this.currentAudio.type = 'POI';
      // TODO ---
      this.listenedPOI.push(nearestPlace.id);
      this.storage.listenedPOI = this.listenedPOI;
      this.goToPlace(nearestPlace);
    } else if (playMode == "storyPoi") {
      this.playNextStory();
    }
  }

  changePlayBackRate() {
    this.playBackRateIndex = this.playBackRateIndex == this.playBackValues.length - 1 ? 0 : ++this.playBackRateIndex;
    this.videogularApi.playbackRate = this.playBackValues[this.playBackRateIndex];
  }

  private getAudioFromStoriesByIndex(index) {
    let audio = { 'src': null, 'title': null, 'type': null, 'period': null, 'selectedPeriodYear': null };
    if (this.formatedStories[this.lang] && this.formatedStories[this.lang][index]) {
      audio.src = this.getFileURL(this.formatedStories[this.lang][index].audio.name());
      audio.title = this.formatedStories[this.lang][index].name;
      audio.type = "Story";
      audio.period = new Date(this.formatedStories[this.lang][index].startPeriod).getFullYear() + " - " + new Date(this.formatedStories[this.lang][index].endPeriod).getFullYear();
      audio.selectedPeriodYear = Number(new Date(this.formatedStories[this.lang][index].startPeriod).getFullYear());
    }
    return audio;
  }

  //------Add Player--------
  playNextStory() {
    this.listeningPOI = null;
    if (this.listenedStoryIndex == this.formatedStories[this.lang].length - 1) {
      alert("No more formatedStories...");
      return;
    }
    this.currentAudio = this.getAudioFromStoriesByIndex(++this.listenedStoryIndex);
    this.storage.listenedStoryIndex = this.listenedStoryIndex;
    this.yearSelectionSlider.selectedYear = this.currentAudio.selectedPeriodYear;

    this.reLoadPlacesSortDate();
  }

  playPrevStory() {
    this.listeningPOI = null;
    if (this.listenedStoryIndex == 0) {
      alert("First story...");
      return;
    }
    this.currentAudio = this.getAudioFromStoriesByIndex(--this.listenedStoryIndex);
    this.storage.listenedStoryIndex = this.listenedStoryIndex;
    this.yearSelectionSlider.selectedYear = this.currentAudio.selectedPeriodYear;

    this.reLoadPlacesSortDate();
  }

  enableMenuSwipe() {
    return true;
  }

  private initGoogleMap() {
    this.map = new GoogleMap('map', {
      styles: MapStyle.default(),
      building: false
    });
    this.map.setMapTypeId(this.mapStyle);

    this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      this.map.setMyLocationEnabled(true);
      console.log("Init Gmap");
      this.getCurrentPosition();
    });
    // TODO zakomentiroval Valentin
    //     this.map.on(GoogleMapsEvent.MY_LOCATION_BUTTON_CLICK).subscribe((map: GoogleMap) => {
    //       if (this.isViewLoaded) {
    //         let position: CameraPosition<ILatLng> = this.map.getCameraPosition();
    //         let target: ILatLng = position.target;
    //
    //         this.params.location = {
    //           latitude: target.lat,
    //           longitude: target.lng
    //         };
    //         this.showLoadingView();
    //         this.onReload();
    //       }
    //     });
    //
    //     this.map.setMyLocationEnabled(true);
  }

  animateMap() {
    this.map.animateCamera({
      target: { lat: 37.422359, lng: -122.084344 },
      zoom: 17,
      tilt: 60,
      bearing: 140,
      duration: 5000,
      padding: 0  // default = 20px
    }).then(() => {
      alert("Camera target has been changed");
    });
  }

  private getCurrentPosition() {
    this.params.unit = this.unit;
    const options: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 7000
    };

    this.geolocation.getCurrentPosition(options).then(pos => {
      this.params.location = pos.coords;
      this.loadRoutePlaces();
    }, error => {
      this.translate.get('ERROR_LOCATION_UNAVAILABLE').subscribe(str => this.showToast(str));
      this.showErrorView();
    });
    this.onMove();
  }

  onMove() {
    // Options: throw an error if no update is received every 30 seconds.
    this.geolocation.watchPosition({
      timeout: 10000,
      enableHighAccuracy: true
    }).filter((p) => p.coords !== undefined).subscribe(position => {
      if (this.playMode === "poiOnly" && this.videogularApi.state != 'playing') {
        let paramsClone = { ...this.params };
        paramsClone.distance = this.radius;
        paramsClone.location = position.coords;
        this.playNextPoi(this.playMode, paramsClone);
      }
    });
  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', { place: place, places: this.places, route: this.params.route, playBackValues: this.playBackValues, playBackRateIndex: this.playBackRateIndex });
    console.log("PlaceGoToPlace(place): ", this.places);
  }


  //-------Date Sliders---------
  selectYear(selectedYearStory) {
    this.yearSelectionSlider.selectedYear = selectedYearStory;

    // this.filterPOIsByYear(selectedYearStory);

    this.filterStoriesByYear(selectedYearStory);
    this.listeningPOI = null;
    this.listenedStoryIndex = 0;
    this.currentAudio = this.getAudioFromStoriesByIndex(this.listenedStoryIndex);

    this.storage.selectedYear = selectedYearStory;
    this.storage.listenedStoryIndex = this.listenedStoryIndex;

    this.reLoadPlacesSortDate();
  }

  private filterStoriesByYear(selectedYearStory: any) {
    var filteredStories = selectedYearStory ? this.routeDatabaseStories.filter((story) => {
      return story.attributes.startPeriod.getFullYear() >= selectedYearStory;
      // return story.startPeriod.getFullYear() >= selectedYearStory && story.endPeriod.getFullYear() <= selectedYearStory;
    }) : this.routeDatabaseStories;

    for (let lang of Object.keys(this.formatedStories)) {
      this.formatedStories[lang] = [];
      // var filteredStoriesSort = filteredStories.sort(function(a, b){return a.name.slice(0,2) - b.name.slice(0,2)})
      
      for (let story of filteredStories) {
        var tempObject: any = {};
        tempObject.name = story.attributes.name;
        tempObject.audio = story.attributes['audio_' + lang];
        tempObject.startPeriod = story.attributes.startPeriod;
        tempObject.endPeriod = story.attributes.endPeriod;
        this.formatedStories[lang].push(tempObject);
      }
      this.formatedStories[lang] = this.formatedStories[lang].sort(function (a, b) {
        return a.name.slice(0, 2) - b.name.slice(0, 2)
      });
    }
  }

  // Method executed when the slides are changed
  slideChanged() {
    let currentIndex = this.slides.getActiveIndex();
    this.yearSelectionSlider.showLeftButton = currentIndex !== 0;
    this.yearSelectionSlider.showRightButton = currentIndex !== Math.ceil(this.slides.length() / 4);
  }

  // Method that shows the next slide
  slideNext() {
    this.slides.slideNext();
  }

  // Method that shows the previous slide
  slidePrev() {
    this.slides.slidePrev();
  }

  loadRoutePlaces() {
    Route.getPlacesRelation(this.params.route).then(data => {
      this.routeDatabasePlaces = data;
      if (this.platform.is('cordova')) {
        this.addPlacesMarkers(data);
      }
      this.places = data;

      if (this.places.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

    }, error => {
      this.showErrorView();
    });
  }

  reLoadPlacesSortDate() {
    var filteredPlace = this.yearSelectionSlider.selectedYear ? this.routeDatabasePlaces.filter((place) => {
      return place.startPeriod.getFullYear() >= this.yearSelectionSlider.selectedYear;
    }) : this.routeDatabasePlaces;

    if (this.platform.is('cordova')) {
      this.addPlacesMarkers(filteredPlace);
    }

    this.places = filteredPlace;
    console.log("reLoadPlacesSortDate: ", this.places);
    if (this.places.length) {
      this.showContentView();
    } else {
      this.showEmptyView();
    }
  }

  addPlacesMarkers(places) {

    let points: Array<LatLng> = [];

    for (let place of places) {
      let target: LatLng = new LatLng(
        place.location.latitude,
        place.location.longitude
      );

      let icon = (place.route && place.route.get('icon')) ? {
        url: place.route.get('icon').url(),
        size: {
          width: 32,
          height: 32
        }
      } : 'yellow';

      let markerOptions = {
        position: target,
        title: place['title_' + this.lang],
        snippet: place['description_' + this.lang],
        icon: icon,
        place: place,
        styles: {
          maxWidth: '60%'
        },
      };

      this.map.addMarker(markerOptions).then((marker: Marker) => {
        this.allMarkers.push({ marker: marker });
        console.log("this.allMarkers", this.allMarkers.length);
        marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {

          let marker = e[1];
          let place = marker.get("place");
          this.goToPlace(place);
        });
        // marker.showInfoWindow();
      });

      // this.map.addMarker(markerOptions).then((marker) => {
      //   marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {
      //     let marker = e[1];
      //     let place = marker.get("place");
      //     let places = marker.get("places");
      //     this.goToPlace({"place": place, "places": places});
      //   });

      // this.map.addCircle({
      //   center: marker.getPosition(),
      //   radius: place.radius * 1000,
      //   fillColor: "rgba(0, 0, 255, 0.2)",
      //   strokeColor: "rgba(0, 0, 255, 0.75)",
      //   strokeWidth: 1
      // });

      // });

      points.push(target);
    }

    if (points.length) {
      this.map.moveCamera({
        target: new LatLngBounds(points),
        zoom: 10
      });
    }
  }

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }

  onReload() {
    this.map && this.map.clear();

    this.places = [];
    this.params.page = 0;
    //TODO komentat
    //     const options: GeolocationOptions = {
    //       enableHighAccuracy: true,
    //       timeout: 10000
    //     };
    //     this.geolocation.getCurrentPosition(options).then(pos => {
    //       this.params.location = pos.coords;
    //     }, error => {
    //       this.showErrorView();
    //       this.translate.get('ERROR_LOCATION_UNAVAILABLE').subscribe(res => this.showToast(res));
    //     });
  }

  showCheckbox() {
    let alert = this.alertCtrl.create();
    alert.setTitle('Select type playback :');

    alert.addInput({
      type: 'radio',
      label: 'Story Only',
      value: 'storyOnly',
      checked: this.playMode.indexOf('storyOnly') !== -1
    });
    alert.addInput({
      type: 'radio',
      label: 'Story & POI',
      value: 'storyPoi',
      checked: this.playMode.indexOf('storyPoi') !== -1
    });
    alert.addInput({
      type: 'radio',
      label: 'POI Only',
      value: 'poiOnly',
      disabled: false,
      checked: this.playMode.indexOf('poiOnly') !== -1
    });
    alert.addButton('Cancel');
    alert.addButton({
      text: 'Ok',
      handler: data => {
        console.log('Checkbox data:', data);
        this.storage.playMode = data;
        this.playMode = data;
        this.preference.playMode = data;
        // this.findAndPlayNextAudio();
      }
    });
    alert.present();
  }

  filterPOIsByYear(year) {
    console.log("this.allMarkers", this.allMarkers.length);
    console.log("this.allMarkers", this.allMarkers);
    for (let marker of this.allMarkers) {
      let place = marker.marker.get("place");
      console.log("place", place);
      marker.marker.remove();
      if (place.startPeriod.getFullYear() >= year) {
        let target: LatLng = new LatLng(
          place.location.latitude,
          place.location.longitude
        );

        let icon = (place.route && place.route.get('icon')) ? {
          url: place.route.get('icon').url(),
          size: {
            width: 32,
            height: 32
          }
        } : 'yellow';

        let markerOptions = {
          position: target,
          title: place['title_' + this.lang],
          snippet: place['description_' + this.lang],
          icon: icon,
          place: place,
          styles: {
            maxWidth: '60%'
          },
        };

        this.map.addMarker(markerOptions).then((addedMarker: Marker) => {
          marker.marker = addedMarker;
          // this.allMarkers.push(marker);
          addedMarker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {
            console.log("GoogleMapsEvent.INFO_CLICK", e);
            let tmpMarker = e[1];
            let place = tmpMarker.get("place");
            console.log('tmpMarker.get("place")', place);
            this.goToPlace(place);
          });
        });
      }
    }
  }
}
