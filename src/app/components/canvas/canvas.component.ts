// src/app/components/canvas/canvas.component.ts
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges, HostListener, OnDestroy, Inject, PLATFORM_ID} from '@angular/core';
import { ToolService } from '../../service/selectedtool.service';
import { PropertierstoolService } from '../../service/propertierstool.service';
import { ImageWithMetadata } from '../../interface/imagewithmetadata';
import { Shape } from '../../interface/shape';
import { Subscription } from 'rxjs';
import { Rectangle } from '../../interface/rectangle';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
})
export class CanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() image: ImageWithMetadata | null = null;
  @ViewChild('canvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;
  
  //image canvas
  public isBrowser: boolean;
  private canvasnativeElement!: HTMLCanvasElement; // Declara la variable canvasGeneral
  private ctx: CanvasRenderingContext2D | null = null; // Declaración del contexto del canvas
  private loadedImage: HTMLImageElement | null = null;
  private isCanvasReady = false; // Bandera para controlar la inicialización del canvas

  //tool var
  private toolSubscription: Subscription | undefined;
  private selectedTool: string = '';

  //tool propertiers var
  private toolPropertiesSubscription: Subscription | undefined;
  private label: string = 'label';
  private color: string = '#FF0000';
  private thickness: number = 2;

  //rectangles var
  private isClicked = false;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;

  constructor(
    private toolService: ToolService, 
    private propertierstoolService: PropertierstoolService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  //Load Image and subscribe to tool event
  ngAfterViewInit(): void {
    // Verifica si canvas está definido y asigna nativeElement a canvasGeneral
    if (this.canvas && this.canvas.nativeElement) {
      this.canvasnativeElement = this.canvas.nativeElement;
      console.log("encuentro canvas->");
      console.log(this.canvas)
      // Obtiene el contexto '2d' del canvas
      this.ctx = this.canvasnativeElement.getContext('2d');
      console.log("encuentro ctx->");
      console.log(this.ctx)
      if (!this.ctx) {
        console.error('No se pudo obtener el contexto 2D del canvas.');
      }
      this.isCanvasReady = true; // Marcar el canvas como listo
    } else {
      //console.error('La referencia al canvas no está definida.');
    }
    //tool subscription
    this.toolSubscription = this.toolService.getSelectedToolObservable().subscribe({
      next: (tool) => {
        this.selectedTool = tool;
        
      }     
    });
    //tool propertiers subscription
    this.toolPropertiesSubscription = this.subscribeToToolProperties();
  }

  private subscribeToToolProperties(): Subscription {
    const labelSubscription = this.propertierstoolService.getLabelObservable().subscribe(label => {
      this.label = label;
    });

    const colorSubscription = this.propertierstoolService.getColorObservable().subscribe(color => {
      this.color = color;
    });

    const thicknessSubscription = this.propertierstoolService.getThicknessObservable().subscribe(thickness => {
      this.thickness = thickness;
    });

    return new Subscription(() => {
      labelSubscription.unsubscribe();
      colorSubscription.unsubscribe();
      thicknessSubscription.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    if (this.toolSubscription) {
      this.toolSubscription.unsubscribe();
    }
    if (this.toolPropertiesSubscription) {
      this.toolPropertiesSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['image'] && this.isCanvasReady) {
      console.log("me cambian");
      this.loadImage();
    }
  }

  loadImage(): void {
    if (this.image && this.image.file ) {
      if (this.ctx) {
        const img = new Image();
        img.src = URL.createObjectURL(this.image.file);
        console.log("coge img");
        img.onload = () => {
          this.loadedImage = img;
          this.drawImage();
        };
      }
    }else{
      console.log(this.image);
      this.clearCanvas();
    }
  }

  drawImage(): void {
    if (this.loadedImage && this.image) {
      if (this.ctx != null) {
        this.ctx.clearRect(0, 0, this.canvasnativeElement.width, this.canvasnativeElement.height);
        this.ctx.drawImage(this.loadedImage, 0, 0, this.canvasnativeElement.width, this.canvasnativeElement.height);
        if (this.image.metadata) {
          // Iterar sobre todas las formas definidas en los metadatos
          this.image.metadata.forEach(shape => {
            this.drawShape(shape); // Llama a un método genérico para dibujar cualquier forma
          });
        }
      }
    }
  }

  drawShape(shape: any): void {
    if (this.ctx) { // Verifica que this.ctx no sea null
      switch (shape.type) {
        case 'rectangle':
          this.drawRectangles(shape);
          break;
        case 'circle':
          //this.drawCircle(shape);
          break;
        case 'polygon':
          //this.drawPolygon(shape);
          break;
        // Agrega más casos según las herramientas que vayas implementando
        default:
          // Lógica para manejar otros tipos de formas
          break;
      }
    } else {
      console.error('El contexto 2D del canvas no está definido.');
    }    
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.button === 0) { // Left click
      switch (this.selectedTool) {
        case 'rectangle':
          this.startRectangleDrawing(event);
          break;
        case 'circle':
          break;
        case 'poligone':
          break;
        // Agregar más casos para otras herramientas si es necesario
      }
      this.isClicked = true; // Se ha hecho clic en el canvas
      this.isDrawing = false; // Inicialmente no se está dibujando hasta que se arrastre el mouse
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isClicked) { // Solo si se ha hecho clic en el canvas
      this.isDrawing = true; // Se está dibujando (arrastrando el mouse)
      switch (this.selectedTool) {
        case 'rectangle':
          this.updateRectangleDrawing(event);
          break;
        case 'circle':
          break;
        case 'poligone':
          break;
        // Agregar más casos para otras herramientas si es necesario
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (event.button === 0 && this.isClicked) { // Left click y se ha hecho clic en el canvas
      if (this.isDrawing) {
        switch (this.selectedTool) {
          case 'rectangle':
            this.finishRectangleDrawing(event);
            break;
          case 'circle':
            break;
          case 'poligone':
            break;
          // Agregar más casos para otras herramientas si es necesario
        }
        this.isDrawing = false;
      }
      this.isClicked = false;
    }
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent): void {
    if (this.isClicked) {
      this.isClicked = false;
      this.isDrawing = false;
      
      // Stop drawing, draw image again
      this.drawImage();
    }
  }

  onContextMenu(event: MouseEvent): void {
    event.preventDefault(); // Prevent context menu from appearing
    switch (this.selectedTool) {
      case 'rectangle':
        this.removeRectangle(event);
        break;
      case 'circle':
        break;
      case 'poligone':
        break;
      // Agregar más casos para otras herramientas si es necesario
    }
  }


  //Rectangle methods
  startRectangleDrawing(event: MouseEvent): void {
    const canvas = this.canvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    this.startX = event.clientX - rect.left;
    this.startY = event.clientY - rect.top;
  }

  updateRectangleDrawing(event: MouseEvent): void {
    if (this.ctx && this.loadedImage) {
      this.currentX = event.clientX - this.canvasnativeElement.getBoundingClientRect().left;
      this.currentY = event.clientY - this.canvasnativeElement.getBoundingClientRect().top;
  
      // Clear and redraw the image
      this.ctx.clearRect(0, 0, this.canvasnativeElement.width, this.canvasnativeElement.height);
      this.ctx.drawImage(this.loadedImage, 0, 0, this.canvasnativeElement.width, this.canvasnativeElement.height);
  
      // Draw existing shapes from metadata
      if(this.image){
        if (this.image.metadata) {
          this.image.metadata.forEach(shape => {
            this.drawShape(shape); // Llama al método genérico para dibujar cada forma
          });
        }
      }
  
      // Draw the current rectangle being manipulated
      this.ctx.strokeStyle = this.invertColor(this.color);
      this.ctx.lineWidth = this.thickness;
      this.ctx.strokeRect(this.startX, this.startY, this.currentX - this.startX, this.currentY - this.startY);
    }
  }

  finishRectangleDrawing(event: MouseEvent): void {
    if (this.image && this.loadedImage) {
      const canvas = this.canvas.nativeElement;

      // Calcular la esquina superior izquierda y el tamaño del rectángulo
      const x1 = Math.min(this.startX, this.currentX);
      const y1 = Math.min(this.startY, this.currentY);
      const width = Math.abs(this.currentX - this.startX);
      const height = Math.abs(this.currentY - this.startY);

      // Calcular el centro del rectángulo
      const x_center = x1 + width / 2;
      const y_center = y1 + height / 2;

      // Obtener las dimensiones del canvas
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Normalizar al tamaño del canvas
      const normalized_x_center = x_center / canvasWidth;
      const normalized_y_center = y_center / canvasHeight;
      const normalized_width = width / canvasWidth;
      const normalized_height = height / canvasHeight;
  
      // Crear el objeto de forma para agregar al metadata
      const newShape: Shape = {
        type: 'rectangle',
        x: normalized_x_center,
        y: normalized_y_center,
        width: normalized_width,
        height: normalized_height,
        color: this.color,
        label: this.label,
        thickness: this.thickness
      };

      // Crear la línea de formato YOLO
      //const yoloFormat = `${this.label} ${normalized_x_center.toFixed(6)} ${normalized_y_center.toFixed(6)} ${normalized_width.toFixed(6)} ${normalized_height.toFixed(6)}`;
  
      // Añadir la forma al metadata de la imagen
      if (!this.image.metadata) {
        this.image.metadata = [];
      }
      this.image.metadata.push(newShape);
  
      // Redibujar el canvas con las formas actualizadas
      this.drawImage();
    }
  }

  drawRectangles(shape: Rectangle): void {
    if(this.ctx){
      const canvasWidth = this.canvasnativeElement.width;
      const canvasHeight = this.canvasnativeElement.height;

      // Convertir las coordenadas y dimensiones normalizadas de nuevo a coordenadas y dimensiones del canvas
      const x_center = shape.x * canvasWidth;
      const y_center = shape.y * canvasHeight;
      const width = shape.width * canvasWidth;
      const height = shape.height * canvasHeight;

      // Calcular la esquina superior izquierda desde el centro
      const x1 = x_center - width / 2;
      const y1 = y_center - height / 2;

      this.ctx.strokeStyle = shape.color;
      this.ctx.lineWidth = shape.thickness;
      this.ctx.strokeRect(x1, y1, width, height);
      this.drawLabel(x1, y1, shape.color, shape.label, shape.thickness);
    } 
  }

  removeRectangle(event: MouseEvent): void {
    if (this.image && this.image.metadata) {
      const canvasWidth = this.canvasnativeElement.width;
      const canvasHeight = this.canvasnativeElement.height
      const rect = this.canvasnativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      let removed = false;
      this.image.metadata = this.image.metadata.filter(shape => {
        if (shape.type === 'rectangle') {
          // Calcular la esquina superior izquierda del rectángulo
          const rectX1 = (shape.x - shape.width / 2) * this.canvasnativeElement.width;
          const rectY1 = (shape.y - shape.height / 2) * this.canvasnativeElement.height;
          const rectX2 = rectX1 + shape.width * this.canvasnativeElement.width;
          const rectY2 = rectY1 + shape.height * this.canvasnativeElement.height;
  
          // Verificar si las coordenadas del evento están dentro del rectángulo
          if (x >= rectX1 && x <= rectX2 && y >= rectY1 && y <= rectY2) {
            removed = true;
            return false; // Excluir este rectángulo del metadata
          }
        }
        return true; // Mantener esta forma en el metadata
      });
  
      // Redibujar el canvas con las formas actualizadas
      if (removed) {
        this.drawImage(); // Redraw after removing the rectangle
      }
    }
  }

  drawLabel(x: number, y: number, color:string, label:string, thickness:number): void {
    if(this.ctx){
      const fontSize = Math.max(12, Math.min(thickness * 5, 24)); // Ajuste del tamaño de la fuente
      this.ctx.fillStyle = color; // label color
      this.ctx.font = `${fontSize}px Arial`; // font size
      this.ctx.fillText(label, x, y - 5); // label name and position  
    }
  }

  invertColor(hex: string): string {
    // El hexadecimal debe tener 6 caracteres (puede incluir el símbolo '#')
    if (hex.charAt(0) === '#') {
      hex = hex.substring(1);
    }
  
    // Parsear los valores rojo, verde y azul del color hexadecimal
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
  
    // Invertir cada componente
    const invertedR = (255 - r).toString(16).padStart(2, '0');
    const invertedG = (255 - g).toString(16).padStart(2, '0');
    const invertedB = (255 - b).toString(16).padStart(2, '0');
  
    // Construir el color invertido
    return `#${invertedR}${invertedG}${invertedB}`;
  }

  clearCanvas(): void {
    if(this.ctx){
      this.ctx.clearRect(0, 0, this.canvasnativeElement.width, this.canvasnativeElement.height);
      this.loadedImage = null;
    }
  }

  // Getter público para acceder a selectedTool
  getSelectedTool(): string {
    return this.selectedTool;
  }
}