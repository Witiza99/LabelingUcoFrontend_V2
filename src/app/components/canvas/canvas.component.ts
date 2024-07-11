/*******************************Imports***********************************/
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

//Class Canvas Component
export class CanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  /*******************************Decorators***********************************/
  @Input() image: ImageWithMetadata | null = null;
  @ViewChild('canvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement>;
  
  /*******************************Variables***********************************/
  //canvas/context var
  public isBrowser: boolean;
  private canvasnativeElement!: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null; 
  private loadedImage: HTMLImageElement | null = null;
  private isCanvasReady = false;

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

  /*******************************Constructor***********************************/
  constructor(
    private toolService: ToolService, 
    private propertierstoolService: PropertierstoolService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /******************************Angular_Functions*******************************/
  //Load Image and subscribe to tool event
  ngAfterViewInit(): void {
    if (this.canvas && this.canvas.nativeElement) {
      this.canvasnativeElement = this.canvas.nativeElement;
      this.ctx = this.canvasnativeElement.getContext('2d');
      if (!this.ctx) {
        console.error('Ctx dont exist.');
      }
      this.isCanvasReady = true;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['image'] && this.isCanvasReady) {
      this.loadImage();
    }
  }

  ngOnDestroy(): void {
    if (this.toolSubscription) {
      this.toolSubscription.unsubscribe();
    }
    if (this.toolPropertiesSubscription) {
      this.toolPropertiesSubscription.unsubscribe();
    }
  }

  /************************Getter_and_Setter_Funtions***************************/
  getSelectedTool(): string {
    return this.selectedTool;
  }

  /******************************Others_Functions*******************************/
  //Listeners
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
      }
      this.isClicked = true; 
      this.isDrawing = false;
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isClicked) { 
      this.isDrawing = true;
      switch (this.selectedTool) {
        case 'rectangle':
          this.updateRectangleDrawing(event);
          break;
        case 'circle':
          break;
        case 'poligone':
          break;
      }
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (event.button === 0 && this.isClicked) { 
      if (this.isDrawing) {
        switch (this.selectedTool) {
          case 'rectangle':
            this.finishRectangleDrawing(event);
            break;
          case 'circle':
            break;
          case 'poligone':
            break;
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
    }
  }

  //Save image to load in canvas
  loadImage(): void {
    if (this.image && this.image.file ) {
      if (this.ctx) {
        const img = new Image();
        img.src = URL.createObjectURL(this.image.file);
        img.onload = () => {
          this.loadedImage = img;
          this.drawImage();
        };
      }
    }else{
      this.clearCanvas();
    }
  }

  //draw methots
  //draw metadata on image canvas
  drawImage(): void {
    if (this.loadedImage && this.image) {
      if (this.ctx != null) {
        this.ctx.clearRect(0, 0, this.canvasnativeElement.width, this.canvasnativeElement.height);
        this.ctx.drawImage(this.loadedImage, 0, 0, this.canvasnativeElement.width, this.canvasnativeElement.height);
        if (this.image.metadata) {
          // Iterate all metadata
          this.image.metadata.forEach(shape => {
            this.drawShape(shape); // Call a methot for draw that shape
          });
        }
      }
    }
  }

  //draw specific shape on image canvas
  drawShape(shape: any): void {
    if (this.ctx) { // Check ctx is defined
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
          // More case
        default:
          break;
      }
    } else {
      console.error('Context 2D is not defined');
    }    
  }

  //draw renctangle shape
  drawRectangles(shape: Rectangle): void {
    if(this.ctx){
      const canvasWidth = this.canvasnativeElement.width;
      const canvasHeight = this.canvasnativeElement.height;

      // Get coords and width/height with canvas resolution
      const x_center = shape.x * canvasWidth;
      const y_center = shape.y * canvasHeight;
      const width = shape.width * canvasWidth;
      const height = shape.height * canvasHeight;

      // Get upper left corner
      const x1 = x_center - width / 2;
      const y1 = y_center - height / 2;

      // Draw rectangle with metadata
      this.ctx.strokeStyle = shape.color;
      this.ctx.lineWidth = shape.thickness;
      this.ctx.strokeRect(x1, y1, width, height);
      this.drawLabel(x1, y1, shape.color, shape.label, shape.thickness);
    } 
  }

  //remove rectagle from image
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
          // Get coords and width/height with canvas resolution for upper left corner
          const rectX1 = (shape.x - shape.width / 2) * this.canvasnativeElement.width;
          const rectY1 = (shape.y - shape.height / 2) * this.canvasnativeElement.height;
          const rectX2 = rectX1 + shape.width * this.canvasnativeElement.width;
          const rectY2 = rectY1 + shape.height * this.canvasnativeElement.height;
  
          // Check if event coords are inside box
          if (x >= rectX1 && x <= rectX2 && y >= rectY1 && y <= rectY2) {
            removed = true;
            return false;
          }
        }
        return true;
      });
  
      if (removed) {
        this.drawImage(); // Redraw after removing the rectangle
      }
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
            this.drawShape(shape);
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

      // Get upper left corner
      const x1 = Math.min(this.startX, this.currentX);
      const y1 = Math.min(this.startY, this.currentY);
      const width = Math.abs(this.currentX - this.startX);
      const height = Math.abs(this.currentY - this.startY);

      // Get center
      const x_center = x1 + width / 2;
      const y_center = y1 + height / 2;

      // Get canvas width and height
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Normalize canvas size
      const normalized_x_center = x_center / canvasWidth;
      const normalized_y_center = y_center / canvasHeight;
      const normalized_width = width / canvasWidth;
      const normalized_height = height / canvasHeight;
  
      // Create shape object to shave metadata
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

      // Yolo format
      //const yoloFormat = `${this.label} ${normalized_x_center.toFixed(6)} ${normalized_y_center.toFixed(6)} ${normalized_width.toFixed(6)} ${normalized_height.toFixed(6)}`;
  
      // Add new shape to metadata
      if (!this.image.metadata) {
        this.image.metadata = [];
      }
      this.image.metadata.push(newShape);
  
      // Draw image again
      this.drawImage();
    }
  }

  drawLabel(x: number, y: number, color:string, label:string, thickness:number): void {
    if(this.ctx){
      const fontSize = Math.max(12, Math.min(thickness * 5, 24)); // Adjust size font
      this.ctx.fillStyle = color; // label color
      this.ctx.font = `${fontSize}px Arial`; // font size
      this.ctx.fillText(label, x, y - 5); // label name and position  
    }
  }

  invertColor(hex: string): string {
    // Hex have 6 characters(can include '#')
    if (hex.charAt(0) === '#') {
      hex = hex.substring(1);
    }
  
    // Parse red, green and blue to hex
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
  
    // Invertir each component
    const invertedR = (255 - r).toString(16).padStart(2, '0');
    const invertedG = (255 - g).toString(16).padStart(2, '0');
    const invertedB = (255 - b).toString(16).padStart(2, '0');
  
    // Build invert color
    return `#${invertedR}${invertedG}${invertedB}`;
  }

  clearCanvas(): void {
    if(this.ctx){
      this.ctx.clearRect(0, 0, this.canvasnativeElement.width, this.canvasnativeElement.height);
      this.loadedImage = null;
    }
  }
}