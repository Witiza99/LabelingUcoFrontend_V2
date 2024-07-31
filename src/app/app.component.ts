/*******************************Imports***********************************/
import { Component, Output, EventEmitter, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { ImageService } from './service/images.service';
import { SpinnerService } from './service/spinner.service';
import { ApiService } from './service/api-service.service';
import { isPlatformBrowser } from '@angular/common';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})

//Class for Main Component APP
export class AppComponent implements OnInit, OnDestroy {

  /*******************************Decorators***********************************/
  @Output() receiveSaveCurrentImagefromAPP = new EventEmitter<void>();
  @Output() receiveSaveAllImagesfromAPP = new EventEmitter<void>();
  @Output() receiveExportCurrentImagefromAPP = new EventEmitter<string>();
  @Output() receiveExportAllImagesfromAPP = new EventEmitter<string>();


  /*******************************Variables***********************************/
  showSpinner:boolean = false;
  messageSpinner:string | null = null;
  isModalVisible: boolean = false;
  frameRate: number = 1;

  filesFromHeader: File[] = [];
  videoFilesWithSettings: { file: File, captureInterval: number}[] = [];
  imageToApi: File[] = [];

  private isBrowser: boolean;

  /*******************************Constructor***********************************/
  constructor(
    private imageService: ImageService,
    private spinnerService: SpinnerService,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /******************************Angular_Functions*******************************/
  ngOnInit(): void {
    this.spinnerService.spinnerState.subscribe(state => {
      this.showSpinner = state;
    });
    this.spinnerService.spinnerMessage.subscribe(state => {
      this.messageSpinner = state;
    });
  }

  async ngOnDestroy(): Promise<void> {
    if (this.isBrowser) {
      console.log('ngOnDestroy called');
      try {
        await this.cleanupSession();
      } catch (error) {
        console.error('Error during session cleanup', error);
      }
    }
  }

  

  /******************************Handle_Functions*******************************/
  handleSaveCurrentImage() {
    this.receiveSaveCurrentImagefromAPP.emit();
  }

  handleSaveAllImages() {
    this.receiveSaveAllImagesfromAPP.emit();
  }

  handleExportCurrentImage(selectedFormat: string) {
    this.receiveExportCurrentImagefromAPP.emit(selectedFormat);
  }

  handleExportAllImages(selectedFormat: string) {
    this.receiveExportAllImagesfromAPP.emit(selectedFormat);
  }

  async handleFilesUploaded(files: File[]): Promise<void> {
    this.filesFromHeader = files;

    //Get videos from file array
    this.videoFilesWithSettings = [];
    this.imageToApi = [];
    for (let i = 0; i < this.filesFromHeader.length; i++) {
      const file = this.filesFromHeader[i];
      if (file.type.startsWith('video/')) {
        this.videoFilesWithSettings.push({
          file,
          captureInterval: 1
        });
      }else{
        this.imageToApi.push(file);
      }
    }

    //Show modal to manage videos if there are videos
    if (this.videoFilesWithSettings.length > 0){
      this.showModal();
    }else{
      //Methot for upload images
      this.spinnerService.show("Uploading images to the server, please wait...");
      try {
        await this.uploadImages(this.imageToApi);
        console.log('Images uploaded successfully');
        await this.imageService.setMaxImages();
        this.imageService.setImages();
      } catch (error) {
        console.error('Error uploading images:', error);
      } finally {
        this.spinnerService.hide();
      }
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

    if ( this.videoFilesWithSettings.length === 0 && this.imageToApi.length === 0){
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
    this.spinnerService.show("Uploading images to the server, please wait...");

    if(this.imageToApi.length > 0){
      try {
        await this.uploadImages(this.imageToApi);
        console.log('Images uploaded successfully');
      } catch (error) {
        console.error('Error uploading images:', error);
      }
    }
    this.spinnerService.show("Uploading videos to the server and processing them into images...");
    try {
      console.log("Processing video...");
      await this.extractFrames(this.videoFilesWithSettings);
      console.log("Processing video finished");
      await this.imageService.setMaxImages();
      this.imageService.setImages();
    } catch (error) {
        console.error("Error processing video frames:", error);
    } finally {
        this.spinnerService.hide();
    }
  }

  //Upload Images to backend
  async uploadImages(images: File[] ): Promise<void> {
    return new Promise<void>((resolve, reject) => {

      //subscribe to api, upload all images
      this.apiService.uploadImages(images).subscribe({
        next: () => {
          this.spinnerService.hide();//In case there's a connection error
          resolve();
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  //Extract Frames from videoFiles with Framerate
  async extractFrames(videoFilesWithSettings: { file: File, captureInterval: number }[]): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const files = videoFilesWithSettings.map(videoFile => videoFile.file);
      const frameRates = videoFilesWithSettings.map(videoFile => videoFile.captureInterval);

      //subscribe to api, process all videos with their framerate
      this.apiService.processVideo(files, frameRates).subscribe({
        next: () => {
          this.spinnerService.hide();//In case there's a connection error
          resolve();
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  //cleanup session
  async cleanupSession(): Promise<void> {
    return new Promise<void>((resolve, reject) => {

      //subscribe to api, end session
      this.apiService.endSession().subscribe({
        next: () => {
          this.spinnerService.hide();//In case there's a connection error
          resolve();
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
}