/*******************************Imports***********************************/
import { Component, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})

//Header Class
export class HeaderComponent {
  /*******************************Decorators***********************************/
  @Output() imagesUploaded = new EventEmitter<File[]>();

  /*******************************Variables***********************************/
  private selectedFiles: File[] = [];
  
  /******************************Others_Functions*******************************/
  //Throw event for new upload
  async triggerUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = [];

    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        this.selectedFiles.push(input.files.item(i) as File);
      }
      this.imagesUploaded.emit(this.selectedFiles);
    }
  }
}
