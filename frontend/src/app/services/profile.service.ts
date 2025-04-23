import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileSubject = new BehaviorSubject<any>(null);
  public profile$: Observable<any> = this.profileSubject.asObservable();

  setProfile(profile: any): void {
    this.profileSubject.next(profile);
  }
} 