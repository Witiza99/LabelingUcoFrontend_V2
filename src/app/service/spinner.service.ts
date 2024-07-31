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
  private messageSubject = new BehaviorSubject<string | null>(null);

  /************************Getter_and_Setter_Funtions***************************/
  get spinnerState() {
    return this.spinnerSubject.asObservable();
  }

  get spinnerMessage() {
    return this.messageSubject.asObservable();
  }

  /******************************Others_Functions*******************************/
  show(message: string | null = null) {
    this.spinnerSubject.next(true);
    this.messageSubject.next(message);
  }

  hide() {
    this.spinnerSubject.next(false);
    this.messageSubject.next(null);
  }
}