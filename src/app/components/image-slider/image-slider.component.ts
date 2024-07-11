import { Component, Output, Input, EventEmitter, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { ImageService } from '../../service/images.service';
import { ImageWithMetadata } from '../../interface/imagewithmetadata';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-image-slider',
  templateUrl: './image-slider.component.html',
})
export class ImageSliderComponent implements OnInit, OnDestroy {
  @Output() imageSelect = new EventEmitter<ImageWithMetadata | null>();
  @Input() SaveCurrentImageEvent = new EventEmitter<void>();
  @Input() SaveAllImagesEvent = new EventEmitter<void>();

  imagesWithMetadata: ImageWithMetadata[] = [];
  selectedImageIndex: number | null = null;
  imageUrls: string[] = [];

  currentPage = 1;
  pageSize = 10; // Asegurarse de que el tamaño de la página sea 10
  imageSize = 100; // Tamaño predeterminado de la imagen
  paginatedImages: ImageWithMetadata[] = [];
  paginatedImageUrls: string[] = [];

  private imagesSubscription: Subscription;
  private saveCurrentImageSubscription: Subscription;
  private saveAllImagesSubscription: Subscription;

  constructor(private imageService: ImageService, private el: ElementRef) {
    this.imagesSubscription = new Subscription();
    this.saveCurrentImageSubscription = new Subscription();
    this.saveAllImagesSubscription = new Subscription();
  }

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
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.updatePagination();
  }

  updateImageUrls(): void {
    this.imageUrls = this.imagesWithMetadata.map(image => URL.createObjectURL(image.file));
  }

  updatePagination(): void {
    this.paginateImages();
  }

  paginateImages(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedImages = this.imagesWithMetadata.slice(start, end);
    this.paginatedImageUrls = this.imageUrls.slice(start, end);
  }

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

  isSelected(index: number): boolean {
    const actualIndex = (this.currentPage - 1) * this.pageSize + index;
    return this.selectedImageIndex === actualIndex;
  }

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
      this.paginateImages();
    }
  }

  handleSaveCurrentImage() {
    this.updateImageUrls();
    this.imageService.saveImageWithMetadata();
  }

  handleSaveAllImages() {
    this.updateImageUrls();
    this.imageService.saveAllImagesWithMetadata();
  }

  get totalPages(): number {
    return Math.ceil(this.imagesWithMetadata.length / this.pageSize);
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
