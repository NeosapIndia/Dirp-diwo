import { Injectable, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { map } from "rxjs/operators";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ManageUserService {
  restricted_roles = ["Super Admin", "Admin"];
  approverRole = "Global Super Admin";
  ip_address: string;
  mac_address: string;
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

  getAllBuyerList() {
    return this.http.get(`${this.apiHostUrl}/get-all-client-list`).pipe(map(data => {
      return data;
    }))
  }

  getClientAllUsers(buyer) {
    return this.http.get(`${this.apiHostUrl}/get-all-user-by-client/${buyer}`).pipe(map(data => {
      return data;
    }))
  }


}
