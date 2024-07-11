// src/app/components/sidebar/sidebar.component.ts
import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { PropertierstoolService } from '../../service/propertierstool.service';
import { ImageService } from '../../service/images.service';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
})

export class SidebarComponent implements OnInit{
  @Output() saveImageEvent = new EventEmitter<void>();
  @Output() saveAllImagesEvent = new EventEmitter<void>();

  label: string = 'label';        // Etiqueta del rectángulo
  color: string = '#FF0000'; // Color inicial
  thickness: number = 2;     // Grosor inicial
  selectedImageIndex: number | null = null; // Índice seleccionado
  images: any[] = []; // Arreglo de imágenes

  constructor(
    private propertierstoolService: PropertierstoolService,
    private imageService: ImageService
  ) {}

  ngOnInit(): void {
    // Suscríbete al observable para obtener el índice seleccionado
    this.imageService.getIndexObservable().subscribe(index => {
      this.selectedImageIndex = index;
    });

    // Obtener el arreglo de imágenes
    this.imageService.getImagesObservable().subscribe((images) => {
      this.images = images;
    });
  }

  onLabelChange(label: string): void {
    this.propertierstoolService.setLabel(label);
  }

  onColorChange(color: string): void {
    this.propertierstoolService.setColor(color);
  }

  onThicknessChange(thickness: number): void {
    this.propertierstoolService.setThickness(thickness);
  }
  saveCurrentImage(): void {
    //this.imageService.saveImageWithMetadata();
    this.saveImageEvent.emit()     
  }

  saveAllImages(): void {
    //this.imageService.saveAllImagesWithMetadata();
    this.saveAllImagesEvent.emit()
  }
}