// src/app/components/toolbar/toolbar.component.ts
import { Component } from '@angular/core';
import { ToolService } from '../../service/selectedtool.service';


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
})
export class ToolbarComponent {
  private selectedShape: string = ''; // Inicialmente ningún botón está seleccionado

  constructor(private toolSevice: ToolService){}

  selectShape(shape: string): void {
    this.selectedShape = shape; // Actualiza el estado del botón seleccionado
    this.toolSevice.setSelectedTool(this.selectedShape);
  }

  // Método para verificar si un botón está seleccionado
  isShapeSelected(shape: string): boolean {
    return this.selectedShape === shape;
  }
}