import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  details?: string;
  timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this._notifications.asObservable();

  private nextId = 1;

  success(message: string, details?: string): void {
    this.add({ type: 'success', message, details, timeout: 4000 });
  }

  error(message: string, details?: string): void {
    this.add({ type: 'error', message, details, timeout: 7000 });
  }

  info(message: string, details?: string): void {
    this.add({ type: 'info', message, details, timeout: 4000 });
  }

  warning(message: string, details?: string): void {
    this.add({ type: 'warning', message, details, timeout: 5000 });
  }

  remove(id: number): void {
    const current = this._notifications.value.filter(n => n.id !== id);
    this._notifications.next(current);
  }

  private add(n: Omit<AppNotification, 'id'>): void {
    const id = this.nextId++;
    const notification: AppNotification = { ...n, id };
    this._notifications.next([...this._notifications.value, notification]);

    if (notification.timeout && notification.timeout > 0) {
      setTimeout(() => this.remove(id), notification.timeout);
    }
  }
}
