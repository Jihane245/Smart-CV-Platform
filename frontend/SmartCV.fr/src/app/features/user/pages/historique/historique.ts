import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CvService,
  PdfHistorique,
  BACKEND_ORIGIN,
} from '../../../../core/services/cv.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './historique.html',
  styleUrl: './historique.scss',
})
export class Historique implements OnInit {
  // Liste complète reçue du backend (triée desc par date)
  private pdfsAll: PdfHistorique[] = [];

  // Pagination : N PDFs par page, page courante (0-indexée)
  static readonly PAGE_SIZE = 10;
  pageCourante = 0;

  totalPdfs = 0;
  chargement = true;

  // Identité de l'utilisateur (pour construire le nom convivial du PDF)
  private prenom = '';
  private nom = '';

  constructor(
    private cvService: CvService,
    private authService: AuthService,
    private notif: NotificationService,
    private confirmService: ConfirmService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement = true;
    forkJoin({
      pdfs: this.cvService.getMesPdfs(),
      status: this.authService.getStatus(),
    }).subscribe({
      next: ({ pdfs, status }) => {
        // Backend renvoie déjà trié desc par date → le plus récent en premier
        this.pdfsAll = pdfs;
        this.totalPdfs = pdfs.length;
        this.pageCourante = 0; // on revient toujours à la 1ère page au chargement
        this.prenom = status.givenName ?? '';
        this.nom = status.surname ?? '';
        this.chargement = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Impossible de charger l\'historique des PDFs.');
        this.chargement = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Pagination ──────────────────────────────────────────────
  get pageSize(): number { return Historique.PAGE_SIZE; }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalPdfs / Historique.PAGE_SIZE));
  }

  // PDFs visibles sur la page courante
  get pdfs(): PdfHistorique[] {
    const start = this.pageCourante * Historique.PAGE_SIZE;
    return this.pdfsAll.slice(start, start + Historique.PAGE_SIZE);
  }

  // 1-indexées pour l'affichage à l'utilisateur (ex: "Affichage 11-20")
  get firstIndexAffiche(): number {
    return this.pdfsAll.length === 0 ? 0 : this.pageCourante * Historique.PAGE_SIZE + 1;
  }
  get lastIndexAffiche(): number {
    return Math.min((this.pageCourante + 1) * Historique.PAGE_SIZE, this.totalPdfs);
  }

  get hasPagePrecedente(): boolean { return this.pageCourante > 0; }
  get hasPageSuivante(): boolean { return this.pageCourante < this.totalPages - 1; }

  pageSuivante(): void {
    if (this.hasPageSuivante) {
      this.pageCourante++;
      this.scrollHaut();
    }
  }
  pagePrecedente(): void {
    if (this.hasPagePrecedente) {
      this.pageCourante--;
      this.scrollHaut();
    }
  }

  private scrollHaut(): void {
    // Petit scroll vers le haut pour bien voir les nouveaux PDFs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Nom convivial du PDF dans le format CV_Nom_Prenom.pdf, en utilisant EN
  // PRIORITÉ le prénom/nom capturés au moment de l'export (= ce qui apparaît
  // réellement dans ce PDF précisément). Fallback sur le nom du user connecté,
  // puis sur le fileName technique.
  displayName(pdf: PdfHistorique): string {
    const prenom = (pdf.prenom ?? this.prenom ?? '').trim();
    const nom    = (pdf.nom    ?? this.nom    ?? '').trim();
    if (nom && prenom) return `CV_${nom}_${prenom}.pdf`;
    if (nom)           return `CV_${nom}.pdf`;
    if (prenom)        return `CV_${prenom}.pdf`;
    return pdf.fileName;
  }

  // URL absolue du PDF (servi en statique par le backend)
  pdfUrl(pdf: PdfHistorique): string {
    return `${BACKEND_ORIGIN}${pdf.cloudUrl}`;
  }

  // Ouvre le PDF dans un nouvel onglet (visualisation, sans téléchargement)
  voir(pdf: PdfHistorique): void {
    window.open(this.pdfUrl(pdf), '_blank', 'noopener');
  }

  // Redirige vers l'éditeur de CV pour modifier ce CV
  modifier(pdf: PdfHistorique): void {
    this.router.navigate(['/user/generate-cv'], {
      queryParams: { cvId: pdf.cvId },
    });
  }

  // Supprime le CV (et en cascade tous ses PDFs)
  async supprimer(pdf: PdfHistorique): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Supprimer ce CV ?',
      message: `Le CV « ${this.displayName(pdf)} » et tous ses PDFs seront supprimés définitivement.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });
    if (!ok) return;

    this.cvService.supprimerCv(pdf.cvId).subscribe({
      next: () => {
        // Cascade : on retire de la liste tous les PDFs liés au CV supprimé
        this.pdfsAll = this.pdfsAll.filter(p => p.cvId !== pdf.cvId);
        this.totalPdfs = this.pdfsAll.length;
        // Si la page courante n'a plus de PDFs (on a supprimé le dernier
        // de la dernière page), on recule d'une page
        if (this.pageCourante > 0 && this.pageCourante >= this.totalPages) {
          this.pageCourante = this.totalPages - 1;
        }
        this.notif.success('CV supprimé.');
        this.cdr.detectChanges();
      },
      error: () => this.notif.error('Erreur lors de la suppression.'),
    });
  }
}
