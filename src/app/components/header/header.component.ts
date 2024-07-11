import { Component, Output, EventEmitter } from '@angular/core';
import { SpinnerService } from '../../service/spinner.service';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Output() imagesUploaded = new EventEmitter<File[]>();
  private selectedFiles: File[] = [];
  
  async triggerUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = [];

    if (input.files && input.files.length > 0) {
      
      //this.spinnerService.show();
      //const processedFiles = await this.processFiles(input.files);
      //this.spinnerService.hide();   
      for (let i = 0; i < input.files.length; i++) {
        this.selectedFiles.push(input.files.item(i) as File);
      }
      // Emitir el array de archivos procesados
      this.imagesUploaded.emit(this.selectedFiles);
    }
  }
}
