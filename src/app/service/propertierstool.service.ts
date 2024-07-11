/*******************************Imports***********************************/
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

//Class with Propertiers for each tool Service
export class PropertierstoolService {
  /*******************************Variables***********************************/
  private labelSelected: BehaviorSubject<string> = new BehaviorSubject<string>('label');
  private colorSelected: BehaviorSubject<string> = new BehaviorSubject<string>('#FF0000');
  private thicknessSelected: BehaviorSubject<number> = new BehaviorSubject<number>(2);

  /************************Getter_and_Setter_Funtions***************************/
  //Label
  setLabel(label: string): void {
    this.labelSelected.next(label);
  }
  getLabelObservable(): Observable<string> {
    return this.labelSelected.asObservable();
  }

  //Color
  setColor(color: string): void {
    this.colorSelected.next(color);
  }
  getColorObservable(): Observable<string> {
    return this.colorSelected.asObservable();
  }

  //Thickness
  setThickness(thickness: number): void {
    this.thicknessSelected.next(thickness);
  }
  getThicknessObservable(): Observable<number> {
    return this.thicknessSelected.asObservable();
  }
}
