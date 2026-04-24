import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationContainer } from './shared/components/notification-container/notification-container';
import { ConfirmDialog } from './shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationContainer, ConfirmDialog],
  template: `
    <router-outlet></router-outlet>
    <app-notification-container></app-notification-container>
    <app-confirm-dialog></app-confirm-dialog>
  `,
})
export class App {}
