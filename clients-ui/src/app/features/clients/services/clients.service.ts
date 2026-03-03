import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../core/config/api.config';
import { Client, ClientCreate, ClientUpdate } from '../models/client.model';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly base = `${this.apiUrl}/clients`;

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(this.base);
  }

  getById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.base}/${id}`);
  }

  create(payload: ClientCreate): Observable<Client> {
    return this.http.post<Client>(this.base, payload);
  }

  update(id: string, payload: ClientUpdate): Observable<Client> {
    return this.http.patch<Client>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
