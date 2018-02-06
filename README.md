ionic cordova run ios --target "iPhone-5s, 11.1" --livereload
ionic cordova run ios --target "iPhone-6, 11.0" --livereload

ionic cordova build ios
ionic cordova build ios --prod

ionic cordova build android
ionic cordova build android --release
ionic cordova build android --prod
ionic cordova build android --verbose

Reinstall platform IOS:
 ionic cordova platform rm ios
 ionic cordova platform add ios
 ionic cordova plugin save

ionic cordova platform rm android
ionic cordova platform add android
ionic cordova platform add android@6.3.0

Emulate Android:
ionic cordova run android
ionic cordova run android --device

 Bug: Razreshena vihoda v internet iz app 
ionic cordova plugin remove cordova-plugin-whitelist
ionic cordova plugin add cordova-plugin-whitelist
ionic cordova prepare

--> keytool -genkey -v -keystore Dromos.keystore -alias Dromos -keyalg RSA -keysize 2048 -validity 10000
--> ionic cordova build android --release
--> jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ./Dromos.keystore ./platforms/android/build/outputs/apk/android-release-unsigned.apk Dromos
--> /Users/andreycernenco/Library/Android/sdk/build-tools/27.0.3/zipalign -v 4 ./platforms/android/build/outputs/apk/android-release-unsigned.apk Dromos.apk
ssh -R incubo:80:localhost:1337 serveo.net
