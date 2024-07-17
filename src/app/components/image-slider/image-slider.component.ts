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
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.updatePagination();
  }

  /*******************************Variables***********************************/
  imagesWithMetadata: ImageWithMetadata[] = [];
  selectedImageIndex: number | null = null;
  imageUrls: string[] = [];

  //paginate
  currentPage = 1;
  pageSize = 10;
  imageSize = 100;
  paginatedImages: ImageWithMetadata[] = [];
  paginatedImageUrls: string[] = [];

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
        this.updatePagination();
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

    this.updatePagination();
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
  handleSaveCurrentImage() {
    this.updateImageUrls();
    this.imageService.saveImageWithMetadata();
  }

  handleSaveAllImages() {
    this.updateImageUrls();
    this.imageService.saveAllImagesWithMetadata();
  }

  handleExportCurrentImage(selectedFormat: string) {
    this.updateImageUrls();
    this.imageService.exportSelectedImage(selectedFormat);
  }

  handleExportAllImages(selectedFormat: string) {
    this.updateImageUrls();
    this.imageService.exportAllImages(selectedFormat);
  }

  /************************Getter_and_Setter_Funtions***************************/
  get totalPages(): number {
    return Math.ceil(this.imagesWithMetadata.length / this.pageSize);
  }

  /******************************Others_Functions*******************************/
  updateImageUrls(): void {
    this.imageUrls = this.imagesWithMetadata.map(image => URL.createObjectURL(image.file));
  }

  //paginate
  updatePagination(): void {
    this.paginateImages();
  }

  // Select image from image slider
  async selectImage(index: number): Promise<void> {
    const actualIndex = (this.currentPage - 1) * this.pageSize + index;

    if (this.selectedImageIndex !== null && this.selectedImageIndex !== actualIndex) {
      await this.imageService.updateMetadata(this.imagesWithMetadata[this.selectedImageIndex].metadata);
    }

    if (actualIndex >= 0 && actualIndex < this.imagesWithMetadata.length) {
      this.selectedImageIndex = actualIndex;
      this.imageService.setSelectedImageIndex(this.selectedImageIndex);
      this.imageSelect.emit(this.imagesWithMetadata[this.selectedImageIndex]);
    }
  }

  //Check if is selected
  isSelected(index: number): boolean {
    const actualIndex = (this.currentPage - 1) * this.pageSize + index;
    return this.selectedImageIndex === actualIndex;
  }

  // Delete image from slider
  deleteImage(index: number): void {
    const actualIndex = (this.currentPage - 1) * this.pageSize + index;

    if (actualIndex >= 0 && actualIndex < this.imagesWithMetadata.length) {
      this.imageUrls.splice(actualIndex, 1);
      this.imageService.deleteImage(actualIndex);

      if (this.selectedImageIndex === actualIndex) {
        this.selectedImageIndex = null;
        this.imageService.setSelectedImageIndex(this.selectedImageIndex);
        this.imageSelect.emit(null);
      } else if (this.selectedImageIndex !== null && this.selectedImageIndex > actualIndex) {
        this.selectedImageIndex--;
        this.imageService.setSelectedImageIndex(this.selectedImageIndex);
      }

      // Check if the current page is empty
      if (this.paginatedImages.length === 0 && this.currentPage > 1) {
        this.currentPage--; // Go age back
      }

      this.paginateImages();
    }
  }

  //paginate
  paginateImages(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedImages = this.imagesWithMetadata.slice(start, end);
    this.paginatedImageUrls = this.imageUrls.slice(start, end);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.paginateImages();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.paginateImages();
    }
  }
}
