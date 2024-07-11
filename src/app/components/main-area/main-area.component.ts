/*******************************Imports***********************************/
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import { ImageWithMetadata } from '../../interface/imagewithmetadata';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-area',
  templateUrl: './main-area.component.html',
})

//Class Main Area Component
export class MainAreaComponent implements OnInit {
  /*******************************Decorators***********************************/
  @Input() receiveSaveCurrentImage!: EventEmitter<void>;
  @Input() receiveSaveAllImages!: EventEmitter<void>;
  @Output() SaveCurrentImageEvent = new EventEmitter<void>();
  @Output() SaveAllImagesEvent = new EventEmitter<void>();

  /*******************************Variables***********************************/
  private saveCurrentImageSubscription!: Subscription;
  private saveAllImagesSubscription!: Subscription;
  selectedImage: ImageWithMetadata | null = null;

  /******************************Angular_Functions*******************************/
  ngOnInit() {
    this.saveCurrentImageSubscription = this.receiveSaveCurrentImage.subscribe(() => {
      this.handleSaveCurrentImage();
    });

    this.saveAllImagesSubscription = this.receiveSaveAllImages.subscribe(() => {
      this.handleSaveAllImages();
    });
  }

  ngOnDestroy() {
    if (this.saveCurrentImageSubscription) {
      this.saveCurrentImageSubscription.unsubscribe();
    }
    if (this.saveAllImagesSubscription) {
      this.saveAllImagesSubscription.unsubscribe();
    }
  }

  /******************************Handle_Functions*******************************/
  handleSaveCurrentImage() {
    this.SaveCurrentImageEvent.emit();
  }

  handleSaveAllImages() {
    this.SaveAllImagesEvent.emit();
  }

  /******************************Others_Functions*******************************/
  selectImage(image: ImageWithMetadata | null): void {
    this.selectedImage = image;
    this.saveCurrentImageSubscription = new Subscription();
    this.saveAllImagesSubscription = new Subscription();
  } 
}