import { Injectable } from '@angular/core';
import { Subject, Observable, firstValueFrom } from 'rxjs';
import { ImageWithMetadata } from '../interface/imagewithmetadata';
import { Shape } from '../interface/shape';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import * as ExifReader from 'exifreader';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SpinnerService } from './spinner.service';
/*
import { Rectangle } from '../interface/rectangle';
import { Circle } from '../interface/circle';
import { Polygon } from '../interface/polygon';
*/

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private images: ImageWithMetadata[] = [];
  private selectedImageIndex: number | null = null; // index image for process image
  private imagesSubject = new Subject<ImageWithMetadata[]>();
  private indexSubject = new Subject<number | null>();

  constructor(
    private _http: HttpClient,
    private spinnerService: SpinnerService 
  ) {}

  //image with metadata getter
  getImages(): ImageWithMetadata[] {
    return this.images;
  }

  //index of image processing
  setSelectedImageIndex(index: number | null): void {
    console.log("actualizo mi index con " + index);
    this.selectedImageIndex = index;
    this.indexSubject.next(this.selectedImageIndex);
  }

  //observer for image with metadata vector
  getImagesObservable(): Observable<ImageWithMetadata[]> {
    return this.imagesSubject.asObservable();
  }

  //observer for index
  getIndexObservable(): Observable<number | null> {
    return this.indexSubject.asObservable();
  }

  //add new image with or without metadata
  async addImages(files: File[]): Promise<void> {
    for (const file of files) {
      try {
        console.log("hola3")
        const metadata = await this.extractMetadataFromImage(file);
        console.log(metadata)
        const imageWithMetadata: ImageWithMetadata = { file, metadata };
        this.images.push(imageWithMetadata);
        console.log("imagen con metadatos");
      } catch (error) {
        console.log(error)
        // Si no se pueden extraer metadatos, almacenar la imagen sin metadatos
        const imageWithMetadata: ImageWithMetadata = { file, metadata: null };
        this.images.push(imageWithMetadata);
        console.log("imagen sin metadatos");
      }
    }
    this.imagesSubject.next([...this.images]); // Emitir una copia del array de imágenes
  }

  //delete image from the tool
  deleteImage(index: number): void {
    if (index >= 0 && index < this.images.length) {
      this.images.splice(index, 1);
      this.imagesSubject.next([...this.images]);
    }
  }

  async extractMetadataFromImage(image: File): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event: any) => {
        try {
          const arrayBuffer = event.target.result; // Obtener el ArrayBuffer del evento
          //console.log('ArrayBuffer:', arrayBuffer); // Verificar el ArrayBuffer obtenido

          // Usar ExifReader para leer los metadatos
          const tags = ExifReader.load(arrayBuffer);
          //console.log('EXIF Data:', tags); // Verificar los datos EXIF obtenidos

          if (tags && tags['UserComment']) {
            const userComment = tags['UserComment'].description;
            //console.log('User Comment:', userComment); // Verificar el User Comment obtenido

            try {
              const shapes = JSON.parse(userComment);
              resolve(shapes);
            } catch (error) {
              reject('Error al convertir UserComment a Shapes.');
            }
          } else {
            reject('No se encontró UserComment en los metadatos de la imagen.');
          }
        } catch (error) {
          console.error('Error al procesar los metadatos EXIF:', error);
          reject('Error al procesar los metadatos EXIF.');
        }
      };

      reader.onerror = (error) => {
        console.error('Error al leer el archivo de imagen:', error);
        reject('Error al leer el archivo de imagen.');
      };

      reader.readAsArrayBuffer(image); // Leer el archivo de imagen como ArrayBuffer
    });
  }    

