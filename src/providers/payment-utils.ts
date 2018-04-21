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
            prompt.data.message = "Promocode validation  ..."
            Promocode.validate(data.code, routeId).then((result) => {
              if (result["action"] == "ok") {
                prompt.data.message = "Promocode Valid!"
                Promocode.apply(data.code, "dumyDeviceId").then((applyResult) => {
                  if (applyResult["action"] == "ok") {
                    setTimeout(() => {
                      okCallback();
                      prompt.dismiss();
                    }, 2000);
                  } else {
                    prompt.data.message = "Error occured while applying Promocode, please retry."
                  }
                });

              } else {
                prompt.data.message = "Promocode Invalid, please retry.";
                setTimeout(() => {
                  koCallback();
                }, 2000);
              }
            }, error => {
              prompt.data.message = "Error occurred while validating, please retry.";
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
