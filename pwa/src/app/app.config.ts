import { Injectable } from "@angular/core";
import { ENV } from "../environments/environment";
@Injectable()
export class AppConfig {
  constructor() { }

  getHost() {
    let apiHostUrl;

    //For Staging and Production

    let hostName = window.location.origin.toLowerCase();
    if (hostName.endsWith(ENV.dripHostPlacholder)) {
      apiHostUrl = hostName + '/v1';
    } else if (hostName.endsWith(ENV.diwoHostPlacholder)) {
      apiHostUrl = hostName + '/v1';
    }

    if (apiHostUrl) {
      return apiHostUrl
    } else {
      return ENV.host + 'v1';
    }

  }

  getImageHost() {
    return ENV.imageHost + ENV.imagePath;
  }

  getAppVersion() {
    return ENV.appVersion;
  }

  //ionic cordova build browser --prod --release
}
