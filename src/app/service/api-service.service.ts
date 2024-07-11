import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class ApiService {

  private apiUrl = environment.api_url; // URL de tu API

  constructor(private http: HttpClient) { }

  // Método para llamar a la API y enviar los archivos y el frame rate
  processVideo(files: File[], frameRates: number[]): Observable<Blob> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('frameRates', JSON.stringify(frameRates));

    // Ajusta la llamada HTTP con la configuración correcta del responseType
    return this.http.post(this.apiUrl + 'api/procesar-video', formData, { responseType: 'blob' });
  }
}
