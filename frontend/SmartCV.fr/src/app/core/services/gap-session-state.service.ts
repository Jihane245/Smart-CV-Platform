import { Injectable } from '@angular/core';
import { GapSessionDetailDto } from './competence-upgrade.service';

/**
 * Carries a GapSession from wherever it was created/selected
 * (generate-cv or roadmap-historique) into the competence-upgrade page.
 *
 * The session id is also encoded in the URL as a query param (?sessionId=X)
 * so a page refresh can reload it from the backend. This service is just
 * a fast-path to avoid the extra HTTP round-trip on initial navigation.
 *
 * Always call consumeSession() once in CompetenceUpgrade.ngOnInit —
 * it clears the in-memory cache so stale data is never reused.
 */
@Injectable({ providedIn: 'root' })
export class GapSessionStateService {
  private _session: GapSessionDetailDto | null = null;
  private _sessionId: number | null = null;

  /** Store before navigating to competence-upgrade. */
  setSession(session: GapSessionDetailDto): void {
    this._session = session;
    this._sessionId = session.id;
  }

  /** Store only the id (used when the session was just created and detail
   *  hasn't been fetched yet — competence-upgrade will fetch it itself). */
  setSessionId(id: number): void {
    this._sessionId = id;
    this._session = null;
  }

  /**
   * Consume and clear — call once in ngOnInit.
   * Returns [detail | null, sessionId | null].
   * If detail is null but sessionId is not, the page should fetch the detail.
   */
  consume(): { detail: GapSessionDetailDto | null; sessionId: number | null } {
    const result = { detail: this._session, sessionId: this._sessionId };
    this._session = null;
    this._sessionId = null;
    return result;
  }

  get hasPending(): boolean {
    return this._sessionId !== null;
  }
}