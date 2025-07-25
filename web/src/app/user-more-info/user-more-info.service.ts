import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { map, startWith } from "rxjs/operators";
import { environment } from "./../../environments/environment";
@Injectable({
  providedIn: "root",
})
export class UserMoreInfoService {
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

  getPackagePuchaseHistoryById(userId: any) {
    return this.http.get(`${this.apiHostUrl}/users/` + userId + `/packages?status=all`)
      .pipe(map((data) => {
        return data;
      }));
  }
  getExpertCallHistory(userId: any) {
    return this.http.get(`${this.apiHostUrl}/tickets/manage?user=` + userId)
      .pipe(map((data) => {
        return data;
      }));
  }

  getSupportTicketHistory(userId: any) {
    return this.http.get(`${this.apiHostUrl}/supports/${userId}`)
      .pipe(map((data) => {
        return data;
      }));
  }

  getDeductionsDetails(id: any) {
    return this.http.get(`${this.apiHostUrl}/packages/deductions/` + id)
      .pipe(map((data) => {
        return data;
      }));
  }

  deleteBuyItem(id: any, data: any) {
    let restricted_roles = ['Super Admin', 'Admin', 'Support Admin', 'Operations', 'Global Operations', 'Global Finance', 'Finance'];
    let user_role = localStorage.getItem('role') || '';
    let raise = false;
    let approverRole = "Global Super Admin";
    let aprovedByAdmin = true;

    let index = restricted_roles.indexOf(user_role);
    if (index >= 0) {
      raise = true;
      if (approverRole = "Global Super Admin") {
        if (user_role == "Admin") {
          aprovedByAdmin = false;
        }
      }
    }

    return this.http.put(`${this.apiHostUrl}/packages/cancel/` + id + `?raise=${raise}&approver=${approverRole}&aprovedByAdmin=${aprovedByAdmin}`, data)
      .pipe(map((data) => {
        return data;
      }));
  }

  getActivityLogHistory(userId: any) {
    return this.http.get(`${this.apiHostUrl}/web/users/logs/${userId}`)
      .pipe(map((data) => {
        return data;
      }));
  }

  getNotifications(userId: any) {
    return this.http.get(`${this.apiHostUrl}/users/${userId}/alerts`)
      .pipe(map((data) => {
        return data;
      }));
  }

  savePackageProductData(data: any) {
    return this.http.post(`${this.apiHostUrl}/edit/package`, data)
      .pipe(map((data) => {
        return data;
      }));
  }

  getMaterialBoxSetName(market: any) {
    return this.http.get(`${this.apiHostUrl}/web/material-box-set-names/${market}`);
  }
}
