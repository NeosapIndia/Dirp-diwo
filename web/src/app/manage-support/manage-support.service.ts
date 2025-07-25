import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ManageSupportService {
  apiHostUrl: string;

  type: string = null;
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
      this.type = 'drip';
    } else if (hostName.endsWith(environment.diwoHostPlacholder)) {
      this.apiHostUrl = hostName + "/v1";
      this.type = 'diwo';
    }

    //For Dev and Local
    if (!this.apiHostUrl) {
      this.apiHostUrl = environment.apiUrl;
    }
    if (!this.type) {
      this.type = localStorage.getItem('projectName');
    }
  }


  createTicket(payload,userClientId) {
    return this.http.post(`${this.apiHostUrl}/supports?type=${this.type}&clientId=${userClientId}`, payload).pipe(map(data => {
      return data;
    }));
  }


  getSupportTicket(userId,userClientId,page, limit) {
    return this.http.get(`${this.apiHostUrl}/supports/${userId}?type=${this.type}&clientId=${userClientId}&page=${page}&limit=${limit}`)
      .pipe(map(data => {
        return data;
      }));
  }


}
