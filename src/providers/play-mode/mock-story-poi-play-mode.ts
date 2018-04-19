import { Observable } from 'rxjs/Observable';
import { StoryPoiPlayMode } from './story-poi-play-mode';
import { Geoposition } from '@ionic-native/geolocation';

export class StoryPoiPlayModeMock extends StoryPoiPlayMode {
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

  getCurrentPosition(): Promise<Geoposition> {
    return new Promise((resolve, reject) => {
      let position =
       {
        coords: {
          latitude: 47.055382671941324,
          longitude: 28.865062589965873
        }
      };
      resolve(<Geoposition>position);
      // reject(<Geoposition>position);
    })
  }
}


