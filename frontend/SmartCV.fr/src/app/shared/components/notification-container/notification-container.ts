import { Component, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-container.html',
  styleUrl: './notification-container.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationContainer implements OnDestroy {

  notifications: AppNotification[] = [];
  private sub: Subscription;

  constructor(
    private notifService: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.sub = this.notifService.notifications$.subscribe((list) => {
      this.notifications = list;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
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