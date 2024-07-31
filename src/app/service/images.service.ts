/*******************************Imports***********************************/
import { Injectable } from '@angular/core';
import { Subject, Observable, firstValueFrom } from 'rxjs';
import { ImageWithMetadata } from '../interface/imagewithmetadata';
import { Shape } from '../interface/shape';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import * as ExifReader from 'exifreader';
import { ApiService } from './api-service.service';
import { SpinnerService } from './spinner.service';


@Injectable({
  providedIn: 'root'
})

//Service to manage all Images
export class ImageService {
  /*******************************Variables***********************************/
  private images: ImageWithMetadata[] = [];
  private maxNumberImages: number = 0;
  private actualPage: number = 1;
  private imagePerPage: number = 10;

  private selectedImageId: string | null = null; // index image for process image
  private imagesSubject = new Subject<ImageWithMetadata[]>();
  private idSubject = new Subject<string | null>();

  private validFormats = ['yolo'];

  /*******************************Constructor***********************************/
  constructor(
    private spinnerService: SpinnerService ,
    private apiService: ApiService
  ) {}

  /************************Getter_and_Setter_Funtions***************************/
  getImages(): ImageWithMetadata[] {
    return this.images;
  }

  getMaxNumberImages(): number{
    return this.maxNumberImages;
  }

  getImagePerPage(): number{
    return this.imagePerPage;
  }

  getActualPage(): number{
    return this.actualPage;
  }

  setActualPage(actualPage: number): void{
    this.actualPage = actualPage;
  }

  //observer for image with metadata vector
  getImagesObservable(): Observable<ImageWithMetadata[]> {
    return this.imagesSubject.asObservable();
  }

  //observer for index
  getIndexObservable(): Observable<string | null> {
    return this.idSubject.asObservable();
  }

  //id of image processing
  setSelectedImageId(imageId: string | null): void {
    this.selectedImageId = imageId;
    this.idSubject.next(this.selectedImageId);
  }

  //save index with max number images
  async setMaxImages(): Promise<void> {
    try {
      const maxNumberImagesfromApi = await this.getMaxNumberImagesFromApi();
      this.maxNumberImages = maxNumberImagesfromApi;
    } catch (error) {
      console.error('Error fetching total images:', error);
    }
  }

  //save x image max locally (imagePerPage = 10)
  async setImages(): Promise<void> {
    const allPages = Math.ceil(this.maxNumberImages/this.imagePerPage);
    
    if(this.actualPage > 0 && this.actualPage <= allPages){
      this.spinnerService.show();
      try {
        const images = await this.getImagesFromApi(this.actualPage);
        this.images = images;
        this.imagesSubject.next([...this.images]);
        this.spinnerService.hide();
        
      } catch (error) {
        console.error('Error fetching images:', error);
        this.spinnerService.hide();
      }
    }
    else{
      console.log("Not valid pageNumber");
    }
  }

  //Get Images from api
  async getImagesFromApi(pageNumber: number ): Promise<ImageWithMetadata[]> {
    return new Promise<ImageWithMetadata[]>((resolve, reject) => {

      //subscribe to api, process all videos with their framerate
      this.apiService.getImages(pageNumber).subscribe({
        next: async (data: Blob) => {        
          try {
            //Get blob(ZIP file) and extract images
            console.log("Processing Blob with zip...")
            //console.log(data);
            const imagesFromVideo = await this.extractImagesFromZip(data);
            console.log("End processing Blob with zip...") 
            this.spinnerService.hide();//In case there's a connection error   
            resolve(imagesFromVideo);
          } catch (error) {
            console.error('Error processing files:', error);
            this.spinnerService.hide();//In case there's a connection error
            reject(error);
          }
        },
        error: (error) => {
          console.error('Error calling the API:', error);
          reject(error);
        }
      });
    });
  }

  //Get max number Images from api
  async getMaxNumberImagesFromApi(): Promise<number> {
    return new Promise<number>((resolve, reject) => {

      //subscribe to api, process all videos with their framerate
      this.apiService.getTotalImagesPages().subscribe({
        next: (response) => {
          this.spinnerService.hide();//In case there's a connection error
          try {
            //Get max number images
            resolve(response.totalImages);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          console.error('Error calling the API:', error);
          reject(error);
        }
      });
    });
  }
  

  /******************************Others_Functions*******************************/

  //Get blob (ZIP) and return ImageWithMetadata[] with all images and metadata
  async extractImagesFromZip(zipBlob: Blob): Promise<ImageWithMetadata[]> {
    try {
      // Create instance JSZip y charge File ZIP
      const zip = await JSZip.loadAsync(zipBlob);
  
      // Array for save all images
      const extractedFiles: ImageWithMetadata[] = [];
  
      // Iterate each files from File ZIP
      await Promise.all(
        Object.keys(zip.files).map(async (fileName) => {
          const zipEntry = zip.files[fileName];
  
          // Check if file is a folder or file
          if (!zipEntry.dir) {
            // Get file like blob
            const fileData = await zipEntry.async('blob');
  
            // Create file 
            const file = new File([fileData], zipEntry.name, { type: fileData.type });
  
            // Extract ID from file name
            const idMatch = fileName.match(/image-(\d+)-(.+)\.png$/);
            const imageId = idMatch ? idMatch[2] : ''; // Extract the ID

            try {
              const metadata = await this.extractMetadataFromImage(file);
              const imageWithMetadata: ImageWithMetadata = { id: imageId, file, metadata };
              extractedFiles.push(imageWithMetadata);
              console.log("Image with metadatos");
            } catch (error) {
              //console.log(error)
              // If not possible get metadata from image, save image without metadata
              const imageWithMetadata: ImageWithMetadata = { id: imageId, file, metadata: null };
              extractedFiles.push(imageWithMetadata);
              console.log("Image without metadatos");
            }
          }
        })
      );
  
      return extractedFiles;
    } catch (error) {
      console.error('Error with extract file from ZIP:', error);
      throw error;
    }
  }

  //Methot for extract json metadata from a file
  async extractMetadataFromImage(image: File): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event: any) => {
        try {
          const arrayBuffer = event.target.result;

          // Use ExifReader to get metadat
          const tags = ExifReader.load(arrayBuffer);

          if (tags && tags['UserComment']) {
            const userComment = tags['UserComment'].description;
            
            try {
              const shapes = JSON.parse(userComment);
              resolve(shapes);
            } catch (error) {
              reject('Error to transform UserComment to shapes.');
            }
          } else {
            reject('UserComment is not find on metadata from image.');
          }
        } catch (error) {
          console.error('Error processing metadata EXIF:', error);
          reject('Error processing metadata EXIF.');
        }
      };

