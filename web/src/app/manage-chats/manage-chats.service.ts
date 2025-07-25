import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class ManageChatsService {
	apiHostUrl: string;
	type: string = null;

	constructor(private http: HttpClient) {
		//For Staging and Production
		let hostName = window.location.origin.toLowerCase();
		if (hostName.endsWith(environment.dripHostPlacholder)) {
			this.type = 'drip';
			this.apiHostUrl = hostName + '/v1';
		} else if (hostName.endsWith(environment.diwoHostPlacholder)) {
			this.type = 'diwo';
			this.apiHostUrl = hostName + '/v1';
		}

		//For Dev and Local
		if (!this.apiHostUrl) {
			this.apiHostUrl = environment.apiUrl;
		}
		if (!this.type) {
			this.type = localStorage.getItem('projectName');
		}
	}

	getAllChatData(page, limit) {
		return this.http.get(`${this.apiHostUrl}/get-all-chats-data?page=${page}&limit=${limit}`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSingleUserChat(clientId, UserId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/${UserId}/get-single-user-chats-data`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	sendWhatsAppMesReply(clientId, payload) {
		return this.http.post(`${this.apiHostUrl}/${clientId}/send-whatsapp-chat-reply`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}

	chatMarkAsRead(clientId, chatId) {
		return this.http.get(`${this.apiHostUrl}/${clientId}/${chatId}/whatsapp-chat-mark-as-read`).pipe(
			map((data) => {
				return data;
			})
		);
	}

	getSearchWhatsAppChats(payload, page, limit) {
		return this.http.post(`${this.apiHostUrl}/search/whatsapp-chats?page=${page}&limit=${limit}`, payload).pipe(
			map((data) => {
				return data;
			})
		);
	}
}
