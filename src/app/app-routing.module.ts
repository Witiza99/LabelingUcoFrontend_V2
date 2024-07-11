// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainAreaComponent } from './components/main-area/main-area.component';

const routes: Routes = [
  //{ path: '', component: MainAreaComponent },
  // Puedes agregar más rutas aquí si es necesario
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
