node version:- 14.15.0

**Being this command globally  to resolve when upgrade the node version**
npm install --global --production windows-build-tools
npm install --global node-gyp



**After Build APK, if API is not working then Add follwing line in the  AndroidManifest.xml file in application tag**
android:usesCleartextTraffic="true"

**On apk genrate if facing following problem**
> Task :capacitor-cordova-android-plugins:compileReleaseJavaWithJavac FAILED

run this following command to solve the above issue

npm install jetifier
npx jetifier
npx cap sync android


**Command for Build APK file Command**
- npm install
- npx cap init  (Initialize Capacitor)
- ionic build  (Build your Ionic App)
**For Android**
- npx cap add android  (It adds Platform)
- npx cap copy  (Every time you perform a build (e.g. ionic build) that changes your web directory (default: www), you’ll need to copy those changes down to your native projects:)
- if you want to open it on android studio
- npx cap open android (It Opens IDE to build, run, and deploy)
**or**
- cd android  (go to android folder)
- ./gradlew assembleDebug  (run this command for generate debug APK)
- ./gradlew bundleRelease  (run this command for generate release APK)


**For IOS**
- npx cap add ios  (It adds Platform)
- npx cap copy  (Every time you perform a build (e.g. ionic build) that changes your web directory (default: www), you’ll need to copy those changes down to your native projects:)
- if you want to open it on Xcode
- npx cap open ios 
