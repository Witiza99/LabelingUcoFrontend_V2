/*******************************Imports***********************************/
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { PropertierstoolService } from '../../service/propertierstool.service';
import { ImageService } from '../../service/images.service';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})

//Class Sidebar
export class SidebarComponent implements OnInit{
  /*******************************Decorators***********************************/
  @Output() saveImageEvent = new EventEmitter<void>();
  @Output() saveAllImagesEvent = new EventEmitter<void>();
  @Output() exportImageEvent = new EventEmitter<string>();
  @Output() exportAllImagesEvent = new EventEmitter<string>();

  /*******************************Variables***********************************/
  label: string = 'label';
  color: string = '#FF0000'; 
  thickness: number = 2;    
  selectedImageIndex: number | null = null; 
  images: any[] = [];
  selectedFormat: string = '';

  /*******************************Constructor***********************************/
  constructor(
    private propertierstoolService: PropertierstoolService,
    private imageService: ImageService
  ) {}

  /******************************Angular_Functions*******************************/
  ngOnInit(): void {
    // Subscribe to get index
    this.imageService.getIndexObservable().subscribe(index => {
      this.selectedImageIndex = index;
    });

    // Subscribe to get image array
    this.imageService.getImagesObservable().subscribe((images) => {
      this.images = images;
    });
  }

  /******************************Others_Functions*******************************/
  onLabelChange(label: string): void {
    this.propertierstoolService.setLabel(label);
  }

  onColorChange(color: string): void {
    this.propertierstoolService.setColor(color);
  }

  onThicknessChange(thickness: number): void {
    this.propertierstoolService.setThickness(thickness);
  }

  //button saves
  saveCurrentImage(): void {
    this.saveImageEvent.emit()     
  }

  saveAllImages(): void {
    this.saveAllImagesEvent.emit()
  }

  //button export
  exportCurrentImage() {
    if (this.selectedImageIndex !== null) {
      this.exportImageEvent.emit(this.selectedFormat);
    }
  }

  exportAllImages() {
    this.exportAllImagesEvent.emit(this.selectedFormat);
  }
}