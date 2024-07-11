// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MainAreaComponent } from './components/main-area/main-area.component';
import { ImageSliderComponent } from './components/image-slider/image-slider.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { AppRoutingModule } from './app-routing.module';  // Importa el módulo de enrutamiento
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    ToolbarComponent,
    SidebarComponent,
    MainAreaComponent,
    ImageSliderComponent,
    CanvasComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule  // Importa el módulo de enrutamiento aquí
  ],
  providers: [provideHttpClient(withFetch())],
  bootstrap: [AppComponent]
})
export class AppModule { }