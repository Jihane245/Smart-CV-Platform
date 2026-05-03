import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { AdminService, AdminStatDto, AdminTemplateDto, AdminUtilisateurDetailDto, AdminUtilisateurDto } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AuthService } from '../../../core/services/auth.service';
import { TemplatePreview } from '../template-editor/template-preview/template-preview';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, TemplatePreview],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  stats: AdminStatDto[] = [];
  utilisateurs: AdminUtilisateurDto[] = [];
  templates: AdminTemplateDto[] = [];

  // Modal détail template
  templateDetail: AdminTemplateDto | null = null;

  // Sélection du mois pour filtrer les stats
  // null = afficher le total ; index 0-6 = afficher le mois correspondant
  selectedMonthIndex: number | null = null;

  // Labels des 7 derniers mois générés dynamiquement
  monthLabels: string[] = [];

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAT UI
  // ─────────────────────────────────────────────────────────────────────────
  recherche = '';
  initiales = 'JG';
  loadingStats = false;
  loadingUsers = false;
  loadingTemplates = false;
  lastError: string | null = null;

  // Modal détail utilisateur
  userDetail: AdminUtilisateurDetailDto | null = null;
  loadingUserDetail = false;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private notif: NotificationService,
    private confirmService: ConfirmService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.genererMonthLabels();
    this.refreshStats();
    this.refreshUtilisateurs();
    this.refreshTemplates();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MOIS DYNAMIQUE
  // ─────────────────────────────────────────────────────────────────────────

  // Génère les 12 mois de l'année en cours (Jan → Déc)
  private genererMonthLabels(): void {
    this.monthLabels = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ];
  }

  // L'utilisateur clique sur un mois
  selectMonth(index: number): void {
    this.selectedMonthIndex = this.selectedMonthIndex === index ? null : index;
  }

  // Réinitialise la sélection (revient au total)
  resetMonth(): void {
    this.selectedMonthIndex = null;
  }

  // Retourne la valeur à afficher pour une stat (total ou mois sélectionné)
  getStatValeur(stat: AdminStatDto): number {
    if (this.selectedMonthIndex !== null && stat.historique && stat.historique[this.selectedMonthIndex] !== undefined) {
      return stat.historique[this.selectedMonthIndex];
    }
    return stat.valeur;
  }

  // Retourne le label "Total" ou "Durant <Mois>"
  getStatLabel(): string {
    if (this.selectedMonthIndex === null) return 'Total';
    return `Durant ${this.monthLabels[this.selectedMonthIndex]}`;
  }

  get utilisateursFiltres(): AdminUtilisateurDto[] {
    if (!this.recherche.trim()) return this.utilisateurs;
    const q = this.recherche.toLowerCase();
    return this.utilisateurs.filter(
      u => u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  refreshStats(): void {
    this.loadingStats = true;
    this.adminService.getStats()
      .pipe(
        catchError((err) => {
          console.error('Erreur chargement stats admin', err);
          this.lastError = 'Impossible de charger les statistiques.';
          return of([]);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.loadingStats = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe((stats) => {
        this.zone.run(() => {
          this.stats = stats;
          this.cdr.detectChanges();
        });
      });
  }

  refreshUtilisateurs(): void {
    this.loadingUsers = true;
    this.adminService.getUtilisateurs()
      .pipe(
        catchError((err) => {
          console.error('Erreur chargement utilisateurs admin', err);
          this.lastError = 'Impossible de charger les utilisateurs.';
          return of([]);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.loadingUsers = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe((users) => {
        this.zone.run(() => {
          this.utilisateurs = users;
          this.cdr.detectChanges();
        });
      });
  }

  refreshTemplates(): void {
    console.log('🔄 [DEBUG] refreshTemplates() appelé');
    this.loadingTemplates = true;
    this.adminService.getTemplates()
      .pipe(
        catchError((err) => {
          console.error('❌ [DEBUG] Erreur chargement templates admin', err);
          this.lastError = 'Impossible de charger les templates.';
          return of([]);
        }),
        finalize(() => {
          console.log('✅ [DEBUG] refreshTemplates() terminé (finalize)');
          this.zone.run(() => {
            this.loadingTemplates = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe((t) => {
        console.log('📦 [DEBUG] Templates reçus :', t);
        this.zone.run(() => {
          this.templates = t;
          this.cdr.detectChanges();
          console.log('🎯 [DEBUG] this.templates.length après set =', this.templates.length);
        });
      });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS UTILISATEURS
  // ─────────────────────────────────────────────────────────────────────────
  voirUtilisateur(u: AdminUtilisateurDto): void {
    this.loadingUserDetail = true;
    this.userDetail = null;
    this.adminService.getUtilisateur(u.id)
      .pipe(
        catchError((err) => {
          console.error('Erreur chargement détail utilisateur', err);
          this.lastError = 'Impossible de charger les détails de l\'utilisateur.';
          return of(null);
        }),
        finalize(() => (this.loadingUserDetail = false))
      )
      .subscribe((detail) => (this.userDetail = detail));
  }

  fermerUserDetail(): void {
    this.userDetail = null;
  }

  toggleActif(u: AdminUtilisateurDto): void {
    const next = !u.actif;
    // Optimistic UI
    u.actif = next;
    this.adminService.updateActif(u.id, next).pipe(
      catchError((err) => {
        console.error('Erreur update actif', err);
        // rollback
        u.actif = !next;
        return of(null);
      })
    ).subscribe();
  }

  supprimerUtilisateur(u: AdminUtilisateurDto): void {
    this.confirmService.confirm({
      title: 'Supprimer l\'utilisateur',
      message: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${u.nom}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then((ok) => {
      if (!ok) return;
      this.adminService.deleteUtilisateur(u.id).pipe(
        catchError((err) => {
          console.error('Erreur suppression utilisateur', err);
          this.notif.error('Impossible de supprimer l\'utilisateur', err?.message);
          return of(null);
        })
      ).subscribe((res) => {
        if (res !== null) {
          this.zone.run(() => {
            this.utilisateurs = this.utilisateurs.filter(x => x !== u);
            this.cdr.detectChanges();
          });
          this.notif.success(`Utilisateur "${u.nom}" supprimé`);
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────
  editerTemplate(t: AdminTemplateDto): void {
    this.router.navigate(['/admin/templates', t.id, 'edit']);
  }

  // Ouvre le modal détail quand on clique sur une carte template
  voirDetailTemplate(t: AdminTemplateDto): void {
    this.templateDetail = t;
  }

  // Ferme le modal détail
  fermerDetailTemplate(): void {
    this.templateDetail = null;
  }


  supprimerTemplate(t: AdminTemplateDto): void {
    this.confirmService.confirm({
      title: 'Supprimer le template',
      message: `Êtes-vous sûr de vouloir supprimer le template "${t.nom}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then((ok) => {
      if (!ok) return;
      this.adminService.deleteTemplate(t.id).pipe(
        catchError((err) => {
          console.error('Erreur suppression template', err);
          this.notif.error('Impossible de supprimer le template', err?.message);
          return of(null);
        })
      ).subscribe((res) => {
        if (res !== null) {
          this.zone.run(() => {
            this.templates = this.templates.filter(x => x.id !== t.id);
            this.cdr.detectChanges();
          });
          this.notif.success(`Template "${t.nom}" supprimé`);
        }
      });
    });
  }

 ajouterTemplate(): void {
    this.router.navigate(['/admin/templates/nouveau']);
  }
 ajouterTemplateGlobal(): void {
    this.router.navigate(['/admin/templates/nouveau']);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DÉCONNEXION (immédiate, sans confirmation)
  // ─────────────────────────────────────────────────────────────────────────
  async logout(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Se déconnecter ?',
      message: 'Voulez-vous vraiment vous déconnecter ? Toutes vos modifications non enregistrées seront perdues.',
      confirmText: 'Se déconnecter',
      cancelText: 'Annuler',
      type: 'danger',
    });
    if (!ok) return;
    this.authService.logout();
  }

}

