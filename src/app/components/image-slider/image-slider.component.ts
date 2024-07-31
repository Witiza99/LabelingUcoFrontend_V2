/*******************************Imports***********************************/
import { Component, Output, Input, EventEmitter, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { ImageService } from '../../service/images.service';
import { ImageWithMetadata } from '../../interface/imagewithmetadata';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-image-slider',
  templateUrl: './image-slider.component.html',
})

//Class Image Slider Component
export class ImageSliderComponent implements OnInit, OnDestroy {
  /*******************************Decorators***********************************/
  @Output() imageSelect = new EventEmitter<ImageWithMetadata | null>();
  @Input() SaveCurrentImageEvent = new EventEmitter<void>();
  @Input() SaveAllImagesEvent = new EventEmitter<void>();
  @Input() ExportCurrentImageEvent = new EventEmitter<string>();
  @Input() ExportAllImagesEvent = new EventEmitter<string>();

  /*******************************Variables***********************************/
  imagesWithMetadata: ImageWithMetadata[] = [];
  selectedimagesWithMetadata: ImageWithMetadata | null = null;
  imageUrls: Record<string, string> = {};

  //paginate
  currentPage = 1;
  pageSize = this.imageService.getImagePerPage();
  imageSize = 100;

  private imagesSubscription: Subscription;
  private saveCurrentImageSubscription: Subscription;
  private saveAllImagesSubscription: Subscription;
  private exportCurrentImageSubscription: Subscription;
  private exportAllImagesSubscription: Subscription;

  /*******************************Constructor***********************************/
  constructor(private imageService: ImageService, private el: ElementRef) {
    this.imagesSubscription = new Subscription();
    this.saveCurrentImageSubscription = new Subscription();
    this.saveAllImagesSubscription = new Subscription();
    this.exportCurrentImageSubscription = new Subscription();
    this.exportAllImagesSubscription = new Subscription();
  }

  /******************************Angular_Functions*******************************/
  ngOnInit(): void {
    this.imagesSubscription = this.imageService.getImagesObservable().subscribe({
      next: (updatedImages) => {
        this.imagesWithMetadata = updatedImages;
        this.updateImageUrls();
      }
    });

    this.saveCurrentImageSubscription = this.SaveCurrentImageEvent.subscribe(() => {
      this.handleSaveCurrentImage();
    });

    this.saveAllImagesSubscription = this.SaveAllImagesEvent.subscribe(() => {
      this.handleSaveAllImages();
    });

    this.exportCurrentImageSubscription = this.ExportCurrentImageEvent.subscribe((selectedFormat: string) => {
      this.handleExportCurrentImage(selectedFormat);
    });

    this.exportAllImagesSubscription = this.ExportAllImagesEvent.subscribe((selectedFormat: string) => {
      this.handleExportAllImages(selectedFormat);
    });
  }

  ngOnDestroy(): void {
    if (this.imagesSubscription) {
      this.imagesSubscription.unsubscribe();
    }

    if (this.saveCurrentImageSubscription) {
      this.saveCurrentImageSubscription.unsubscribe();
    }
    if (this.saveAllImagesSubscription) {
      this.saveAllImagesSubscription.unsubscribe();
    }
    if (this.exportCurrentImageSubscription) {
      this.exportCurrentImageSubscription.unsubscribe();
    }
    if (this.exportAllImagesSubscription) {
      this.exportAllImagesSubscription.unsubscribe();
    }
  }

  /******************************Handle_Functions*******************************/
  async handleSaveCurrentImage() {
    // Check if exist selected image
    if (this.selectedimagesWithMetadata !== null) {
      //update metadata image selected
      await this.imageService.updateMetadata(this.selectedimagesWithMetadata);
      await this.imageService.saveImageWithMetadata();
    }
  }

  async handleSaveAllImages() {
    if (this.selectedimagesWithMetadata !== null) {
      await this.imageService.updateMetadata(this.selectedimagesWithMetadata);
    }
    await this.imageService.saveAllImagesWithMetadata();
  }

  async handleExportCurrentImage(selectedFormat: string) {
    // Check if exist selected image
    if (this.selectedimagesWithMetadata !== null) {
      //update metadata image selected
      await this.imageService.updateMetadata(this.selectedimagesWithMetadata);
      await this.imageService.exportSelectedImage(selectedFormat);
    }
  }

  async handleExportAllImages(selectedFormat: string) {
    if (this.selectedimagesWithMetadata !== null) {
      await this.imageService.updateMetadata(this.selectedimagesWithMetadata);
    }
    await this.imageService.exportAllImages(selectedFormat);
  }

  /************************Getter_and_Setter_Funtions***************************/
  get totalPages(): number {
    return Math.ceil(this.imageService.getMaxNumberImages() / this.pageSize);
  }

  /******************************Others_Functions*******************************/
  updateImageUrls(): void {
    this.imagesWithMetadata.forEach(image => {
      this.imageUrls[image.id] = URL.createObjectURL(image.file);
    });
  }

  // Select image from image slider
  async selectImage(idselected: string): Promise<void> {
    // Find image with id
    const selectedImage = this.imagesWithMetadata.find(image => image.id === idselected) || null;

    if (this.selectedimagesWithMetadata !== null && this.selectedimagesWithMetadata.id !== idselected) {
      // Update metadata (maybe check if there are changes before update)
      await this.imageService.updateMetadata(this.selectedimagesWithMetadata);
    }

    this.selectedimagesWithMetadata = selectedImage;

    //update selected image in image service
    if(this.selectedimagesWithMetadata !== null){
      this.imageService.setSelectedImageId(this.selectedimagesWithMetadata.id);
    }
    
    // Emit new image
    this.imageSelect.emit(this.selectedimagesWithMetadata);

  }

  //Check if is selected
  isSelected(id: string): boolean {
    if(this.selectedimagesWithMetadata){
      return this.selectedimagesWithMetadata.id === id;
    }else{
      return false;
    }  
  }

  // Delete image from slider
  async deleteImage(id: string): Promise<void> {

    // Adjust selection if needed
    if(this.selectedimagesWithMetadata){
      if (this.selectedimagesWithMetadata.id === id) {
        this.selectedimagesWithMetadata = null;
        this.imageService.setSelectedImageId(null);
        this.imageSelect.emit(null);
      }
    }
    await this.imageService.deleteImage(id);
    
    //get images again for the same page, except if the page is empty
    if (this.imagesWithMetadata.length === 1 && this.currentPage > 1) {
      this.currentPage--;
    }
    this.imageService.setActualPage(this.currentPage);
    this.imageService.setImages();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.imageService.setActualPage(this.currentPage);
      this.imageService.setImages();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.imageService.setActualPage(this.currentPage);
      this.imageService.setImages();
    }
  }
}
