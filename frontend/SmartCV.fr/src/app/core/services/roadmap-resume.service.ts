import { Injectable } from '@angular/core';
import { RoadmapDetailDto } from './competence-upgrade.service';

/**
 * Singleton that holds a roadmap loaded from history so CompetenceUpgrade
 * can restore its state when navigated to via the history page.
 * Cleared after consumption to avoid stale data.
 */
@Injectable({ providedIn: 'root' })
export class RoadmapResumeService {
  private _detail: RoadmapDetailDto | null = null;

  setResume(detail: RoadmapDetailDto): void {
    this._detail = detail;
  }

  /** Consume and clear — call once in CompetenceUpgrade.ngOnInit */
  consumeResume(): RoadmapDetailDto | null {
    const d = this._detail;
    this._detail = null;
    return d;
  }

  get hasResume(): boolean {
    return this._detail !== null;
  }
}