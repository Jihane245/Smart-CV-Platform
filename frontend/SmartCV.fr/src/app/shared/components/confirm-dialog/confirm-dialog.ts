import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {

  options: ConfirmOptions | null = null;

  constructor(private confirmService: ConfirmService) {
    this.confirmService.state$.subscribe((opts) => {
      this.options = opts;
    });
  }

  accept(): void {
    this.confirmService.accept();
  }

  reject(): void {
    this.confirmService.reject();
  }

  iconFor(type: string | undefined): string {
    switch (type) {
      case 'danger': return '⚠';
      case 'warning': return '!';
      case 'info': return 'ℹ';
      default: return '?';
    }
  }
}
