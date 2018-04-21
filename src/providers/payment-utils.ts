import { Injectable, Injector } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Promocode } from './parse-models/promocode-service';


@Injectable()
export class PaymentUtils {

  translation: TranslateService;
  alertCtrl: AlertController;
  constructor(injector: Injector) {
    this.alertCtrl = injector.get(AlertController);
    this.translation = injector.get(TranslateService);
  }

  showPromoCodePrompt(routeId, okCallback, koCallback) {
    let prompt = this.alertCtrl.create({
      title: this.translation.instant('promocode_title'),
      message: this.translation.instant('promocode_description'),
      inputs: [
        {
          name: 'code',
          placeholder: this.translation.instant('promocode')
        },
      ],
      buttons: [
        {
          text: this.translation.instant('CANCEL'),
          handler: data => {
            console.log('Cancel clicked');
            koCallback();
          }
        },
        {
          text: this.translation.instant('CONTINUE'),
          handler: data => {
            prompt.data.message = this.translation.instant("promocode_check");
            Promocode.validate(data.code, routeId).then((result) => {
              if (result["action"] == "ok") {
                prompt.data.message = this.translation.instant("promocode_valid");
                Promocode.apply(data.code, "dumyDeviceId").then((applyResult) => {
                  if (applyResult["action"] == "ok") {
                    setTimeout(() => {
                      okCallback();
                      prompt.dismiss();
                    }, 2000);
                  } else {
                    prompt.data.message = this.translation.instant("promocode_check_error");
                  }
                });

              } else {
                prompt.data.message = this.translation.instant("promocode_invalid");
                setTimeout(() => {
                  koCallback();
                }, 2000);
              }
            }, error => {
              prompt.data.message = this.translation.instant("promocode_check_error");
              setTimeout(() => {
                koCallback();
              }, 2000);

            });
            return false;
          }
        }
      ]
    });
    prompt.present();
  }

}