      reader.onerror = (error) => {
        console.error('Error readding file:', error);
        reject('Error readding file.');
      };

      reader.readAsArrayBuffer(image);
    });
  }   

  // Add deleteImage method to the service
  async deleteImage(imageId: string): Promise<void> {
    this.apiService.deleteImage(imageId).subscribe({
      next: response => {
        console.log('Image deleted successfully');
      },
      error: err => {
        console.error('Failed to delete image', err);
      }
    });
  }

  //Updata metadata
  async updateMetadata(newImageWithMetadata: ImageWithMetadata): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const jsonData = JSON.stringify(newImageWithMetadata.metadata);
      this.apiService.embedInfoInImage(newImageWithMetadata.id, jsonData).subscribe({
        next: () => {
          console.log('Metadata updated successfully');
          resolve();
        },
        error: (error) => {
          console.error('Error updating metadata', error);
          reject(error);
        }
      });
    });
  }

  //save image withmetada for download
  async saveImageWithMetadata(): Promise<void> {
    if(this.selectedImageId!==null){
      this.spinnerService.show();
      return new Promise<void>((resolve, reject) => {
        this.apiService.getImageById(this.selectedImageId).subscribe({
          next: (blob) => {
            this.downloadImage(blob, this.selectedImageId);
            console.log('Metadata saved');
            resolve();
          },
          error: (error) => {
            console.error('Error downloading image:', error);
            reject(error);
          },
          complete: () => {
            this.spinnerService.hide();
          }
        });
      });
    }
  }

  //save all images withmetada for download
  async saveAllImagesWithMetadata(): Promise<void> {
    this.spinnerService.show();
    return new Promise<void>((resolve, reject) => {
      this.apiService.getAllImages().subscribe({
        next: (blob) => {
          this.downloadImage(blob, null);
          console.log('All images downloaded with metadata');
          resolve();
        },
        error: (error) => {
          console.error('Error downloading images:', error);
          reject(error);
        },
        complete: () => {
          this.spinnerService.hide();
        }
      });
    });
  }

  //download zip or image
  private async downloadImage(blob: Blob, id: string | null): Promise<void> {
    //check if zip is empty
    try{
      const zip = await this.loadZip(blob);
      if (Object.keys(zip.files).length === 0) {
        console.log('No images found, zip file is empty');
        return;
      }
    }catch{
      console.error("Error processing zip file");
    };

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    if(id){
      a.download = `image-${id}.png`;
    }else{
      a.download = 'images.zip';
    }
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  //load zip
  private async loadZip(blob: Blob): Promise<JSZip> {
    const jsZip = new JSZip();
    return jsZip.loadAsync(blob);
  }

  // Generate and download ZIP file with format
  async exportSelectedImage(selectedFormat: string): Promise<void> {
    // Check format
    if (!this.validFormats.includes(selectedFormat)) {
      console.log('No valid format');
      return;
    }
    if(this.selectedImageId !== null){
      this.spinnerService.show();
      return new Promise<void>((resolve, reject) => {
        this.apiService.exportImage(this.selectedImageId, selectedFormat).subscribe({
          next: (blob) => {
            this.downloadImage(blob, null);
            console.log('Image exported');
            resolve();
          },
          error: (error) => {
            console.error('Error export file:', error);
            reject(error);
          },
          complete: () => {
            this.spinnerService.hide();
          }
        });
      });
    }
  }

  // Generate and download ZIP file for all images with format
  async exportAllImages(selectedFormat: string): Promise<void> {
    // Check format
    if (!this.validFormats.includes(selectedFormat)) {
      console.error('No valid format');
      return;
    }
    this.spinnerService.show();
      return new Promise<void>((resolve, reject) => {
        this.apiService.exportAllImages(selectedFormat).subscribe({
          next: (blob) => {
            this.downloadImage(blob, null);
            console.log('All images exported');
            resolve();
          },
          error: (error) => {
            console.error('Error export file:', error);
            reject(error);
          },
          complete: () => {
            this.spinnerService.hide();
          }
        });
      });
  }

}
