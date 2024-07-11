/*******************************Imports***********************************/
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ImageService } from './service/images.service';
import { SpinnerService } from './service/spinner.service';
import { ApiService } from './service/api-service.service';
import * as JSZip from 'jszip';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})

//Class for Main Component APP
export class AppComponent implements OnInit {

  /*******************************Decorators***********************************/
  @Output() receiveSaveCurrentImagefromAPP = new EventEmitter<void>();
  @Output() receiveSaveAllImagesfromAPP = new EventEmitter<void>();


  /*******************************Variables***********************************/
  showSpinner:boolean = false;
  isModalVisible: boolean = false;
  frameRate: number = 1;

  filesFromHeader: File[] = [];
  videoFilesWithSettings: { file: File, captureInterval: number}[] = [];
  imageToService: File[] = [];

  /*******************************Constructor***********************************/
  constructor(
    private imageService: ImageService,
    private spinnerService: SpinnerService,
    private apiService: ApiService
  ) {}

  /******************************Angular_Functions*******************************/
  ngOnInit(): void {
    this.spinnerService.spinnerState.subscribe(state => {
      this.showSpinner = state;
    });
  }

  /******************************Handle_Functions*******************************/
  handleSaveCurrentImage() {
    this.receiveSaveCurrentImagefromAPP.emit();
  }

  handleSaveAllImages() {
    this.receiveSaveAllImagesfromAPP.emit();
  }

  handleFilesUploaded(files: File[]): void {
    this.filesFromHeader = files;

    //Get videos from file array
    this.videoFilesWithSettings = [];
    this.imageToService = [];
    for (let i = 0; i < this.filesFromHeader.length; i++) {
      const file = this.filesFromHeader[i];
      if (file.type.startsWith('video/')) {
        this.videoFilesWithSettings.push({
          file,
          captureInterval: 1
        });
      }else{
        this.imageToService.push(file);
      }
    }

    //Show modal to manage videos if there are videos
    if (this.videoFilesWithSettings.length > 0){
      this.showModal();
    }else{
      //Call Service to add images
      this.imageService.addImages(this.imageToService);
    }
  }

  /******************************Others_Functions*******************************/
  //Show modal to manage videos
  showModal() {
    this.isModalVisible = true;
  }

  //Remove video file button from modal
  removeFile(i: number): void {
    this.videoFilesWithSettings.splice(i,1);

    if ( this.videoFilesWithSettings.length === 0 && this.imageToService.length === 0){
      this.isModalVisible = false;
    }
  }

  //Cancel button from modal
  cancel(): void {
    this.isModalVisible = false;
  }

  //Confirm button from modal
  async confirm(): Promise<void> {
    this.isModalVisible = false;
    this.spinnerService.show();

    try {
      console.log("Processing video...");
      const frames = await this.extractFrames(this.videoFilesWithSettings);
      console.log("Processing video finished");

      console.log(frames);

      //Merge image with image from video
      this.imageToService.push(...frames);
      //Call image service to add new images
      this.imageService.addImages(this.imageToService);
    } catch (error) {
        console.error("Error processing video frames:", error);
    } finally {
        this.spinnerService.hide();
    }
  }

  //Extract Frames from videoFiles with Framerate
  async extractFrames(videoFilesWithSettings: { file: File, captureInterval: number }[]): Promise<File[]> {
    return new Promise<File[]>((resolve, reject) => {
      const files = videoFilesWithSettings.map(videoFile => videoFile.file);
      const frameRates = videoFilesWithSettings.map(videoFile => videoFile.captureInterval);

      //subscribe to api, process all videos with their framerate
      this.apiService.processVideo(files, frameRates).subscribe({
        next: async (data: Blob) => {
          try {
            //Get blob(ZIP file) and extract images
            console.log("Processing Blob with zip...")
            const imagesFromVideo = await this.extractImagesFromZip(data);
            console.log("End processing Blob with zip...")
            resolve(imagesFromVideo);
          } catch (error) {
            console.error('Error processing files:', error);
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
  
  //Get blob (ZIP) and return file[] with all images
  async extractImagesFromZip(zipBlob: Blob): Promise<File[]> {
    try {
      // Create instance JSZip y charge File ZIP
      const zip = await JSZip.loadAsync(zipBlob);
  
      // Array for save all images
      const extractedFiles: File[] = [];
  
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
  
            // Add file to array for save all images
            extractedFiles.push(file);
          }
        })
      );
  
      return extractedFiles;
    } catch (error) {
      console.error('Error with extract file from ZIP:', error);
      throw error;
    }
  }
}