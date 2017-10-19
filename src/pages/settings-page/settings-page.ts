import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { Events } from 'ionic-angular';
import { LocalStorage } from '../../providers/local-storage';
import { BasePage } from '../base-page/base-page';

@IonicPage()@Component({
  selector: 'page-settings-page',
  templateUrl: 'settings-page.html'
})
export class SettingsPage extends BasePage {

  settings: any = {};
  storage: LocalStorage;
  events: Events;

  constructor(
    private injector: Injector,
    localStorage: LocalStorage,
    events: Events) {

    super(injector);

    this.storage = localStorage;
    this.events = events;

    this.storage.unit.then(unit => this.settings.unit = unit).catch((e) => console.log(e));
    this.storage.mapStyle.then(mapStyle => this.settings.mapStyle = mapStyle).catch((e) => console.log(e));
    this.storage.distance.then(distance => this.settings.distance = distance).catch((e) => console.log(e));
    this.storage.lang.then(lang => this.settings.lang = lang).catch((e) => console.log(e));
  }

  enableMenuSwipe() {
    return true;
  }

  ionViewDidLoad() {

  }

  onChangeUnit() {
    this.storage.unit = this.settings.unit;
  }

  onChangeMapStyle() {
    this.storage.mapStyle = this.settings.mapStyle;
  }

  onChangeDistance() {
    this.storage.distance = this.settings.distance;
  }

  onChangeLang() {
    if (this.settings.lang) {
      this.storage.lang = this.settings.lang;
      this.translate.use(this.settings.lang);
      this.events.publish('lang:change');
    }
  }

  goToWalkthrough() {
    this.navigateTo('WalkthroughPage');
  }

}
