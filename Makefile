.PHONY: run

# certs and output
OUTPUT_FILE=NearmeApp-Ionic2.apk
ALIAS=REPLACE_WITH_YOUR_KEYSTORE_ALIAS
KEYPASS=REPLACE_WITH_YOUR_KEYSTORE_PASSWORD

# Example: /Users/your_user/Dev/release_keystore.keystore
KEYSTORE=REPLACE_WITH_YOUR_KEYSTORE_ALIAS

UNSIGNED=platforms/android/build/outputs/apk/android-release-unsigned.apk

# Replace with your package name defined in config.xml
PACKAGE='com.quanlabs.nearmeapp'

# create a signed apk
sign:
	rm -f ${OUTPUT_FILE}
	ionic cordova build android --prod --release
	jarsigner -verbose -sigalg MD5withRSA -digestalg SHA1 -keystore ${KEYSTORE} -storepass ${KEYPASS} ${UNSIGNED} ${ALIAS}
	/Users/fer/Library/Android/sdk/build-tools/23.0.2/zipalign -v 4 ${UNSIGNED} ${OUTPUT_FILE}

execute:
	adb shell am start -n ${PACKAGE}/${PACKAGE}.MainActivity

# install a signed apk on a device
install:
	adb install -r ${OUTPUT_FILE}

# monitor logs and filter by package name
log:
	adb logcat | grep `adb shell ps | grep ${PACKAGE} | cut -c10-15`

run: sign install execute log
