/*******************************Imports***********************************/
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

//Class with Tool Service
export class ToolService {
  /*******************************Variables***********************************/
  private selectedToolSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private selectedtool: string = "";

  /*******************************Constructor***********************************/
  constructor() { }

  /************************Getter_and_Setter_Funtions***************************/
  setSelectedTool(tool: string): void {
    this.selectedtool = tool;
    this.selectedToolSubject.next(this.selectedtool);
  }

  getSelectedToolObservable(): Observable<string> {
    return this.selectedToolSubject.asObservable();
  }
}