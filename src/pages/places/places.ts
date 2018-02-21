import {IonicPage} from 'ionic-angular';
import {Component, Injector} from '@angular/core';
import {BasePage} from '../base-page/base-page';
import {Place} from '../../providers/place-service';
import {Preference} from '../../providers/preference';
import {Category} from '../../providers/categories';
import {Geolocation, GeolocationOptions} from '@ionic-native/geolocation';
import {LocalStorage} from '../../providers/local-storage';
import {ChangeDetectorRef} from '@angular/core';
import {Platform, Events, Slides} from 'ionic-angular';

import {Story} from '../../providers/stories';
import Parse from 'parse';

import {MapStyle} from '../../providers/map-style';
import {
  CameraPosition, GoogleMap, GoogleMapsEvent,
  LatLng, LatLngBounds, Marker
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
  // waypoints: any = [];
  slideOptions: any;
  slides: Slides;
  periods: number[] = [1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900, 1950];
  playBackValues: any[] = [1, 1.5, 2, 3, 4];
  playBackRateIndex: any = 0;
  listeningPOI: Place;
  currentAudio: any = {'src': null, 'title': null};
  stories: any = {'ro': [], 'ru': [], 'en': []};
  listenedPOI: any = [];
  radius: any;
  selectedYear: any;
  mapStyle: any;
  listenedStoryIndex: any = 0;
  unit: any;
  allStories: any = [];
  selectedStory: any[];
  showLeftButton: boolean;
  showRightButton: boolean;
  filterCategory: string;

  constructor(injector: Injector,
              private storage: LocalStorage,
              private geolocation: Geolocation,
              private preference: Preference,
              private events: Events,
              private platform: Platform,
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

    this.params.category = this.navParams.data;
    this.params.unit = this.preference.unit;
    this.places = [];
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
      this.loadRoutePlaces();
      console.warn('Native: tried calling Google Maps.isAvailable, but Cordova is not available. Make sure to include cordova.js or run in a device/simulator');
    }
  }

  initLocalStorage() {
    Promise.all([
      this.storage.mapStyle,
      this.storage.radius,
      this.storage.filterCategory,
      this.storage.listenedPOI,
      this.storage.selectedYear,
      this.storage.listenedStoryIndex,
      this.storage.unit,
      this.storage.lang
    ]).then(([
      mapStyle,
      radius,
      filterCategory,
      listenedPOI,
      selectedYear,
      listenedStoryIndex,
      unit,
      lang
    ]) => {
      this.mapStyle = mapStyle;
      this.radius = radius;
      this.filterCategory = filterCategory;
      this.listenedPOI = listenedPOI || [];
      this.selectedYear = selectedYear;
      this.listenedStoryIndex = listenedStoryIndex || 0;
      this.unit = unit;
      this.lang = lang;
      this.loadStories();
    });
  }

  //-----Auto Play player-------
  onPlayerReady(api) {
    this.api = api;
    this.api.getDefaultMedia().subscriptions.canPlayThrough.subscribe(
      () => {
        this.api.playbackRate = this.playBackValues[this.playBackRateIndex];
      }
    );

    this.api.getDefaultMedia().subscriptions.ended.subscribe(
      () => {
        this.findAndPlayNextAudio();
      }
    );
  }

  private findAndPlayNextAudio() {
    const options: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 7000
    };

    this.geolocation.getCurrentPosition(options).then(pos => {
      let paramsClone = {...this.params};
      paramsClone.distance = this.radius;
      paramsClone.location = pos.coords;
      // paramsClone.location = {
      //   latitude:47.054842,
      //   longitude:28.870902
      // };
      //TODO take from localstorage
      paramsClone.unit = "km";
      paramsClone.limit = 5;
      paramsClone.except = this.listenedPOI;
      paramsClone.selectedYear = this.selectedYear;
      Place.loadNearPlaces(paramsClone).then(placesInRadius => {
        if (!placesInRadius) {
          this.playNextStory();
        } else {
          for (let i = 0; i < placesInRadius.length; i++) {
            let myDistance = placesInRadius[i].distance(paramsClone.location, 'none');
            let radius = placesInRadius[i].attributes.radius;
            let audioPOIName = placesInRadius[i]['audio_' + this.lang].name();
            let audioPOIURL = this.getFileURL(audioPOIName);
            this.listeningPOI = placesInRadius[i];

            if (myDistance <= radius && this.listenedPOI.indexOf(placesInRadius[i].id) == -1) {
              this.currentAudio.src = audioPOIURL;
              this.listenedPOI.push(placesInRadius[i].id);
              this.storage.listenedPOI = this.listenedPOI;
              return;
            }
          }
          this.playNextStory();
        }
      });
    }, error => {
      this.playNextStory();
    });
  }


  changePlayBackRate() {
    this.playBackRateIndex = this.playBackRateIndex == this.playBackValues.length - 1 ? 0 : ++this.playBackRateIndex;
    this.api.playbackRate=this.playBackValues[this.playBackRateIndex];
  }

