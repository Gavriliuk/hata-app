import { Injector } from '@angular/core';
import { Geolocation, GeolocationOptions } from '@ionic-native/geolocation';
import { StoryOnlyPlayMode } from './story-only-play-mode';
import { Place } from '../parse-models/place-service';

export class StoryPoiPlayMode extends StoryOnlyPlayMode {

  radius: any;
  watchPositionSubscriber: any;
  playerState: string;
  // places: Place[];
  private geolocation: Geolocation;
  geolocationOptions: GeolocationOptions = {
    maximumAge: 30000,
    enableHighAccuracy: false,
    timeout: 3000
  };

  onMove() {
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

    this.unsubscribeEvents();
    this.subscribeEvents();

  }

  async start() {
    if (this.isLastStory()) {
      this.onMove();
    } else {
      this.getCurrentPosition().then(
        (position) => {
          this.findAndPlayNearestPoi(position, () => {
            super.playStory();
          });
        }
        , error => {
          super.playStory();
        });
    }
  }

  async playNext() {
    if (this.isLastStory()) {
      this.onMove();
    } else {
      this.getCurrentPosition().then(
        this.afterStoryPositionFound
        , error => {
          super.playNext();
        });
    }
  }

  async init(params) {
    await super.init(params);
    this.radius = await this.storage.radius;
  }

  getCurrentPosition() {
    return this.geolocation.getCurrentPosition(this.geolocationOptions);
  }

  playPoi(nearestPlace) {
    this.routeValues.listenedPOI.push(nearestPlace.id);
    this.storage.updateRouteValues(this.params.route.id, this.routeValues);
    this.events.publish("playPoi", nearestPlace);
  }

  unsubscribeEvents() {
    super.unsubscribeEvents();
    this.watchPositionSubscriber && this.watchPositionSubscriber.unsubscribe();
  }

  subscribeEvents() {
    this.getSubscribedEvents().forEach((event) => {
      this.events.subscribe(event.event, event.handler)
    });
  }

  async changePeriod(year) {
    this.watchPositionSubscriber && this.watchPositionSubscriber.unsubscribe();
    // debugger
    this.routeValues.selectedYear = year;
    let storyIndex = this.getStoryIndexByYear(this.sortedStories, year);
    if (storyIndex != -1) {
      this.routeValues.listenedStoryIndex = --storyIndex;
      super.playNext();
    }
  }

  getSubscribedEvents(): any {
    return [
      {
        event: "onPlayerStateChanged",
        handler: (state, place) => {
          this.playerState = state;
        }
      }
    ];
  }

  onMovePositionFound = (position) => {
    this.findAndPlayNearestPoi(position);
  }
  afterStoryPositionFound = (position) => {
    this.findAndPlayNearestPoi(position, () => {
      super.playNext();
    });
  }

  private findAndPlayNearestPoi(position: any, cannotPlayCallback = () => { }) {
    console.log("StoryPoi watch position:", position);
    let prm: any = {};
    prm.location = position['coords'];
    prm.distance = this.radius;
    let nearestPlace = Place.NearestPlace(this.params.places, this.routeValues.listenedPOI, prm);
    if (nearestPlace && this.playerState != 'playing') {
      this.playPoi(nearestPlace);
    } else {
      cannotPlayCallback();
    }
  }
}