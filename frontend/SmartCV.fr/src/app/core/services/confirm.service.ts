import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ConfirmType = 'info' | 'warning' | 'danger';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {

  private _state = new BehaviorSubject<ConfirmOptions | null>(null);
  readonly state$ = this._state.asObservable();

  private resolver: ((result: boolean) => void) | null = null;

  confirm(options: ConfirmOptions): Promise<boolean> {
    this._state.next(options);
    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  accept(): void {
    if (this.resolver) this.resolver(true);
    this.cleanup();
  }

  reject(): void {
    if (this.resolver) this.resolver(false);
    this.cleanup();
  }

  private cleanup(): void {
    this._state.next(null);
    this.resolver = null;
  }
}
