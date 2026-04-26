import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-container.html',
  styleUrl: './notification-container.scss',
})
export class NotificationContainer {

  notifications: AppNotification[] = [];

  constructor(private notifService: NotificationService) {
    this.notifService.notifications$.subscribe((list) => {
      this.notifications = list;
    });
  }

  close(id: number): void {
    this.notifService.remove(id);
  }

  iconFor(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '•';
    }
  }
}
