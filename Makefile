.PHONY: run

# certs and output
OUTPUT_FILE=DROMOS-V4.9.0.apk
# CHECK IF APP IS NOT IN SIMULATOR MODE!!!!!!!!!!
ALIAS=dromos
KEYPASS=dromos

# Example: /Users/your_user/Dev/release_keystore.keystore
KEYSTORE=Dromos.keystore
ANDROID_PATH=/usr/local/Cellar/android-sdk/24.2

UNSIGNED=platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk

# Replace with your package name defined in config.xml
PACKAGE='eu.innovapp.app.dromos'

# update android platform
rm-add-android:
	ionic cordova platform rm android
	rm -rf platforms/android
	ionic cordova platform add android@7.0.0

# update ios platform
rm-add-ios:
	ionic cordova platform rm ios
	rm -rf platforms/ios
	ionic cordova platform add ios

rm-add-node:
	rm -rf node_modules
	npm i

full-update: rm-add-node rm-add-android rm-add-ios

# create android signed apk
build-android:
	rm -f ./build/${OUTPUT_FILE}
	ionic cordova build android --release
	jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 -keystore ${KEYSTORE} -storepass ${KEYPASS} ${UNSIGNED} ${ALIAS}
	${ANDROID_PATH}/build-tools/23.0.2/zipalign -v 4 ${UNSIGNED} ./build/${OUTPUT_FILE}

# run ios
run-ios:
	ionic cordova run ios --target "iPhone-6, 11.2" --livereload

# create ios build
build-ios:
	ionic cordova build ios --release

execute:
	adb shell am start -n ${PACKAGE}/${PACKAGE}.MainActivity

# install a signed apk on a device
install:
	adb install -r ${OUTPUT_FILE}

# monitor logs and filter by package name
log:
	adb logcat | grep `adb shell ps | grep ${PACKAGE} | cut -c10-15`

run: sign install execute log
