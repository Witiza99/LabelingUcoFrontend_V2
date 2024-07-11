/*******************************Imports***********************************/
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

//Class with Spinner Service
export class SpinnerService {
  /*******************************Variables***********************************/
  private spinnerSubject = new BehaviorSubject<boolean>(false);

  /************************Getter_and_Setter_Funtions***************************/
  get spinnerState() {
    return this.spinnerSubject.asObservable();
  }

  /******************************Others_Functions*******************************/
  show() {
    this.spinnerSubject.next(true);
  }

  hide() {
    this.spinnerSubject.next(false);
  }
}