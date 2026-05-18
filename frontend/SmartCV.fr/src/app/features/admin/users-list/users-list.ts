import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { AdminService, AdminUtilisateurDto } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AdminSidebarComponent } from '../../../shared/layout/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSidebarComponent],
  templateUrl: './users-list.html',
  styleUrl: './users-list.scss',
})
export class UsersList implements OnInit {
  utilisateurs: AdminUtilisateurDto[] = [];
  recherche = '';
  loading = false;
  lastError: string | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private notif: NotificationService,
    private confirmService: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  get utilisateursFiltres(): AdminUtilisateurDto[] {
    if (!this.recherche.trim()) return this.utilisateurs;
    const q = this.recherche.toLowerCase();
    return this.utilisateurs.filter(
      u => u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  refresh(): void {
    this.loading = true;
    this.adminService.getUtilisateurs()
      .pipe(
        catchError((err) => {
          console.error('Erreur chargement utilisateurs admin', err);
          this.lastError = 'Impossible de charger les utilisateurs.';
          return of([]);
        }),
        finalize(() => {
          this.zone.run(() => {
            this.loading = false;
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

  toggleActif(u: AdminUtilisateurDto): void {
    const next = !u.actif;
    u.actif = next;
    this.adminService.updateActif(u.id, next).pipe(
      catchError((err) => {
        console.error('Erreur update actif', err);
        u.actif = !next;
        this.notif.error('Impossible de changer le statut', err?.message);
        return of(null);
      })
    ).subscribe((res) => {
      if (res !== null) {
        this.notif.success(`Utilisateur ${next ? 'activé' : 'désactivé'}`);
      }
    });
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
          const msg = err?.error?.message ?? err?.message ?? 'Erreur inconnue';
          this.notif.error('Impossible de supprimer l\'utilisateur', msg);
          return of(null);
        })
      ).subscribe((res) => {
        if (res === null) return;
        this.zone.run(() => {
          this.utilisateurs = this.utilisateurs.filter(x => x.id !== u.id);
          this.cdr.detectChanges();
        });
        this.notif.success(`Utilisateur "${u.nom}" supprimé`);
      });
    });
  }

  retourDashboard(): void {
    this.router.navigate(['/admin']);
  }
}
