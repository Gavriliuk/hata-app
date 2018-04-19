import { Component, Injector } from '@angular/core';
import { RoutesPage } from '../routes/routes';
import { SettingsPage } from '../settings-page/settings-page';
import { BasePage } from '../base-page/base-page';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage extends BasePage {

  labels: any = {
    routes: "",
    settings: ""
  };
  enableMenuSwipe(): boolean {
    return false;
  }

  constructor(injector: Injector) {
    super(injector);
  }

  ionViewDidLoad() {

    this.translate.get('ROUTES').subscribe((res: string) => {
      this.labels.routes = res;
    });
    // debugger;
  }
  tab1Root = RoutesPage;
  tab2Root = SettingsPage;
}
