import { Component, Injector } from '@angular/core';
import { RoutesPage } from '../routes/routes';
import { SettingsPage } from '../settings-page/settings-page';
import { BasePage } from '../base-page/base-page';
import { Events } from 'ionic-angular';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage extends BasePage {

  labels: any = {
    routes: "",
    settings: ""
  };
  show: boolean = true;
  enableMenuSwipe(): boolean {
    return false;
  }

  constructor(injector: Injector, private events: Events) {
    super(injector);
    this.events = events;
    this.events.subscribe('tabs:show', (show) => {
      this.show = show;
    });
  }

  ionViewDidLoad() {
    this.translate.get('ROUTES').subscribe((res: string) => {
      this.labels.routes = res;
    });
  }
  tab1Root = RoutesPage;
  tab2Root = SettingsPage;
}
