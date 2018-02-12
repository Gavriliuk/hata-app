import {IonicPage} from 'ionic-angular';
import {Component, Injector} from '@angular/core';
import {Platform, Events, Slides} from 'ionic-angular';
import {Place} from '../../providers/place-service';
import {Story} from '../../providers/stories';
import {MapStyle} from '../../providers/map-style';
import {BasePage} from '../base-page/base-page';
import {LocalStorage} from '../../providers/local-storage';
import {Geolocation, GeolocationOptions} from '@ionic-native/geolocation';
import {ChangeDetectorRef} from '@angular/core';
import 'rxjs/add/operator/filter'
import {Category} from '../../providers/categories';
import Parse from 'parse';
import {ViewChild} from '@angular/core';

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

  @ViewChild(Slides) slides: Slides;

  listeningPOI: Place;
  params: any = {};
  places: Place[];
  stories: any = {'ro': [], 'ru': [], 'en': []};
  map: GoogleMap;
  isViewLoaded: boolean;
  audio: any;
  currentAudio: any;
  listenedPOI: any = [];
  listenedStoryIndex: any = 0;
  api: any;
  lang: any;
  category: Category;
  place: any;
  waypoints: any = [];
  start: any;
  end: any;
  categories: any;
  colorLine = '#c401ff';

  storySliders: any = [];
  allStories: any = [];
  selectedDate: any[];
  selectedStory: any[];
  showLeftButton: boolean;
  showRightButton: boolean;

  constructor(public injector: Injector,
              private googleMaps: GoogleMaps,
              private events: Events,
              private storage: LocalStorage,
              private geolocation: Geolocation,
              private platform: Platform,
              // private slides: Slides,
              private cdr: ChangeDetectorRef) {

    super(injector);
    this.storage = storage;

    this.storage.listenedPOI.then((listenedPOI) => {
      this.listenedPOI = listenedPOI || [];
    }).catch((e) => {
      console.log(e)
    });

    this.storage.listenedStoryIndex.then((listenedStoryIndex) => {
      this.listenedStoryIndex = listenedStoryIndex || 0;
      this.loadStories();
    }).catch((e) => {
      console.log(e)
    });

    this.storage.lang.then((val) => {
      this.lang = val;
      console.log("LanguageMap: ", val);
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
          // this.onMove();
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

  // onPlayerReady(api) {
  //   this.api = api;
  //   this.api.getDefaultMedia().subscriptions.canPlay.subscribe(
  //     () => {
  //       this.api.play();
  //     }
  //   );
  //   this.api.getDefaultMedia().subscriptions.ended.subscribe(
  //     () => {
  //       this.findAndPlayNextAudio();
  //
  //     }
  //   );
  // }

  private findAndPlayNextAudio() {

    const options: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 7000
    };

    this.geolocation.getCurrentPosition(options).then(pos => {
      let paramsClone = {...this.params};
      this.storage.radius.then((val) => {
        paramsClone.distance = val;
        paramsClone.location = pos.coords;
        //TODO take from localstorage
        paramsClone.unit = "km";
        paramsClone.limit = 5;
        paramsClone.except = this.listenedPOI;

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
                var tempObject: any = {
                  src:audioPOIURL,
                  artist: '',
                  title: '',
                  art: '',
                  preload: 'metadata' // tell the plugin to preload metadata such as duration for this track, set to 'none' to turn off
                }
                this.currentAudio = tempObject;
                // this.api.getDefaultMedia().loadMedia();
                this.listenedPOI.push(placesInRadius[i].id);
                this.storage.listenedPOI = this.listenedPOI;
                return;
              }
            }
            this.playNextStory();
          }
        });
      });
    }, error => {
      this.playNextStory();
    });
  }

   playNextStory() {
    this.listeningPOI = null;
    if (this.listenedStoryIndex == this.stories[this.lang].length - 1) {
      return;
    }
    this.currentAudio = this.stories['ru'][++this.listenedStoryIndex];
    this.storage.listenedStoryIndex = this.listenedStoryIndex;
  }

   playPrevStory() {
    this.listeningPOI = null;
    if (this.listenedStoryIndex == 0) {
      return;
    }
    this.currentAudio = this.stories['ru'][--this.listenedStoryIndex];
    this.storage.listenedStoryIndex = this.listenedStoryIndex;
  }

  enableMenuSwipe() {
    return true;
  }

  ionViewDidLeave() {
    this.isViewLoaded = false;
    this.currentAudio=null;
    // if (this.map) {
    //   this.map.clear();
    //   this.map.setZoom(0.5);
    //   this.map.setCenter(new LatLng(0, 0));
    // }
  }

  ionViewDidLoad() {

  }

  goToPlace(place) {
    this.navigateTo('PlaceDetailPage', place);
  }

  //-------Date Sliders---------
