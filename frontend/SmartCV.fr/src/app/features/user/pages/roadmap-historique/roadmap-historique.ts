import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  CompetenceUpgradeService,
  GapSessionSummaryDto,
  GapSessionDetailDto,
} from '../../../../core/services/competence-upgrade.service';
import { GapSessionStateService } from '../../../../core/services/gap-session-state.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-roadmap-historique',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './roadmap-historique.html',
  styleUrl: './roadmap-historique.scss',
})
export class RoadmapHistorique implements OnInit {

  sessions: GapSessionSummaryDto[] = [];
  chargement = true;

  /** Which session card is expanded to show its skills */
  expandedSessionId: number | null = null;

  /** Detail loaded when a session is expanded */
  sessionDetail: GapSessionDetailDto | null = null;
  chargementDetail = false;

  /** Track which session is being navigated to (shows spinner on its button) */
  navigationEnCours: number | null = null;

  constructor(
    private competenceUpgradeService: CompetenceUpgradeService,
    private gapSessionState: GapSessionStateService,
    private notif: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.competenceUpgradeService.getGapSessions().subscribe({
      next: (data) => {
        this.sessions = data ?? [];
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Impossible de charger l\'historique des roadmaps.');
        this.chargement = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Expand / collapse session card ───────────────────────────────────────

  toggleSession(session: GapSessionSummaryDto): void {
    if (this.expandedSessionId === session.id) {
      // Collapse
      this.expandedSessionId = null;
      this.sessionDetail = null;
      this.cdr.detectChanges();
      return;
    }

    this.expandedSessionId = session.id;
    this.sessionDetail = null;
    this.chargementDetail = true;
    this.cdr.detectChanges();

    this.competenceUpgradeService.getGapSessionDetail(session.id).subscribe({
      next: (detail) => {
        this.sessionDetail = detail;
        this.chargementDetail = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Impossible de charger le détail de cette session.');
        this.chargementDetail = false;
        this.expandedSessionId = null;
        this.cdr.detectChanges();
      },
    });
  }

  isExpanded(session: GapSessionSummaryDto): boolean {
    return this.expandedSessionId === session.id;
  }

  // ─── Navigate into a session ───────────────────────────────────────────────

  /** Called from the session header button OR from an individual skill button */
  reprendreSession(session: GapSessionSummaryDto): void {
    this.navigationEnCours = session.id;
    this.cdr.detectChanges();

    // If we already have the detail loaded (expanded card), use it directly
    if (this.sessionDetail && this.sessionDetail.id === session.id) {
      this.naviguerVersSession(this.sessionDetail);
      return;
    }

    this.competenceUpgradeService.getGapSessionDetail(session.id).subscribe({
      next: (detail) => {
        this.naviguerVersSession(detail);
      },
      error: () => {
        this.notif.error('Impossible de charger la session. Veuillez réessayer.');
        this.navigationEnCours = null;
        this.cdr.detectChanges();
      },
    });
  }

  private naviguerVersSession(detail: GapSessionDetailDto): void {
    this.gapSessionState.setSession(detail);
    this.navigationEnCours = null;
    this.router.navigate(['/user/competence-upgrade'], {
      queryParams: { sessionId: detail.id },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  sessionLabel(session: GapSessionSummaryDto): string {
    if (session.titreOffre) return session.titreOffre;
    const text = session.texteOffre ?? '';
    return text.length > 70 ? text.substring(0, 70) + '…' : text || 'Offre sans titre';
  }

  progressionSession(session: GapSessionSummaryDto): number {
    if (!session.totalSkills) return 0;
    return Math.round((session.skillsTermines / session.totalSkills) * 100);
  }

  statutSession(session: GapSessionSummaryDto): 'complete' | 'encours' | 'nondemarre' {
    if (session.skillsTermines === session.totalSkills) return 'complete';
    if (session.skillsEnCours > 0 || session.skillsTermines > 0) return 'encours';
    return 'nondemarre';
  }

  statutLabel(session: GapSessionSummaryDto): string {
    const s = this.statutSession(session);
    if (s === 'complete')    return 'Complète';
    if (s === 'encours')     return 'En cours';
    return 'Non démarrée';
  }

  statutClass(session: GapSessionSummaryDto): string {
    return `statut-${this.statutSession(session)}`;
  }

  phaseLabel(phase: string | undefined): string {
    const map: Record<string, string> = {
      AParcourir:       'Roadmap à parcourir',
      PreteAuTestFinal: 'Prête pour le test',
      TestFinalEchoue:  'Test échoué',
      Validee:          'Validée',
    };
    return phase ? (map[phase] ?? phase) : 'Non démarrée';
  }

  phaseClass(phase: string | undefined, completee: boolean | undefined): string {
    if (completee) return 'skill-phase-valide';
    if (!phase)    return 'skill-phase-pending';
    const map: Record<string, string> = {
      AParcourir:       'skill-phase-parcours',
      PreteAuTestFinal: 'skill-phase-prete',
      TestFinalEchoue:  'skill-phase-echec',
      Validee:          'skill-phase-valide',
    };
    return map[phase] ?? 'skill-phase-pending';
  }

  prioriteLabel(priorite: string): string {
    switch (priorite) {
      case 'haute':     return 'Priorité haute';
      case 'renforcer': return 'À renforcer';
      default:          return 'À évaluer';
    }
  }
}