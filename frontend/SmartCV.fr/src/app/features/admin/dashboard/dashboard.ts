import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { AdminService, AdminStatDto, AdminTemplateDto, AdminUtilisateurDetailDto, AdminUtilisateurDto } from '../../../core/services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {

  stats: AdminStatDto[] = [];
  utilisateurs: AdminUtilisateurDto[] = [];
  templates: AdminTemplateDto[] = [];

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

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.refreshStats();
    this.refreshUtilisateurs();
    this.refreshTemplates();
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
        finalize(() => (this.loadingStats = false))
      )
      .subscribe((stats) => (this.stats = stats));
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
        finalize(() => (this.loadingUsers = false))
      )
      .subscribe((users) => (this.utilisateurs = users));
  }

  refreshTemplates(): void {
    this.loadingTemplates = true;
    this.adminService.getTemplates()
      .pipe(
        catchError((err) => {
          console.error('Erreur chargement templates admin', err);
          this.lastError = 'Impossible de charger les templates.';
          return of([]);
        }),
        finalize(() => (this.loadingTemplates = false))
      )
      .subscribe((t) => (this.templates = t));
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
    if (confirm(`Supprimer ${u.nom} ?`)) {
      this.adminService.deleteUtilisateur(u.id).pipe(
        catchError((err) => {
          console.error('Erreur suppression utilisateur', err);
          return of(null);
        })
      ).subscribe(() => {
        this.utilisateurs = this.utilisateurs.filter(x => x !== u);
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────
  editerTemplate(t: AdminTemplateDto): void {
    console.log('Éditer template:', t);
    // TODO: router.navigate(['/admin/templates', t.id])
  }

  supprimerTemplate(t: AdminTemplateDto): void {
    if (!confirm(`Supprimer le template "${t.nom}" ?`)) return;
    this.adminService.deleteTemplate(t.id).pipe(
      catchError((err) => {
        console.error('Erreur suppression template', err);
        return of(null);
      })
    ).subscribe(() => {
      this.templates = this.templates.filter(x => x !== t);
    });
  }

  ajouterTemplate(): void {
    console.log('Ajouter template');
    // TODO: router.navigate(['/admin/templates/nouveau'])
  }

  ajouterTemplateGlobal(): void {
    console.log('Ajouter template global');
    // TODO: router.navigate(['/admin/templates/nouveau'])
  }
}
