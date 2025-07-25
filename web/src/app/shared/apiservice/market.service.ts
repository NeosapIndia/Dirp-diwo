import { Injectable } from '@angular/core';
import { HttpClient,HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class MarketService {

  constructor( private http: HttpClient) {
    const httpOptions = {
        headers: new HttpHeaders({
            'Content-Type':  'application/json',
            'Authorization': 'my-auth-token'
        })
    }
}
    
  getCountries(type: any) {
      return this.http.get(`${environment.apiUrl}/markets/countries`);
  }
}
