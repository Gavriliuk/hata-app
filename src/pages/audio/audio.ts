import {Component} from '@angular/core';

import {ITrackConstraint} from 'ionic-audio';
import { IonicPage } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-audio',
  templateUrl: 'audio.html'
})
export class AudioPage {
  myTracks: ITrackConstraint[];
  currentTrack: ITrackConstraint;


  constructor() {
    // plugin won't preload data by default, unless preload property is defined within json object - defaults to 'none'
    this.myTracks = [{
      src: 'https://archive.org/download/JM2013-10-05.flac16/V0/jm2013-10-05-t12-MP3-V0.mp3',
      artist: 'John Mayer',
      title: 'Why Georgia',
      art: 'assets/img/johnmayer.jpg',
      preload: 'metadata' // tell the plugin to preload metadata such as duration for this track, set to 'none' to turn off
    },
      {
        src: 'https://archive.org/download/JM2013-10-05.flac16/V0/jm2013-10-05-t30-MP3-V0.mp3',
        artist: 'John Mayer',
        title: 'Who Says',
        art: 'assets/img/johnmayer.jpg',
        preload: 'metadata' // tell the plugin to preload metadata such as duration for this track,  set to 'none' to turn off
      },

      {
        src: 'https://archive.org/download/swrembel2010-03-07.tlm170.flac16/swrembel2010-03-07s1t05.mp3',
        artist: 'Stephane Wrembel',
        title: 'Stephane Wrembel Live',
        art: 'assets/img/Stephane.jpg',
        preload: 'metadata' // tell the plugin to preload metadata such as duration for this track,  set to 'none' to turn off
      }];

    this.currentTrack=this.myTracks[0];

  }

  next() {
  }

  // ngAfterContentInit() {
  //   // get all tracks managed by AudioProvider so we can control playback via the API
  //   this.allTracks = this._audioProvider.tracks;
  // }

  onTrackFinished(track: any) {
    console.log('Track finished', track);
  }
}
