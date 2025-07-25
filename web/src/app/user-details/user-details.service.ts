import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: "root",
})
export class UserDetailsService {
    apiHostUrl: string;

    constructor() {
        //For Staging and Production
        let hostName = window.location.origin.toLowerCase();
        if (hostName.endsWith(environment.dripHostPlacholder)) {
            this.apiHostUrl = hostName + "/v1";
        } else if (hostName.endsWith(environment.diwoHostPlacholder)) {
            this.apiHostUrl = hostName + "/v1";
        }

        //For Dev and Local
        if (!this.apiHostUrl) {
            this.apiHostUrl = environment.apiUrl;
        }
    }
}
