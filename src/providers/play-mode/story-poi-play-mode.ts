import { Injector } from '@angular/core';
import { Geolocation, GeolocationOptions, Geoposition } from '@ionic-native/geolocation';
import { StoryOnlyPlayMode } from './story-only-play-mode';
import { Place } from '../parse-models/place-service';
import { Observable } from 'rxjs/Observable';

export class StoryPoiPlayMode extends StoryOnlyPlayMode {

  watchPositionSubscriber: any;
  playerState: string;
  // places: Place[];
  private geolocation: Geolocation;
  geolocationOptions: GeolocationOptions = {
    maximumAge: 30000,
    enableHighAccuracy: false,
    timeout: 3000
  };
  //-------
  fakeLocations: any[] = [
    {
      coords: {
        latitude: 47.055382671941324,
        longitude: 28.865062589965873
      }
    },
    {
      coords: {
        latitude: 47.055528860953046,
        longitude: 28.864204283081108
      }
    },
    {
      coords: {
        latitude: 47.05573352489612,
        longitude: 28.863345976196342
      }
    },
    {
      coords: {
        latitude: 47.05605513807681,
        longitude: 28.86167227777105
      }
    },
    {
      coords: {
        latitude: 47.056376749317764,
        longitude: 28.860041494689995
      }
    },
    {
      coords: {
        latitude: 47.05652293560425,
        longitude: 28.8589256957398
      }
    }
  ];
  data = new Observable(observer => {
    for (let i = 0; i < this.fakeLocations.length; i++) {
      (function (locations, ind) {
        setTimeout(function () {
          observer.next(locations[ind]);
        }, ind * 1000);
      })(this.fakeLocations, i);
    }

  });

  onMove() {
    this.watchPositionSubscriber = this.data.subscribe(
      this.onMovePositionFound,
      error => console.log("error", error),
      () => console.log("finished")
    );
  }

  onMove1() {
    // Options: throw an error if no update is received every 5 seconds.
    this.watchPositionSubscriber = this.geolocation.watchPosition({
      timeout: 3000,
      enableHighAccuracy: false
    }).filter((p) => p.coords !== undefined).subscribe(
      this.onMovePositionFound,
      error => console.log("error", error),
      () => console.log("finished")
    );
  }

  constructor(injector: Injector) {
    super(injector);
    this.geolocation = injector.get(Geolocation);
    this.watchPositionSubscriber && this.watchPositionSubscriber.unsubscribe();
  }

  async play() {
    await super.init();
    this.getCurrentPosition().then(
      this.afterStoryPositionFound
      , error => {
        this.playNext();
      });
  }

  playNext() {
    if (this.isLastStory()) {
      this.onMove();
    } else {
      ++this.routeValues.listenedStoryIndex;
      this.storage.updateRouteValues(this.navParams.data.id, this.routeValues);
      super.play();
    }
  }

  getCurrentPosition() {
    // return this.geolocation.getCurrentPosition(this.geolocationOptions);
    return new Promise((resolve, reject) => {
      let position = {
        coords: {
          latitude: 47.055382671941324,
          longitude: 28.865062589965873
        }
      };
      resolve(position);
      // reject(position);
    })
  }

  playNearestPoi(nearestPlace) {
    this.routeValues.listenedPOI.push(nearestPlace.id);
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);
    this.events.publish("playPoi", nearestPlace);
  }

  unsubscribeEvents() {
    super.unsubscribeEvents();
    this.watchPositionSubscriber && this.watchPositionSubscriber.unsubscribe();
  }

  buildEventsSubscription(): any {
    return [
      {
        event: "onYearChanged",
        handler: (e) => {
          console.log("StoryPoiPlayMode onYearChanged:", e);
          this.watchPositionSubscriber.unsubscribe();
          // debugger
          this.routeValues.selectedYear = e;
          let storyIndex = this.getStoryIndexByYear(this.sortedStories, e);
          if (storyIndex != -1) {
            this.routeValues.listenedStoryIndex = --storyIndex;
            this.storage.updateRouteValues(this.params.route.id, this.routeValues);
            this.playNext();
          }
        }
      },
      {
        event: "onPlayerStateChanged",
        handler: (state, place) => {
          // console.error("StoryPoiPlayMode onPlayerStateChanged:", state);
          // console.error("StoryPoiPlayMode onPlayerStateChanged:", place);
          // console.error("StoryPoiPlayMode onPlayerStateChanged:", e);
          this.playerState = state;
        }
      }
    ];
  }
  onMovePositionFound = (position) => {
    this.findAndPlayNearestPoi(position);
  }
  afterStoryPositionFound = (position) => {
    this.findAndPlayNearestPoi(position, ()=>this.playNext());
  }
  private findAndPlayNearestPoi(position: any, cannotPlayCallback = () => { }) {
    console.log("StoryPoi watch position:", position);
    let prm: any = {};
    prm.location = position['coords'];
    prm.distance = this.params.radius;
    let nearestPlace = Place.NearestPlace(this.params.places, this.routeValues.listenedPOI, prm);
    if (nearestPlace && this.playerState != 'playing') {
      this.playNearestPoi(nearestPlace);
    }
    else {
      cannotPlayCallback();
    }
  }
}


