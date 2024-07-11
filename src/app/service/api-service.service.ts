/*******************************Imports***********************************/
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

//Service connect to Api
export class ApiService {
  /*******************************Variables***********************************/
  private apiUrl = environment.api_url; // API URL

   /************************Getter_and_Setter_Funtions***************************/
  constructor(private http: HttpClient) { }

  /******************************Others_Functions*******************************/
  // Methot to call Api with files and framerate
  processVideo(files: File[], frameRates: number[]): Observable<Blob> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('frameRates', JSON.stringify(frameRates));

    return this.http.post(this.apiUrl + 'api/process-video', formData, { responseType: 'blob' });
  }
  // Methot to call Api with file and json (metadata)
  embedInfoInImage(imageFile: File, jsonData: string){
    // Create FormData to send image and Json to backend
    const formData = new FormData();
    formData.append('imagen', imageFile);
    formData.append('jsonMetadata', jsonData);

    return this.http.post(environment.api_url + 'api/add-metadata', formData, {
      responseType: 'blob',
    });
  }
}
