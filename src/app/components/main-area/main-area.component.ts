// src/app/components/main-area/main-area.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import { ImageWithMetadata } from '../../interface/imagewithmetadata';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-area',
  templateUrl: './main-area.component.html',
})
export class MainAreaComponent implements OnInit {
  @Input() receiveSaveCurrentImage!: EventEmitter<void>;
  @Input() receiveSaveAllImages!: EventEmitter<void>;
  @Output() SaveCurrentImageEvent = new EventEmitter<void>();
  @Output() SaveAllImagesEvent = new EventEmitter<void>();

  private saveCurrentImageSubscription!: Subscription;
  private saveAllImagesSubscription!: Subscription;

  selectedImage: ImageWithMetadata | null = null;

  selectImage(image: ImageWithMetadata | null): void {
    this.selectedImage = image;
    this.saveCurrentImageSubscription = new Subscription();
    this.saveAllImagesSubscription = new Subscription();
  }

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

  handleSaveCurrentImage() {
    this.SaveCurrentImageEvent.emit();
  }

  handleSaveAllImages() {
    this.SaveAllImagesEvent.emit();
  }
}