// tool.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  private selectedToolSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private selectedtool: string = "";

  constructor() { }

  setSelectedTool(tool: string): void {
    this.selectedtool = tool;
    this.selectedToolSubject.next(this.selectedtool);
  }

  getSelectedToolObservable(): Observable<string> {
    return this.selectedToolSubject.asObservable();
  }
}