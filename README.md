ionic cordova run ios --target "iPhone-6, 11.1" --livereload
ionic cordova build ios

Reinstall platform IOS:
  cordova plugin save
  cordova platform rm ios
  cordova platform add ios