/*
  jsontoShape(jsonData: string): Shape[] {
    try {
      const shapesData = JSON.parse(jsonData);
  
      if (!Array.isArray(shapesData)) {
        throw new Error('El JSON no representa un arreglo de formas.');
      }
  
      const shapes: Shape[] = shapesData.map((shapeData: any) => {
        switch (shapeData.type) {
          case 'rectangle':
            // Crear un objeto Rectangle
            return {
              type: 'rectangle',
              x: shapeData.x,
              y: shapeData.y,
              width: shapeData.width,
              height: shapeData.height,
              color: shapeData.color,
              label: shapeData.label,
              thickness: shapeData.thickness
            } as Rectangle;
  
          case 'polygon':
            // Crear un objeto Polygon
            return {
              type: 'polygon',
              points: shapeData.points,
              color: shapeData.color,
              label: shapeData.label,
              thickness: shapeData.thickness
            } as Polygon;
  
          case 'circle':
            // Crear un objeto Circle
            return {
              type: 'circle',
              cx: shapeData.cx,
              cy: shapeData.cy,
              radius: shapeData.radius,
              color: shapeData.color,
              label: shapeData.label,
              thickness: shapeData.thickness
            } as Circle;
  
          default:
            throw new Error(`Tipo de forma no reconocido: ${shapeData.type}`);
        }
      });
  
      return shapes;
    } catch (error) {
      console.error('Error al convertir JSON a Shapes:', error);
      return [];
    }
  }
*/
  updateMetadata(metadata: any): void {
    console.log("mi indice es" + this.selectedImageIndex);
    if(this.selectedImageIndex!= null){
      this.images[this.selectedImageIndex].metadata = metadata;
      this.imagesSubject.next([...this.images]);
    }else{console.log("no se pueden guardar metadatos de una imagen inexistente")}
  }

  //save image withmetada for download
  async saveImageWithMetadata(): Promise<void> {
    if (this.selectedImageIndex != null) {
      const imageWithMetadata = this.images[this.selectedImageIndex];
      this.spinnerService.show();
      if (imageWithMetadata.metadata) {
        const jsonMetadata = this.shapesToJson(imageWithMetadata.metadata);
        const imgWithMetadataembed = await this.embedXMLInImage(imageWithMetadata.file, jsonMetadata);
        this.downloadImage(imgWithMetadataembed);
      } else {
        console.log("Descargo imagen sin metadata");
        this.downloadImage(imageWithMetadata.file);
      }
      this.spinnerService.hide();
    }
  }

  async saveAllImagesWithMetadata(): Promise<void> {
    const zip = new JSZip();
    this.spinnerService.show();
    for (const imageWithMetadata of this.images) {
      try {
        if (imageWithMetadata.metadata) {
          const jsonMetadata = this.shapesToJson(imageWithMetadata.metadata);
          const imgWithMetadata = await this.embedXMLInImage(imageWithMetadata.file, jsonMetadata);
          zip.file(imageWithMetadata.file.name, imgWithMetadata);
        } else {
          zip.file(imageWithMetadata.file.name, imageWithMetadata.file);
        }
      } catch (error) {
        console.error(`Error saving image`);
      }
    }
  
    // Generar y descargar el archivo ZIP
    zip.generateAsync({ type: 'blob' })
      .then((content) => {
        saveAs(content, 'images.zip');
      })
      .catch((error) => {
        console.error('Error creating ZIP file:', error);
      });
      this.spinnerService.hide();
    
  }

  private shapesToJson(shapes: Shape[]): string {
    const json = JSON.stringify(shapes);
    return json;
  }

  async embedXMLInImage(imageFile: File, jsonData: string): Promise<File> {
    // Crear un objeto FormData para enviar imagen y Json al backend
    console.log(jsonData);
    const formData = new FormData();
    formData.append('imagen', imageFile); // Agregar el archivo de imagen
    formData.append('jsonMetadata', jsonData);     // Agregar los datos Json

    try {
      // Enviar los datos al backend y esperar la respuesta (imagen con metadatos embebidos)
      const response = await  firstValueFrom(this._http.post(environment.api_url + 'api/agregar-metadatos', formData, {
          responseType: 'blob', // Especificar 'blob' como tipo de respuesta
      }));

      // Verificar si la respuesta no es undefined y es un Blob válido
      if (!(response instanceof Blob)) {
          throw new Error('La respuesta no es un Blob válido');
      }

      // Convertir el Blob de respuesta a un File
      const modifiedFile = new File([response], imageFile.name, {
          type: response.type,
          lastModified: Date.now()
      });

      return modifiedFile; // Devolver el archivo modificado como File
    } catch (error) {
        console.error('Error al embeber Json en la imagen:', error);
        throw error; // Propagar el error para manejarlo en otro lugar si es necesario
    }
  }

  private downloadImage(file: File): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
