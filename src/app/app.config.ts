export class AppConfig {

  /* Parse Server URL */
   public static get SERVER_URL(): string {
     //----------Setting Localhost-----------------------------
     // return 'http://localhost:1337/parse/';

     //----------Setting server-----------------------------
     // return 'http://188.166.101.46:1337/parse/';

     //----------Setting Ngrok-----------------------------
     return 'http://aaf707c6.ngrok.io/parse/';
   }

   /* Parse App ID  */
   public static get APP_ID(): string {
     return 'myAppId';
   }

   /* AdMob Banner ID  */
   public static get BANNER_ID(): string {
     return '';
   }

   /* Google Analytics Tracking ID  */
   public static get TRACKING_ID(): string {
     return '';
   }

   /* Header color (only Android Multitask view)  */
   public static get HEADER_COLOR(): string {
     return '#fdd735';
   }

   /* Unit: km or mi  */
   public static get DEFAULT_UNIT(): string {
     return 'km';
   }
   /* Radius: */
   public static get DEFAULT_RADIUS(): string {
     return '0.5';
   }

   /* Map style: satellite or roadmap */
   public static get DEFAULT_MAP_STYLE(): string {
     return 'MAP_TYPE_NORMAL';
   }

   public static get DEFAULT_LANG(): string {
     return 'ru';
   }
}
