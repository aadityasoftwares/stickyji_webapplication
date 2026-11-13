import { DestroyRef, Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';

/** Synchronous account boundary, independent of authentication and feature stores. */
@Injectable({ providedIn: 'root' })
export class SessionLifecycleService {
  private readonly ended = new Subject<void>();
  private readonly resets = new Set<() => void>();
  readonly ended$ = this.ended.asObservable();
  revision = 0;

  registerReset(reset: () => void): void {
    this.resets.add(reset);
    inject(DestroyRef).onDestroy(() => this.resets.delete(reset));
  }

  reset(): void {
    this.revision++;
    // Store resets cancel their own loads and discard any queued refresh first.
    for (const reset of this.resets) reset();
    this.ended.next();
  }
}
