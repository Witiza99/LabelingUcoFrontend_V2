/*******************************Imports***********************************/
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { SpinnerService } from './spinner.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})

//Service connect to Api
export class ApiService {
  /*******************************Variables***********************************/
  private apiUrl = environment.api_url; // API URL
  private sessionId: string | null = null;
  private retryDelay = 10000; // 10 seconds delay for retries

  /******************************Constructor*********************************/
  constructor(
    private http: HttpClient,
    private spinnerService: SpinnerService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.startSession().subscribe({
        next: response => {
          this.sessionId = response.sessionId;
          console.log('New session ->', this.sessionId);
          this.startSessionPing(); // Start sending pings
          this.spinnerService.hide(); // Hide spinner on successful connection
        },
        error: err => {
          console.error('Failed to start session', err);
          this.spinnerService.hide(); // Hide spinner on successful connection
        }
      });
    }
  }

  /******************************Handle*********************************/

  private handleApiError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 0) {
      this.spinnerService.show('Attempting to connect to the server...');
    } else if (error.status === 400 && error.error.error === 'Invalid session ID') {
      alert('Session has been lost. Please reload the page.');
      window.location.reload(); // Recargar la página automáticamente
    }
    return throwError(() => error);
  }


  /******************************Functions*********************************/

  private startSession(): Observable<{ sessionId: string }> {
    this.spinnerService.show('Attempting to connect to the server...'); // Show spinner with message
    return this.http.post<{ sessionId: string }>(this.apiUrl + 'api/start-session', {}).pipe(
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      }),
      catchError((error: HttpErrorResponse) => this.handleApiError(error))
    );
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    if (this.sessionId) {
      headers = headers.set('x-session-id', this.sessionId);
    }
    return headers;
  }

  //endpoint to end session
  endSession(): Observable<any> {
    return this.http.post(this.apiUrl + 'api/end-session', {}, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

  // New method to ping the session
  private pingSession(): Observable<any> {
    return this.http.post(this.apiUrl + 'api/ping-session', {}, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      }),
    );
  }

  private startSessionPing() {
    if (this.sessionId) {
      setInterval(() => {
        this.pingSession().subscribe({
          next: () => {
            console.log('Session pinged successfully')
            this.spinnerService.hide(); // Hide spinner on successful ping
          },
          error: (error) => console.error('Error pinging session', error)
        });
      }, 120000); // Send ping every 2 min
    }
  }

  // Methot to call Api with files and framerate
  processVideo(files: File[], frameRates: number[]): Observable<any>{
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('frameRates', JSON.stringify(frameRates));

    return this.http.post(this.apiUrl + 'api/process-video', formData, { 
      headers: this.getHeaders()
     }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }
  
  // Methot to upload images
  uploadImages(files: File[]): Observable<any> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    return this.http.post(this.apiUrl + 'api/upload-images', formData, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

  // Get image with id
  getImageById(imageId: string | null): Observable<Blob> {
    return this.http.get(this.apiUrl + 'api/image/' + imageId, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity,
        delay: this.retryDelay
      })
    );
  }

  // Method to get images with pagination
  getImages(pageNumber: number): Observable<Blob> {
    return this.http.get(this.apiUrl + `api/images?pageNumber=${pageNumber}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

  // Method to get total number of images
  getTotalImagesPages(): Observable<{ totalImages: number }> {
    return this.http.get<{ totalImages: number }>(this.apiUrl + 'api/number-pages-total-images', {
      headers: this.getHeaders()
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

  // Method to get all images
  getAllImages(): Observable<Blob> {
    return this.http.get(this.apiUrl + 'api/all-images', {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

  // New method to delete an image
  deleteImage(imageId: string): Observable<any> {
    return this.http.delete(this.apiUrl + "api/delete-image/"+imageId, {
      headers: this.getHeaders()
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

  // Methot to call Api with file and json (metadata)
  embedInfoInImage(id: string, jsonData: string){
    // Create FormData to send image and Json to backend
    const formData = new FormData();
    formData.append('id', id);
    formData.append('jsonMetadata', jsonData);
    return this.http.post(environment.api_url + 'api/add-metadata', formData, {
      headers: this.getHeaders(),
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

  // Methot to export image with YOLO format
  exportImage(id: string | null, format: string): Observable<Blob> {
    const url = this.apiUrl + "export-image/" + id + "/"+ format;
    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getHeaders()
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

  // Methot to export image with YOLO format
  exportAllImages(format: string): Observable<Blob> {
    const url = this.apiUrl + "export-all-images/" + format;
    return this.http.get(url, {
      responseType: 'blob',
      headers: this.getHeaders()
    }).pipe(
      tap({
        error: (error) => this.handleApiError(error)
      }),
      retry({
        count: Infinity, // Retry indefinitely
        delay: this.retryDelay // Apply delay between retries
      })
    );
  }

}
