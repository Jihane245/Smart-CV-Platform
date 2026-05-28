import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, finalize } from 'rxjs/operators';

import {
  DashboardUserDto,
  DashboardUserService,
} from '../../../../core/services/dashboard-user.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface StatCard {
  label: string;
  value: number;
  link: string;
  linkLabel: string;
  accent: string;
}

interface ChartSlice {
  label: string;
  value: number;
  color: string;
}

interface BarItem {
  label: string;
  value: number;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  chargement = true;
  dashboard: DashboardUserDto | null = null;

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private dashboardService: DashboardUserService,
    private notif: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        filter(() => this.estRouteTableauDeBord()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.charger());

    this.charger();
  }

  private estRouteTableauDeBord(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0];
    return path === '/user' || path === '/user/';
  }

  get statCards(): StatCard[] {
    const d = this.dashboard;
    if (!d) return [];
    return [
      {
        label: 'CV générés',
        value: d.nbCv,
        link: '/user/historique',
        linkLabel: 'Historique',
        accent: 'stat-sage',
      },
      {
        label: 'Lettres de motivation',
        value: d.nbLettres,
        link: '/user/lettre-motivation',
        linkLabel: 'Lettres',
        accent: 'stat-burgundy',
      },
      {
        label: 'Tests passés',
        value: d.nbTests,
        link: '/user/roadmap-historique',
        linkLabel: 'Roadmaps',
        accent: 'stat-amber',
      },
      {
        label: 'Parcours roadmap',
        value: d.nbRoadmaps,
        link: '/user/roadmap-historique',
        linkLabel: 'Voir',
        accent: 'stat-bronze',
      },
      {
        label: 'Compétences profil',
        value: d.nbCompetences,
        link: '/user/profil',
        linkLabel: 'Profil',
        accent: 'stat-olive',
      },
    ];
  }

  get activiteSlices(): ChartSlice[] {
    const d = this.dashboard;
    if (!d) return [];
    return [
      { label: 'CV', value: d.nbCv, color: '#6b8068' },
      { label: 'Lettres', value: d.nbLettres, color: '#6F2232' },
      { label: 'Tests', value: d.nbTests, color: '#c0853a' },
      { label: 'Roadmaps', value: d.nbRoadmaps, color: '#c9a86c' },
      { label: 'Compétences', value: d.nbCompetences, color: '#8ba17e' },
    ];
  }

  get activiteTotal(): number {
    return this.activiteSlices.reduce((s, x) => s + x.value, 0);
  }

  get activitePieGradient(): string {
    const slices = this.activiteSlices.filter(s => s.value > 0);
    const total = this.activiteTotal;
    if (!total) return 'conic-gradient(#e8e0d4 0turn 1turn)';
    let a = 0;
    const parts = slices.map(s => {
      const start = a;
      a += s.value / total;
      return `${s.color} ${start}turn ${a}turn`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }

  get scoreBars(): BarItem[] {
    return [
      {
        label: 'Score CV',
        value: this.scoreCvArrondi,
        pct: this.scoreCvArrondi,
        color: '#6b8068',
      },
      {
        label: 'Score tests',
        value: this.scoreTestsArrondi,
        pct: this.scoreTestsArrondi,
        color: '#c0853a',
      },
      {
        label: 'Taux réussite',
        value: this.tauxReussiteArrondi,
        pct: this.tauxReussiteArrondi,
        color: '#6F2232',
      },
    ];
  }

  get reussitePieGradient(): string {
    const ok = this.tauxReussiteArrondi;
    if (ok <= 0) return 'conic-gradient(#e8e0d4 0turn 1turn)';
    const t = Math.min(ok, 100) / 100;
    return `conic-gradient(#8ba17e 0turn ${t}turn, #d2b48c ${t}turn 1turn)`;
  }

  get topCompetenceBars(): BarItem[] {
    const list = this.dashboard?.topCompetencesCv ?? [];
    const n = list.length;
    return list.map((nom, i) => ({
      label: nom,
      value: n - i,
      pct: n > 0 ? Math.round(((n - i) / n) * 100) : 0,
      color: ['#6b8068', '#8ba17e', '#c0853a', '#7a6040', '#6F2232'][i] ?? '#7a6040',
    }));
  }

  get faibleBars(): BarItem[] {
    const list = this.dashboard?.competencesFaibles ?? [];
    return list.map((nom, i) => ({
      label: nom,
      value: 1,
      pct: 100 - i * 12,
      color: '#8b2020',
    }));
  }

  get scoreCvArrondi(): number {
    return this.arrondir(this.dashboard?.scoreCvMoyen ?? 0);
  }

  get scoreTestsArrondi(): number {
    return this.arrondir(this.dashboard?.scoreTestsMoyen ?? 0);
  }

  get tauxReussiteArrondi(): number {
    return this.arrondir(this.dashboard?.tauxReussiteTests ?? 0);
  }

  scoreNiveau(score: number): string {
    if (score >= 75) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'À améliorer';
    return 'Faible';
  }

  scoreClasse(score: number): string {
    if (score >= 75) return 'score-high';
    if (score >= 60) return 'score-mid';
    if (score >= 40) return 'score-low';
    return 'score-weak';
  }

  private charger(): void {
    this.chargement = true;
    this.dashboardService
      .getDashboard()
      .pipe(
        finalize(() => {
          this.chargement = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: data => {
          this.dashboard = data;
          this.cdr.detectChanges();
        },
        error: () => {
          this.notif.error('Impossible de charger votre tableau de bord.');
          this.dashboard = null;
          this.cdr.detectChanges();
        },
      });
  }

  private arrondir(n: number): number {
    return Math.round(n * 10) / 10;
  }
}
