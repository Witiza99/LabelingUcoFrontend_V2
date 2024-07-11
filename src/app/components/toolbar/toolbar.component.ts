/*******************************Imports***********************************/
import { Component } from '@angular/core';
import { ToolService } from '../../service/selectedtool.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
})

//Class toolbar
export class ToolbarComponent {
  /*******************************Variables***********************************/
  private selectedShape: string = ''; // No tool selected

  /*******************************Constructor***********************************/
  constructor(private toolSevice: ToolService){}

  /******************************Others_Functions*******************************/
  selectShape(shape: string): void {
    this.selectedShape = shape; // Update selected button
    this.toolSevice.setSelectedTool(this.selectedShape);
  }

  // Methot for check what tool is selected
  isShapeSelected(shape: string): boolean {
    return this.selectedShape === shape;
  }
}