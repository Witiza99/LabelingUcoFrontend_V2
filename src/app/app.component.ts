// src/app/app.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ImageService } from './service/images.service';
import { SpinnerService } from './service/spinner.service';
import { ApiService } from './service/api-service.service';
import * as JSZip from 'jszip';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  @Output() receiveSaveCurrentImagefromAPP = new EventEmitter<void>();
  @Output() receiveSaveAllImagesfromAPP = new EventEmitter<void>();

  showSpinner:boolean = false;
  isModalVisible: boolean = false;
  frameRate: number = 1;

  filesFromHeader: File[] = [];
  videoFilesWithSettings: { file: File, captureInterval: number}[] = [];
  imageToService: File[] = [];

  constructor(
    private imageService: ImageService,
    private spinnerService: SpinnerService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.spinnerService.spinnerState.subscribe(state => {
      this.showSpinner = state;
    });
  }

  handleSaveCurrentImage() {
    this.receiveSaveCurrentImagefromAPP.emit();
  }

  handleSaveAllImages() {
    this.receiveSaveAllImagesfromAPP.emit();
  }

  handleFilesUploaded(files: File[]): void {
    this.filesFromHeader = files;

    //Sacamos los videos del array de archivos
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

    //Mostramos el modal de gestión de videos
    if (this.videoFilesWithSettings.length > 0){
      this.showModal();
    }else{
      //Llamada del servicio para añadir imagenes con las
      this.imageService.addImages(this.imageToService);
    }
  
  }

  showModal() {
    this.isModalVisible = true;
  }

  async extractFrames(videoFilesWithSettings: { file: File, captureInterval: number }[]): Promise<File[]> {
    return new Promise<File[]>((resolve, reject) => {
      const files = videoFilesWithSettings.map(videoFile => videoFile.file);
      const frameRates = videoFilesWithSettings.map(videoFile => videoFile.captureInterval);

      this.apiService.processVideo(files, frameRates).subscribe({
        next: async (data: Blob) => {
          try {
            // Manejar el blob recibido (archivo ZIP) y extraer imágenes
            console.log("procesando el blob con el zip")
            const imagesFromVideo = await this.extractImagesFromZip(data);
            console.log("termino el procesamiento del zip")
            resolve(imagesFromVideo);
          } catch (error) {
            console.error('Error al procesar archivos:', error);
            reject(error);
          }
        },
        error: (error) => {
          console.error('Error con la llamada a la API:', error);
          reject(error);
        }
      });
    });
  }
  

  cancel(): void {
    this.isModalVisible = false;
  }

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


  removeFile(i: number): void {
    console.log(i)

    this.videoFilesWithSettings.splice(i,1);
    console.log(this.videoFilesWithSettings.length);
    if ( this.videoFilesWithSettings.length === 0 && this.imageToService.length === 0){
      this.isModalVisible = false;
    }
  }

  async extractImagesFromZip(zipBlob: Blob): Promise<File[]> {
    try {
      // Crear una instancia de JSZip y cargar el archivo ZIP
      const zip = await JSZip.loadAsync(zipBlob);
  
      // Arreglo para almacenar los archivos extraídos
      const extractedFiles: File[] = [];
  
      // Iterar sobre cada archivo en el ZIP
      await Promise.all(
        Object.keys(zip.files).map(async (fileName) => {
          const zipEntry = zip.files[fileName];
  
          // Verificar si el archivo es un directorio (carpeta) o un archivo
          if (!zipEntry.dir) {
            // Obtener el contenido del archivo como un Blob
            const fileData = await zipEntry.async('blob');
  
            // Crear un objeto File a partir del Blob
            const file = new File([fileData], zipEntry.name, { type: fileData.type });
  
            // Agregar el archivo al arreglo de archivos extraídos
            extractedFiles.push(file);
          }
        })
      );
  
      return extractedFiles;
    } catch (error) {
      console.error('Error al extraer imágenes del ZIP:', error);
      throw error;
    }
  }


  /*
  async processFiles(files: FileList): Promise<File[]> {

    const processedFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/')) {
        // Si es un video, extraer frames y convertir a imágenes
        this.isModalVisible = true;
        
        // Esperar hasta que se confirme la selección del intervalo o se cancele
        try {
          await new Promise<void>((resolve, reject) => {
            // Resolver la promesa con el valor del intervalo seleccionado
              resolve();
            

              reject(new Error("Interval selection cancelled"));
            });
        } catch (error) {
          console.log("Interval selection cancelled:", error);
          continue; // Saltar al siguiente archivo en caso de cancelación
        }

        console.log("Processing video...");
        const frames = await this.extractFrames(file, this.frameRate);
        console.log("Processing video finished");
        processedFiles.push(...frames);
      } else {
        // Si es una imagen, agregar directamente al array de archivos procesados
        processedFiles.push(file);
      }
    }

    return processedFiles;
  }*/

  /*
  async extractFrames(videoFile: File, frameRate: number): Promise <File[]> {
    return new Promise((resolve, reject) => {
      // 1. Create HTML element
      console.log("1.1");
      
      const frames: File[] = [];
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      console.log("1.2"); 
      

      // 4. Read video file and metadata
      video.preload = "metadata";
      console.log("metadata ->")

      
      video.addEventListener("loadedmetadata", function(){
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const duration = video.duration;
          console.log("ancho: ", canvas.width)
          console.log("La duracion del video es: ", duration)

          let currentTime = 0;
          console.log("1.4");

          // 3. Capturar frames con el tiempo definido
        const captureFrame = () => {
          if (currentTime >= duration) {
            console.log("1.5");
            // Resolver la promesa con los frames
            console.log("1.6");
            resolve(frames);
            return;
          }
          video.currentTime = currentTime;
          video.onseeked = () => {
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `frame-${currentTime}.png`, { type: 'image/png' });
                frames.push(file);
              }
              currentTime += (1/frameRate);
              captureFrame();// Capturar el siguiente frame
            }, 'image/png');
          };
        };
        captureFrame();
      });

      video.addEventListener("error", (e) => {
        reject(new Error("Error loading video"));
      });
      
      //ffmpeg -i input_video.mp4 -c:v libx264 -c:a aac -strict experimental output_video.mp4
      // Configurar el src del video usando un Blob URL
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const blob = new Blob([e.target.result], { type: videoFile.type });
        const url = URL.createObjectURL(blob);
        video.src = url;
        video.load();
      };
      reader.onerror = (e) => {
        console.error("Error reading video file", e);
        reject(new Error("Error reading video file"));
      };
      reader.readAsArrayBuffer(videoFile);
    });
  }*/

}