//------Add Player--------
  playNextStory() {
    this.listeningPOI = null;
    if (this.listenedStoryIndex == this.stories[this.lang].length - 1) {
      alert("No more stories...");
      return;
    }
    this.currentAudio.src = this.getFileURL(this.stories[this.lang][++this.listenedStoryIndex].audio.name());
    this.storage.listenedStoryIndex = this.listenedStoryIndex;
  }

  // playPrevStory() {
  //   this.listeningPOI = null;
  //   if (this.listenedStoryIndex == 0) {
  //     return;
  //   }
  //   this.currentAudio.src = this.getFileURL(this.stories[this.lang][--this.listenedStoryIndex].audio.name());
  //   console.log("currentAudio:", this.currentAudio);
  //   // this.api.getDefaultMedia().loadMedia();
  //   this.storage.listenedStoryIndex = this.listenedStoryIndex;
  // }


  ngOnInit() {
    this.slideOptions = {
      initialSlide: 0,
      loop: false,
      direction: 'horizontal',
      pager: true,
      speed: 800
    }
  };

  enableMenuSwipe() {
    return true;
  }


  private initGoogleMap() {
    this.map = new GoogleMap('map', {
      styles: MapStyle.default()
    });
    this.map.setMapTypeId(this.mapStyle);

    this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      this.map.setMyLocationEnabled(true);
      // console.log("Init Gmap");
      this.getCurrentPosition();
    });

    // this.map.on(GoogleMapsEvent.MY_LOCATION_BUTTON_CLICK).subscribe((map: GoogleMap) => {
    //   if (this.isViewLoaded) {
    //     let position: CameraPosition<ILatLng> = this.map.getCameraPosition();
    //     let target: ILatLng = position.target;
    //
    //     this.params.location = {
    //       latitude: target.lat,
    //       longitude: target.lng
    //     };
    //     this.showLoadingView();
    //     this.onReload();
    //   }
    // });
    //
    // this.map.setMyLocationEnabled(true);
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
    // this.onMove();
  }

