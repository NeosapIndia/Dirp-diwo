import { Injectable } from "@angular/core";
import {
    HttpClient,
    HttpErrorResponse,
    HttpHeaders,
} from "@angular/common/http";
import { map, catchError } from "rxjs/operators";
import { environment } from "../../../environments/environment";
import { Observable, throwError } from "rxjs";

import { User } from "../models";

@Injectable()
export class UserService {
    ip_address;
    mac_address;
    apiHostUrl: string;
    constructor(private http: HttpClient) {
        const httpOptions = {
            headers: new HttpHeaders({
                "Content-Type": "application/json",
                Authorization: "my-auth-token",
            }),
        };

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

    register(user: User, ip_address) {
        user.ip_address = ip_address;
        user.mac_address = this.mac_address;
        return this.http.post(`${this.apiHostUrl}/users`, user).pipe(
            map((data) => {
                return data;
            })
        );
    }

    postEmail(emailobj) {
        return this.http.post(`${this.apiHostUrl}/users/detail`, emailobj).pipe(
            map((data) => {
                return data;
            })
        );
    }

    postMobile(phoneObj) {
        return this.http.post(`${this.apiHostUrl}/users/detail`, phoneObj).pipe(
            map((data) => {
                return data;
            })
        );
    }

    public getPosition(): Observable<any> {
        return Observable.create((observer) => {
            navigator.geolocation.watchPosition((pos: any) => {
                observer.next(pos);
            }),
                () => {
                    console.log("Position is not available");
                },
                {
                    enableHighAccuracy: true,
                };
        });
    }

    getAddress(api) {
        return this.http.get<any>(api).pipe(
            map((data) => {
                return data;
            })
        );
    }

    loginAsUser(data, market) {
        //market changes
        return this.http
            .post<any>(
                `${this.apiHostUrl}/usersloginbyAdmin?market=${market}`,
                data
            )
            .pipe(
                map((data) => {
                    return data;
                })
            );
    }
}
