import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  CompetenceUpgradeService,
  RoadmapHistoriqueDto,
} from '../../../../core/services/competence-upgrade.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RoadmapResumeService } from '../../../../core/services/roadmap-resume.service';

@Component({
  selector: 'app-roadmap-historique',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './roadmap-historique.html',
  styleUrl: './roadmap-historique.scss',
})
export class RoadmapHistorique implements OnInit {

  roadmaps: RoadmapHistoriqueDto[] = [];
  chargement = true;
  resumeEnCours: number | null = null;

  constructor(
    private competenceUpgradeService: CompetenceUpgradeService,
    private roadmapResumeService: RoadmapResumeService,
    private notif: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    this.competenceUpgradeService.getHistorique().subscribe({
      next: (data) => {
        this.roadmaps = data ?? [];
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

  reprendre(roadmap: RoadmapHistoriqueDto): void {
    if (roadmap.completee) return;

    this.resumeEnCours = roadmap.id;

    this.competenceUpgradeService.getRoadmapDetail(roadmap.id).subscribe({
      next: (detail) => {
        // Store full detail in resume service so competence-upgrade can restore state
        this.roadmapResumeService.setResume(detail);
        this.resumeEnCours = null;
        this.router.navigate(['/user/competence-upgrade']);
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback: navigate without detail — competence-upgrade will handle gracefully
        this.notif.error(
          'Impossible de charger le détail de la roadmap. ' +
          'Le backend doit exposer GET /api/competences/roadmaps/{id}.'
        );
        this.resumeEnCours = null;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  statutLabel(roadmap: RoadmapHistoriqueDto): string {
    if (roadmap.completee) return 'Validée';
    if (roadmap.testStatut === 'Echoue') return 'Échouée';
    return 'En cours';
  }

  statutClass(roadmap: RoadmapHistoriqueDto): string {
    if (roadmap.completee) return 'statut-validee';
    if (roadmap.testStatut === 'Echoue') return 'statut-echouee';
    return 'statut-encours';
  }

  niveauLabel(niveau: string): string {
    const map: Record<string, string> = {
      Debutant: 'Débutant',
      Moyen: 'Moyen',
      Expert: 'Expert',
    };
    return map[niveau] ?? niveau;
  }

  scoreLabel(roadmap: RoadmapHistoriqueDto): string {
    if (roadmap.testScore == null) return '—';
    return `${roadmap.testScore}/100`;
  }
}