//   initializeStory(){
//     // Select it by defaut
// this.selectedStory = this.stories['ru'].year;
//     // Check which arrows should be shown
//     this.showLeftButton = false;
//     this.showRightButton = this.stories.length > 4;
//   }
  selectYear(selectedYearStory) {
    for (let i = 0; i < this.stories[this.lang].length; i++) {
      if (this.stories[this.lang][i].year >= selectedYearStory.year) {
        this.listeningPOI = null;
        this.listenedStoryIndex = i;
        this.storage.listenedStoryIndex = this.listenedStoryIndex;
        this.currentAudio = this.stories[this.lang][this.listenedStoryIndex];
        return;
      }
    }
  }

  // Method executed when the slides are changed
  slideChanged() {
    let currentIndex = this.slides.getActiveIndex();
    this.showLeftButton = currentIndex !== 0;
    this.showRightButton = currentIndex !== Math.ceil(this.slides.length() / 4);
  }

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
    Story.load().then(data => {
      this.allStories = data;
      data.forEach((story) => {
        Object.keys(this.stories).forEach((lang) => {
          story['audios_' + lang].forEach((audio) => {
            var tempObject: any = {
              artist: '',
              title: '',
              art: '',
              preload: 'metadata' // tell the plugin to preload metadata such as duration for this track, set to 'none' to turn off
            }
            // var tempObject: any = {};
            tempObject.parse_audio = audio;
            tempObject.year = story.year;
            tempObject.src = this.getFileURL(audio.name());
            this.stories[lang].push(tempObject);
          })
        })
      })
      //TODO brat tekushchii yazyk
      // let fileName = this.stories['ru'][this.listenedStoryIndex].audio.name();
      this.currentAudio = this.stories['ru'][this.listenedStoryIndex];
      // this.api.getDefaultMedia().loadMedia();
    });
  }

  onTrackFinished(track: any) {
    console.log('Track finished', track);

    this.findAndPlayNextAudio();
  }

  getFileURL(fileName) {
    return Parse.serverURL + 'files/' + Parse.applicationId + '/' + fileName;
  }

  loadData() {
    Category.load().then(data => {
      let num = 1;
      data.forEach(category => {
        num++;
        if (num == 3) {
          // let color1 = '#fff72'+num;
          // this.colorLine = color1;
          this.colorLine = '#8eff90';
        } else if (num == 4) {
          this.colorLine = '#12fcff';
        }
        this.waypoints = [];
        let coordinates = [];
        if (category.waypoints && category.waypoints !== "") {
          if (category.waypoints.indexOf('/') != -1) {
            coordinates = category.waypoints.split('/');
            coordinates.forEach(data => {
              let loc = data.split(",");
              let lat = parseFloat(loc[0]);
              let lng = parseFloat(loc[1]);
              this.waypoints.push(<LatLng>{"lat": lat, "lng": lng});
            });
          }
          this.map.addPolyline({
            points: this.waypoints,
            'color': this.colorLine,
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
          title: place['title_' + this.lang],
          snippet: place['description_' + this.lang],
          animation: 'NodeFX',
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
            this.goToPlace({"place": place, "places": places});
          });

          this.map.addCircle({
            center: marker.getPosition(),
            radius: place.radius * 1000,
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


}