//   onMove() {
// // Options: throw an error if no update is received every 30 seconds.
//     this.geolocation.watchPosition({
//       maximumAge: 3000,
//       timeout: 3000,
//       enableHighAccuracy: true
//     }).filter((p) => p.coords !== undefined).subscribe(position => {
//       let paramsClone = {...this.params};
//       paramsClone.distance = this.radius;
//       paramsClone.location = position.coords;
//
//       Place.loadNearPlaces(paramsClone).then(place => {
//         if (place && place[0]) {
//           let myDistance = place[0].distance(paramsClone.location, 'none');
//           let radius = place[0].attributes.radius;
//           let audioURL = place[0]['audio_' + this.lang].url();
//           if (this.nearAudio[0] != audioURL && myDistance <= radius) {
//             this.nearAudio = [audioURL];
//             this.api.getDefaultMedia().loadMedia();
//           }
//         }
//       });
//     });
//   }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', {place: place, places: this.places});
    console.log("PlaceGoToPlace(place): ", this.places);
  }


  //-------Date Sliders---------

  selectYear(selectedYearStory) {

    this.filterStoriesByPeriod(selectedYearStory);
    this.listeningPOI = null;
    this.listenedStoryIndex = 0;
    this.selectedYear = selectedYearStory;
    this.storage.selectedYear = selectedYearStory;
    this.storage.listenedStoryIndex = this.listenedStoryIndex;
    let fileName = this.stories[this.lang][this.listenedStoryIndex].audio.name();
    this.currentAudio.src = this.getFileURL(fileName);
  }

  private filterStoriesByPeriod(selectedYearStory: any) {
    var filteredStories = selectedYearStory ? this.allStories.filter((story)=> {
      return story.startPeriod.getFullYear() <= selectedYearStory && story.endPeriod.getFullYear() >= selectedYearStory;
    }) : this.allStories;

    for (let lang of Object.keys(this.stories)) {
      this.stories[lang] = [];
      for (let story of filteredStories) {
        var tempObject: any = {};
        tempObject.audio = story['audio_' + lang];
        tempObject.startPeriod = story.startPeriod;
        tempObject.endPeriod = story.endPeriod;
        this.stories[lang].push(tempObject);
      }
    }
  }

  // Method executed when the slides are changed
  // slideChanged() {
  //   let currentIndex = this.slides.getActiveIndex();
  //   this.showLeftButton = currentIndex !== 0;
  //   this.showRightButton = currentIndex !== Math.ceil(this.slides.length() / 5);
  // }

  // Method that shows the next slide
  slideNext() {
    this.slides.slideNext();
  }

  // Method that shows the previous slide
  slidePrev() {
    this.slides.slidePrev();
  }


  //-------Date Sliders---------
  loadStories() {
    // this.storage.selectedYear.then((selectedYear)=> {
    Story.load().then(data => {
      this.allStories = data;

      this.filterStoriesByPeriod(this.selectedYear);

      //TODO brat tekushchii yazyk
      let fileName = this.stories['ru'][this.listenedStoryIndex].audio.name();
      this.currentAudio.src = this.getFileURL(fileName);
      // this.api.getDefaultMedia().loadMedia();
      this.selectedStory = this.stories['ru'][this.listenedStoryIndex];
      this.showRightButton = this.stories['ru'].length > 4;
    });
    // });

  }

  getFileURL(fileName) {
    return Parse.serverURL + 'files/' + Parse.applicationId + '/' + fileName;
  }

  loadRoutePlaces() {
    Place.load(this.params).then(data => {
      if (this.platform.is('cordova')) {
        this.onPlacesLoaded(data);
      }
      for (let place of data) {
        this.places.push(place);
      }

      if (this.places.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

    }, error => {
      this.showErrorView();
    });
  }

  // private updateAudioURL(data) {
  //   let audioURL = data[0]['audio_' + this.lang].url();
  //   this.nearAudio = [audioURL];
  // }

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
        title: place['title_' + this.lang],
        snippet: place['description_' + this.lang],
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

      this.map.addMarker(markerOptions).then((marker) => {
        marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(e => {
          let marker = e[1];
          let place = marker.get("place");
          let places = marker.get("places");
          this.goToPlace({"place": place, "places": places});
        });

        this.map.addCircle({
          center: marker.getPosition(),
          radius: place.radius * 1000,
          fillColor: "rgba(0, 0, 255, 0.2)",
          strokeColor: "rgba(0, 0, 255, 0.75)",
          strokeWidth: 1
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

  ngAfterViewChecked(): void {
    this.cdr.detectChanges();
  }


  onReload() {
    this.map && this.map.clear();

    this.places = [];
    this.params.page = 0;

    // const options: GeolocationOptions = {
    //   enableHighAccuracy: true,
    //   timeout: 10000
    // };
    // this.geolocation.getCurrentPosition(options).then(pos => {
    //   this.params.location = pos.coords;
    // }, error => {
    //   this.showErrorView();
    //   this.translate.get('ERROR_LOCATION_UNAVAILABLE').subscribe(res => this.showToast(res));
    // });
  }
}
