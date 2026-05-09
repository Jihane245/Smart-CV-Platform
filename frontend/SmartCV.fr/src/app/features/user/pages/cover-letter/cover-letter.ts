import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CoverLetterService } from '../../../../core/services/cover-letter.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GenerateCvStateService } from '../../../../core/services/generate-cv-state.service';

@Component({
  selector: 'app-cover-letter',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cover-letter.html',
  styleUrl: './cover-letter.scss',
})
export class CoverLetter implements OnInit {

  // ─── State ────────────────────────────────────────────────────────────────
  offreTexte = '';
  offreFileName = '';
  cvFileName = '';

  lettreContenu = '';
  lettreId: number | null = null;
  lettreGeneree = false;

  generationEnCours = false;
  telechargementEnCours = false;
  sauvegardEnCours = false;

  // Set when coming from GenCV — enables real generation
  offreId: number | null = null;
  userId: number | null = null;

  // Source info displayed in header when coming from GenCV
  offreTitre = '';
  offreEntreprise = '';

  constructor(
    private coverLetterService: CoverLetterService,
    private authService: AuthService,
    private notif: NotificationService,
    private cvState: GenerateCvStateService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Load current user id
    this.authService.getStatus().subscribe({
      next: () => {},
      error: () => {},
    });

    // Try to get userId from auth
    this.authService.getMe().subscribe({
      next: (data) => {
        // Extract userId from claims
        const claims = data.claims as { type: string; value: string }[] | undefined;
        const subClaim = claims?.find(c => c.type === 'sub' || c.type === 'nameid');
        if (subClaim) {
          this.userId = parseInt(subClaim.value, 10) || null;
        }
      },
      error: () => {},
    });

    // Check query params — coming from GenCV with ?offreId=X
    const offreIdParam = this.route.snapshot.queryParamMap.get('offreId');
    if (offreIdParam) {
      this.offreId = parseInt(offreIdParam, 10) || null;
    }

    // Pre-fill offer text from GenCV state if available
    const state = this.cvState.state;
    if (state.offreTexte) {
      this.offreTexte = state.offreTexte;
    }
    if (state.niveauLabel) {
      this.offreTitre = state.niveauLabel;
    }

    // Read offreTitre/entreprise from query params (set by GenCV button)
    const titreParam = this.route.snapshot.queryParamMap.get('offreTitre');
    const entrepriseParam = this.route.snapshot.queryParamMap.get('offreEntreprise');
    if (titreParam) this.offreTitre = titreParam;
    if (entrepriseParam) this.offreEntreprise = entrepriseParam;
  }

  // ─── File inputs (foundations for future backend support) ─────────────────

  onOffreFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.offreFileName = file.name;
    // Future: send to AI service for text extraction
    this.notif.info('Import de fichier offre — disponible prochainement.');
  }

  onCvFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.cvFileName = file.name;
    // Future: send to AI service for CV analysis
    this.notif.info('Import de CV — disponible prochainement.');
  }

  // ─── Generation ────────────────────────────────────────────────────────────

  get peutGenerer(): boolean {
    return this.offreId !== null && this.userId !== null;
  }

  get messageGeneration(): string {
    if (this.peutGenerer) return 'Générer la lettre';
    if (!this.offreTexte.trim() && !this.offreFileName) {
      return 'Générer la lettre';
    }
    return 'Générer la lettre';
  }

  generer(): void {
    if (!this.peutGenerer) {
      this.notif.error(
        'La génération directe depuis une offre collée sera disponible prochainement. ' +
        'Pour l\'instant, générez depuis la page "Générer CV" après avoir analysé une offre.'
      );
      return;
    }

    this.generationEnCours = true;
    this.lettreGeneree = false;

    this.coverLetterService.generate({
      userId: this.userId!,
      offreId: this.offreId!,
    }).subscribe({
      next: (res) => {
        this.lettreId = res.id;
        this.lettreContenu = res.contenu;
        this.lettreGeneree = true;
        this.generationEnCours = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur génération lettre:', err);
        this.notif.error('Impossible de générer la lettre. Vérifiez que votre profil et l\'offre sont complets.');
        this.generationEnCours = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Save edits ────────────────────────────────────────────────────────────

  sauvegarder(): void {
    if (!this.lettreId || !this.lettreContenu.trim()) return;
    this.sauvegardEnCours = true;

    this.coverLetterService.update(this.lettreId, { contenu: this.lettreContenu }).subscribe({
      next: () => {
        this.notif.success('Lettre sauvegardée.');
        this.sauvegardEnCours = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Erreur lors de la sauvegarde.');
        this.sauvegardEnCours = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── PDF download ──────────────────────────────────────────────────────────

  telechargerPdf(): void {
    if (!this.lettreId) return;
    this.telechargementEnCours = true;

    this.coverLetterService.downloadPdf(this.lettreId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lettre_motivation_${this.lettreId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.telechargementEnCours = false;
        this.notif.success('Lettre téléchargée.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.notif.error('Erreur lors du téléchargement.');
        this.telechargementEnCours = false;
        this.cdr.detectChanges();
      },
    });
  }

  triggerOffreInput(): void {
    document.getElementById('offre-file-input')?.click();
  }

  triggerCvInput(): void {
    document.getElementById('cv-file-input')?.click();
  }
}