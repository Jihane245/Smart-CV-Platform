import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  CoverLetterService,
  CoverLetterResponse,
} from '../../../../core/services/coverletter.service';
import { CvService } from '../../../../core/services/cv.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-lettre-motivation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lettre-motivation.html',
  styleUrl: './lettre-motivation.scss',
})
export class LettreMotivation implements OnInit {
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  // ─── Stepper (cosmétique, pour matcher le design) ───────────────────────────
  etapeActive = 1;
  etapesCompletes: number[] = [];
  etapes = [
    { num: 1, label: "Offre & CV" },
    { num: 2, label: 'Lettre générée' },
  ];

  // ─── Étape 1 — Saisie ───────────────────────────────────────────────────────
  offreTexte = '';
  offreTitre = '';
  offreEntreprise = '';
  cvPdf: File | null = null;
  cvPdfNom = '';
  analyseImageEnCours = false;

  // ─── Cas pré-rempli depuis génération CV (cas 1) ────────────────────────────
  /** Si défini, on appelle /generate (avec persistance) au lieu de /generate-from-upload. */
  modePreRempli = false;

  // ─── Loading & résultat ─────────────────────────────────────────────────────
  generationEnCours = false;
  contenuLettre = '';
  dateGeneration: string | null = null;
  source: 'pdf' | 'profil' | 'cv-existant' | null = null;
  lettreId: number | null = null; // si persistée

  constructor(
    private coverLetterService: CoverLetterService,
    private cvService: CvService,
    private notif: NotificationService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const cvIdParam = qp.get('cvId');
    const offreIdParam = qp.get('offreId');
    const offreTextParam = qp.get('offreText');
    const offreTitreParam = qp.get('offreTitre');
    const offreEntrepriseParam = qp.get('offreEntreprise');

    // Set display flag if any prefill params are present
    if (cvIdParam || offreIdParam || offreTextParam) {
      this.modePreRempli = true;
    }

    if (offreTextParam) this.offreTexte = offreTextParam;
    if (offreTitreParam) this.offreTitre = offreTitreParam;
    if (offreEntrepriseParam) this.offreEntreprise = offreEntrepriseParam;
  }

  // ─── Sélection du PDF ────────────────────────────────────────────────────────
  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      this.notif.error('Format non supporté : un fichier PDF est requis.');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.notif.error('Fichier trop volumineux (10 Mo max).');
      input.value = '';
      return;
    }

    this.cvPdf = file;
    this.cvPdfNom = file.name;
  }

  retirerPdf(): void {
    this.cvPdf = null;
    this.cvPdfNom = '';
  }

  // ─── Analyse d'image (texte de l'offre extrait par l'IA) ────────────────────
  analyserImage(): void {
    this.imageInput.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.notif.error('Format non supporté. Utilisez jpg, png ou webp.');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.notif.error('Image trop volumineuse (10 Mo max).');
      input.value = '';
      return;
    }

    this.analyseImageEnCours = true;
    this.cvService.analyserImage(file, []).subscribe({
      next: (res) => {
        // L'analyse renvoie un résumé structuré : on l'utilise comme texte d'offre
        this.offreTexte = res.resume || this.offreTexte;
        this.analyseImageEnCours = false;
        this.notif.success("Image analysée — texte de l'offre rempli.");
        input.value = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.analyseImageEnCours = false;
        this.notif.error("Erreur lors de l'analyse de l'image.");
        input.value = '';
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Génération ──────────────────────────────────────────────────────────────
  generer(): void {
    if (!this.offreTexte.trim()) {
      this.notif.warning("Veuillez coller le texte de l'offre.");
      return;
    }

    this.generationEnCours = true;

    const fd = new FormData();
    fd.append('offreText', this.offreTexte);
    if (this.cvPdf) fd.append('cvPdf', this.cvPdf, this.cvPdf.name);
    if (this.offreTitre) fd.append('offreTitre', this.offreTitre);
    if (this.offreEntreprise) fd.append('offreEntreprise', this.offreEntreprise);

    this.coverLetterService.generateAndSave(fd).subscribe({
      next: (res: CoverLetterResponse) => {
        this.contenuLettre = res.contenu;
        this.dateGeneration = res.dateGeneration;
        this.lettreId = res.id;
        this.source = this.cvPdf ? 'pdf' : 'profil';
        this.terminerGeneration();
      },
      error: (err) => this.gererErreur(err),
    });
  }

  private afficherResultatPersiste(res: CoverLetterResponse): void {
    this.contenuLettre = res.contenu;
    this.dateGeneration = res.dateGeneration;
    this.source = 'cv-existant';
    this.lettreId = res.id;
    this.terminerGeneration();
  }

  private terminerGeneration(): void {
    this.generationEnCours = false;
    this.etapesCompletes = [1];
    this.etapeActive = 2;
    this.notif.success('Lettre de motivation générée !');
    this.cdr.detectChanges();
  }

  private gererErreur(err: any): void {
    this.generationEnCours = false;
    const msg = err?.error?.message || 'Erreur lors de la génération de la lettre.';
    Promise.resolve().then(() => {
      this.notif.error(msg);
      this.cdr.detectChanges();
    });
  }

  // ─── Étape 2 — Actions sur le résultat ──────────────────────────────────────
  copierContenu(): void {
    if (!this.contenuLettre) return;
    navigator.clipboard
      .writeText(this.contenuLettre)
      .then(() => this.notif.success('Lettre copiée dans le presse-papiers.'))
      .catch(() => this.notif.error("Impossible de copier."));
  }

  telechargerPdf(): void {
    if (!this.lettreId) return;

    this.coverLetterService.update(this.lettreId, this.contenuLettre).subscribe({
      next: () => {
        this.coverLetterService.downloadPdf(this.lettreId!).subscribe({
          next: (blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lettre_motivation_${this.lettreId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          },
          error: () => this.notif.error('Erreur lors du téléchargement du PDF.'),
        });
      },
    error: () => this.notif.error('Erreur lors de la sauvegarde avant téléchargement.'),
    });
  }

  recommencer(): void {
    this.contenuLettre = '';
    this.dateGeneration = null;
    this.source = null;
    this.lettreId = null;
    this.etapesCompletes = [];
    this.etapeActive = 1;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  estComplete(n: number): boolean {
    return this.etapesCompletes.includes(n);
  }

  allerEtape(n: number): void {
    if (n <= Math.max(...this.etapesCompletes, 1) + 1) this.etapeActive = n;
  }
}
