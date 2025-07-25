import { Injectable } from "@angular/core";
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
} from "@angular/common/http";
import { Observable, of, throwError } from "rxjs";
import { environment } from "../../../environments/environment";

import { User } from "../models";

@Injectable()
export class ActivityService {
    apiHostUrl: string;
    constructor(private http: HttpClient) {
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

    getMasterData(type: any) {
        return this.http.get(
            `${this.apiHostUrl}/users/activity/master-data/` + type
        );
    }

    getMarketData() {
        return this.http.get(`${this.apiHostUrl}/markets`);
    }

    createActivityData(data: any) {
        return this.http.post(`${this.apiHostUrl}/activities`, data);
    }

    getActivities() {
        return this.http.get(`${this.apiHostUrl}/activities`);
    }

    getActivity(id: any) {
        return this.http.get(`${this.apiHostUrl}/activities/` + id);
    }

    updateActivity(id: any, data: any) {
        return this.http.put(`${this.apiHostUrl}/activities/` + id, data);
    }
}
