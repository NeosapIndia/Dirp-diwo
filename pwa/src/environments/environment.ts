// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// export const environment = {
//   production: false
// };

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

export const environment = {
  production: false
};

export const ENV: any = {
  mode: 'Staging',                             //  'Staging',

// Local Config
host:         "http://localhost:3587/",        //  "http://qa1.gobablr.com:3500/",
imageHost: "http://localhost:3587/",        //  "http://qa1.gobablr.com:3502/",

// Dev Server Config
// host: "http://qa1.gobablr.com:3500/",        //  "http://qa11.gobablr.com:3500/",
// imageHost: "http://qa1.gobablr.com:3500/",        //  "http://qa11.gobablr.com:3502/",

imagePath:"public/uploads/",
appVersion:"0.0.1",
basehref: "/",

dripHostPlacholder :'.senddrip.com',
diwoHostPlacholder :'.godiwo.com'

};
