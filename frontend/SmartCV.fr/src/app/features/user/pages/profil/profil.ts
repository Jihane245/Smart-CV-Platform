import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  CreateLigneDtoPayload,
  CreateSectionDtoPayload,
  ExperienceDtoPayload,
  FormationDtoPayload,
  LigneDynamiqueResponseDto,
  ProfilMeResponse,
  ProfilService,
  SectionDynamiqueResponseDto,
  UpdateLigneDtoPayload,
  UpdateSectionDtoPayload,
  normalizeCompetenceNiveau,
  toAbsolutePhotoUrl,
} from '../../../../core/services/profil.service';
import { Competence, Experience, Formation, NiveauCompetence } from '../../../../core/models/models';

interface LigneSection {
  id?: string; 
  ordre: number;
  detail: string;
  description: string;
}

interface Section {
  id?: string; 
  ordre: number;
  titre: string;
  lignes: LigneSection[];
}

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})
export class MonProfil implements OnInit {
  prenom = '';
  nom = '';
  email = '';

  titre = '';
  telephone = '';
  ville = '';
  linkedIn = '';
  resume = '';

  // Snapshot of last saved values 
  savedTitre = '';
  savedTelephone = '';
  savedVille = '';
  savedLinkedIn = '';
  savedResume = '';

  
  expSnapshots = new Map<number, { poste: string; entreprise: string; dateDebut: string; dateFin: string | undefined; description: string }>();


  formSnapshots = new Map<number, { diplome: string; etablissement: string; annee: number; mention: string }>();

  competences: Competence[] = [];
  experiences: Experience[] = [];
  formations: Formation[] = [];
  sections: Section[] = [];

  completude = 0;
  initiales = '?';

  loading = false;
  saving = false;
  changingPassword = false;

  // Photo de profil
  photoUrl: string | null = null;
  uploadingPhoto = false;
  photoError: string | null = null;
  photoViewerOuvert = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  nouvelleCompetence = '';
  ajoutCompetenceVisible = false;

  private profilId = 0;

  constructor(
    private profilService: ProfilService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private confirmService: ConfirmService,
    private notif: NotificationService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      status: this.authService.getStatus().pipe(catchError(() => of(null))),
      profil: this.profilService.getMe().pipe(
        catchError((err) => {
          console.error('Erreur chargement profil', err);
          return of(null);
        })
      ),
    })
      // Important: load sections AFTER profil/me so profil exists server-side
      .pipe(
        switchMap(({ status, profil }) => {
          if (status) {
            this.prenom = status.givenName ?? '';
            this.nom = status.surname ?? '';
            this.email = status.email ?? '';
            this.initiales = this.computeInitiales(this.prenom, this.nom);
          }
          if (profil) {
            this.applyProfil(profil);
          }
          return this.profilService.getSections().pipe(
            catchError((err) => {
              console.error('Erreur chargement sections', err);
              return of([]);
            }),
            map((sections) => ({ status, profil, sections }))
          );
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(({ sections }) => {
        this.applySections(sections ?? []);
        this.recalcCompletude();
        this.cdr.markForCheck();
      });
  }

  //Dirty detection 

  get isInfoDirty(): boolean {
    return (
      this.titre !== this.savedTitre ||
      this.telephone !== this.savedTelephone ||
      this.ville !== this.savedVille ||
      this.linkedIn !== this.savedLinkedIn ||
      this.resume !== this.savedResume
    );
  }

  isExpDirty(exp: Experience): boolean {
    return exp.idExp === 0;
  }

  isExpModified(exp: Experience): boolean {
    if (exp.idExp === 0) return false;
    const snap = this.expSnapshots.get(exp.idExp);
    if (!snap) return false;
    return (
      exp.poste !== snap.poste ||
      exp.entreprise !== snap.entreprise ||
      exp.dateDebut !== snap.dateDebut ||
      exp.dateFin !== snap.dateFin ||
      exp.description !== snap.description
    );
  }

  isFormationNew(f: Formation): boolean {
    return f.idFrmt === 0;
  }

  isFormationModified(f: Formation): boolean {
    if (f.idFrmt === 0) return false;
    const snap = this.formSnapshots.get(f.idFrmt);
    if (!snap) return false;
    return (
      f.diplome !== snap.diplome ||
      f.etablissement !== snap.etablissement ||
      f.annee !== snap.annee ||
      f.mention !== snap.mention
    );
  }

  hasFormationDirty(): boolean {
    return this.formations.some((f) => this.isFormationNew(f) || this.isFormationModified(f));
  }

  toggleAjoutCompetence(): void {
    this.ajoutCompetenceVisible = !this.ajoutCompetenceVisible;
    if (!this.ajoutCompetenceVisible) {
      this.nouvelleCompetence = '';
    }
  }

  //Helpers 

  private computeInitiales(prenom: string, nom: string): string {
    const a = prenom.trim().charAt(0);
    const b = nom.trim().charAt(0);
    if (!a && !b) return '?';
    return (a + b).toUpperCase();
  }

  private applyProfil(p: ProfilMeResponse): void {
    this.profilId = p.id;
    this.titre = p.titre ?? '';
    this.telephone = p.telephone ?? '';
    this.ville = p.adresse ?? '';
    this.linkedIn = p.linkedIn ?? '';
    this.resume = p.description ?? '';
    this.photoUrl = toAbsolutePhotoUrl(p.photoUrl);

    this.savedTitre = this.titre;
    this.savedTelephone = this.telephone;
    this.savedVille = this.ville;
    this.savedLinkedIn = this.linkedIn;
    this.savedResume = this.resume;

    this.competences = (p.competences ?? []).map((c) => ({
      idComp: c.idComp,
      profilId: this.profilId,
      nom: c.nom ?? '',
      niveau: normalizeCompetenceNiveau(c.niveau),
      categorie: c.categorie ?? '',
    }));

    this.experiences = (p.experiences ?? []).map((e) => ({
      idExp: e.idExp,
      profilId: e.profilId ?? this.profilId,
      poste: e.poste ?? '',
      entreprise: e.entreprise ?? '',
      dateDebut: this.isoToInputDate(e.dateDebut),
      dateFin: e.dateFin ? this.isoToInputDate(e.dateFin) : undefined,
      description: e.description ?? '',
    }));

    // Rebuild experience snapshots
    this.expSnapshots.clear();
    for (const exp of this.experiences) {
      this.expSnapshots.set(exp.idExp, {
        poste: exp.poste,
        entreprise: exp.entreprise ?? '',
        dateDebut: exp.dateDebut,
        dateFin: exp.dateFin,
        description: exp.description ?? '',
      });
    }

    this.formations = (p.formations ?? []).map((f) => ({
      idFrmt: f.idFrmt,
      profilId: f.profilId ?? this.profilId,
      diplome: f.diplome ?? '',
      etablissement: f.etablissement ?? '',
      annee: f.annee ?? 0,
      mention: f.mention ?? '',
    }));

    // Rebuild formation snapshots
    this.formSnapshots.clear();
    for (const f of this.formations) {
      this.formSnapshots.set(f.idFrmt, {
        diplome: f.diplome ?? '',
        etablissement: f.etablissement ?? '',
        annee: f.annee ?? 0,
        mention: f.mention ?? '',
      });
    }
  }

  private applySections(sections: SectionDynamiqueResponseDto[]): void {
    this.sections = (sections ?? [])
      .slice()
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
      .map((s) => ({
        id: s.id,
        titre: s.titre ?? '',
        ordre: s.ordre ?? 0,
        lignes: (s.lignes ?? [])
          .slice()
          .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
          .map((l) => ({
            id: l.id,
            ordre: l.ordre ?? 0,
            detail: l.detail ?? '',
            description: l.description ?? '',
          })),
      }));
  }

  private isoToInputDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  private inputDateToIso(date: string): string {
    if (!date) return new Date().toISOString();
    return new Date(date + 'T12:00:00.000Z').toISOString();
  }

  experienceActuelle(exp: Experience): boolean {
    return !exp.dateFin || exp.dateFin === '';
  }

  onExperienceActuelleChange(exp: Experience, checked: boolean): void {
    if (checked) {
      exp.dateFin = undefined;
    } else if (!exp.dateFin) {
      exp.dateFin = this.isoToInputDate(new Date().toISOString());
    }
  }

  private recalcCompletude(): void {
    let filled = 0;
    const total = 10;
    if (this.titre.trim()) filled++;
    if (this.telephone.trim()) filled++;
    if (this.ville.trim()) filled++;
    if (this.linkedIn.trim()) filled++;
    if (this.resume.trim().length > 20) filled++;
    if (this.competences.length) filled++;
    if (this.experiences.some((e) => e.poste?.trim())) filled++;
    if (this.formations.some((f) => f.diplome?.trim() || f.etablissement?.trim())) filled++;
    if (this.prenom.trim() && this.nom.trim()) filled++;
    if (this.email.trim()) filled++;
    this.completude = Math.round((filled / total) * 100);
  }

  //Photo de profil

  /** Click sur l'avatar : ouvre la modale de visualisation si photo, sinon ouvre le sélecteur */
  onAvatarClick(): void {
    if (this.photoUrl) {
      this.photoViewerOuvert = true;
    } else {
      this.ouvrirSelecteurPhoto();
    }
  }

  fermerPhotoViewer(): void {
    this.photoViewerOuvert = false;
  }

  ouvrirSelecteurPhoto(): void {
    if (this.uploadingPhoto) return;
    this.photoError = null;
    this.fileInput?.nativeElement.click();
  }

  /** Handler sur l'input <input type="file"> */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validation côté client (même règles que le backend)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.notif.error('Format non supporté', 'Utilisez JPG, PNG ou WebP.');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.notif.error('Image trop grande', 'Maximum 5 Mo.');
      input.value = '';
      return;
    }

    this.uploadingPhoto = true;
    this.photoError = null;

    this.profilService.uploadPhoto(file).subscribe({
      next: (res) => {
        // Cache-buster : ajouter un timestamp force le navigateur à recharger l'image
        this.photoUrl = `${toAbsolutePhotoUrl(res.photoUrl)}?t=${Date.now()}`;
        this.uploadingPhoto = false;
        input.value = '';
        this.photoViewerOuvert = false;
        this.notif.success('Photo de profil mise à jour');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur upload photo', err);
        const msg = typeof err?.error === 'string' ? err.error : 'Erreur lors de l\'upload de la photo.';
        this.notif.error('Upload impossible', msg);
        this.uploadingPhoto = false;
        input.value = '';
        this.cdr.markForCheck();
      },
    });
  }

  /** Supprime la photo de profil (retour aux initiales) */
  supprimerPhoto(): void {
    if (!this.photoUrl || this.uploadingPhoto) return;

    this.confirmService.confirm({
      title: 'Supprimer la photo',
      message: 'Êtes-vous sûr de vouloir supprimer votre photo de profil ? Vous reviendrez à l\'affichage des initiales.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then((ok) => {
      if (!ok) return;

      this.uploadingPhoto = true;
      this.photoError = null;

      this.profilService.deletePhoto().subscribe({
        next: () => {
          this.photoUrl = null;
          this.uploadingPhoto = false;
          this.photoViewerOuvert = false;
          this.notif.success('Photo de profil supprimée');
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Erreur suppression photo', err);
          this.notif.error('Impossible de supprimer la photo', err?.message);
          this.uploadingPhoto = false;
          this.cdr.markForCheck();
        },
      });
    });
  }

  // ─── Changer le Mot de Passe ──────────────────────────────────────────────

  changerMotDePasse(): void {
    this.changingPassword = true;
    this.http.post(
      `${environment.backendUrl}/api/auth/change-password`,
      {},
      { withCredentials: true }
    ).subscribe({
      next: () => {
        this.changingPassword = false;
        this.notif.success('Email de réinitialisation envoyé. Vérifiez votre boîte mail.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.changingPassword = false;
        this.notif.error(
          err.status === 503
            ? 'Service non configuré. Contactez un administrateur.'
            : 'Erreur lors de l\'envoi. Veuillez réessayer.'
        );
        this.cdr.markForCheck();
      },
    });
  }

  // ─── Compétences ──────────────────────────────────────────────────────────

  ajouterCompetence(): void {
    const nom = this.nouvelleCompetence.trim();
    if (!nom) return;

    this.profilService
      .addCompetence({ nom, niveau: 1, categorie: '' })
      .subscribe({
        next: (res: any) => {
          this.nouvelleCompetence = '';
          this.ajoutCompetenceVisible = false;
          this.competences.push({
            idComp: res?.idComp ?? 0,
            profilId: this.profilId,
            nom,
            niveau: NiveauCompetence.Intermediaire,
            categorie: '',
          });
          this.recalcCompletude();
        },
        error: (err) => console.error('Erreur ajout compétence', err),
      });
  }

  supprimerCompetence(index: number): void {
    const c = this.competences[index];
    if (!c?.idComp) return;
    this.profilService.deleteCompetence(c.idComp).subscribe({
      next: () => {
        this.competences.splice(index, 1);
        this.recalcCompletude();
      },
      error: (err) => console.error('Erreur suppression compétence', err),
    });
  }

  onTelephoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Allow digits, +, -, spaces, parentheses
    input.value = input.value.replace(/[^\d+\-\s()]/g, '');
    this.telephone = input.value;
  }

  // ─── Expériences ──────────────────────────────────────────────────────────

  ajouterExperience(): void {
    this.experiences.push({
      idExp: 0,
      profilId: this.profilId,
      poste: '',
      entreprise: '',
      dateDebut: this.isoToInputDate(new Date().toISOString()),
      dateFin: undefined,
      description: '',
    });
  }

  supprimerExperience(index: number): void {
    const exp = this.experiences[index];
    if (exp.idExp === 0) {
      // Not yet saved — just remove locally
      this.experiences.splice(index, 1);
      this.recalcCompletude();
      return;
    }
    this.profilService.deleteExperience(exp.idExp).subscribe({
      next: () => {
        this.experiences.splice(index, 1);
        this.expSnapshots.delete(exp.idExp);
        this.recalcCompletude();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur suppression expérience', err),
    });
  }

  // ─── Formations ───────────────────────────────────────────────────────────

  ajouterFormation(): void {
    this.formations.push({
      idFrmt: 0,
      profilId: this.profilId,
      diplome: '',
      etablissement: '',
      annee: new Date().getFullYear(),
      mention: '',
    });
  }

  supprimerFormation(index: number): void {
    const f = this.formations[index];
    if (f.idFrmt === 0) {
      this.formations.splice(index, 1);
      this.recalcCompletude();
      return;
    }
    this.profilService.deleteFormation(f.idFrmt).subscribe({
      next: () => {
        this.formations.splice(index, 1);
        this.formSnapshots.delete(f.idFrmt);
        this.recalcCompletude();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur suppression formation', err),
    });
  }

  private reloadProfil(): void {
    this.profilService.getMe().subscribe({
      next: (p) => {
        this.applyProfil(p);
        this.recalcCompletude();
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur rechargement profil', err),
    });
  }

  private reloadSections(): void {
    this.profilService.getSections().subscribe({
      next: (sections) => {
        this.applySections(sections);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur rechargement sections', err),
    });
  }

  private toExperiencePayload(exp: Experience): ExperienceDtoPayload {
    return {
      poste: exp.poste ?? '',
      entreprise: exp.entreprise ?? '',
      dateDebut: this.inputDateToIso(exp.dateDebut),
      dateFin: exp.dateFin ? this.inputDateToIso(exp.dateFin) : null,
      description: exp.description ?? '',
    };
  }

  private toFormationPayload(f: Formation): FormationDtoPayload {
    return {
      diplome: f.diplome ?? '',
      etablissement: f.etablissement ?? '',
      annee: f.annee ?? 0,
      mention: f.mention ?? '',
    };
  }

  enregistrer(): void {
    this.saving = true;

    // FIX issue 4: capture arrays BEFORE updateMe fires, because applyProfil()
    // inside switchMap would overwrite this.experiences/formations with the
    // server state (which doesn't yet contain new items with idExp/idFrmt === 0).
    const experiencesSnapshot = [...this.experiences];
    const formationsSnapshot = [...this.formations];

    this.profilService
      .updateMe({
        titre: this.titre,
        telephone: this.telephone,
        adresse: this.ville,
        linkedIn: this.linkedIn,
        description: this.resume,
      })
      .pipe(
        switchMap((p) => {
          // Update snapshots so dirty indicators clear, but keep local arrays
          // intact — don't call applyProfil here, it would destroy the snapshot.
          this.savedTitre = p.titre ?? '';
          this.savedTelephone = p.telephone ?? '';
          this.savedVille = p.adresse ?? '';
          this.savedLinkedIn = p.linkedIn ?? '';
          this.savedResume = p.description ?? '';

          const tasks: Observable<unknown>[] = [];

          for (const exp of experiencesSnapshot) {
            const payload = this.toExperiencePayload(exp);
            if (!exp.idExp) {
              tasks.push(this.profilService.addExperience(payload));
            } else {
              tasks.push(this.profilService.updateExperience(exp.idExp, payload));
            }
          }

          for (const f of formationsSnapshot) {
            const payload = this.toFormationPayload(f);
            if (!f.idFrmt) {
              tasks.push(this.profilService.addFormation(payload));
            } else {
              tasks.push(this.profilService.updateFormation(f.idFrmt, payload));
            }
          }

          if (!tasks.length) return of(null);
          return forkJoin(tasks);
        }),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        // Full reload after all tasks complete — gets real IDs for newly added items
        next: () => this.reloadProfil(),
        error: (err) => console.error('Erreur mise à jour profil', err),
      });
  }

  // ─── Sections dynamiques ──────────────────────────────────────────────────

  ajouterSection(): void {
    const ordre = this.sections.length ? Math.max(...this.sections.map((s) => s.ordre ?? 0)) + 1 : 0;
    const payload: CreateSectionDtoPayload = {
      titre: 'Section #',
      ordre,
    };

    const create$ =
      this.profilId === 0
        ? this.profilService.getMe().pipe(
            map((p) => {
              this.applyProfil(p);
              return p;
            }),
            switchMap(() => this.profilService.createSection(payload))
          )
        : this.profilService.createSection(payload);

    create$.subscribe({
      next: (created) => {
        this.sections.push({
          id: created.id,
          titre: created.titre ?? payload.titre,
          ordre: created.ordre ?? ordre,
          lignes: (created.lignes ?? []).map((l) => ({
            id: l.id,
            ordre: l.ordre ?? 0,
            detail: l.detail ?? '',
            description: l.description ?? '',
          })),
        });
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur création section', err),
    });
  }

  supprimerSection(index: number): void {
    const section = this.sections[index];
    if (!section) return;

    // If not saved (shouldn't happen with API flow), just remove locally
    if (!section.id) {
      this.sections.splice(index, 1);
      return;
    }

    this.profilService.deleteSection(section.id).subscribe({
      next: () => {
        this.sections.splice(index, 1);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur suppression section', err),
    });
  }

  ajouterLigne(section: Section): void {
    if (!section.id) {
      // Section not yet saved; keep local behavior
      section.lignes.push({
        ordre: section.lignes.length,
        detail: `Détail ${section.lignes.length + 1}`,
        description: '',
      });
      return;
    }

    const ordre = section.lignes.length ? Math.max(...section.lignes.map((l) => l.ordre ?? 0)) + 1 : 0;
    const payload: CreateLigneDtoPayload = {
      detail: `Détail ${section.lignes.length + 1}`,
      description: '',
      ordre,
    };

    this.profilService.addLigne(section.id, payload).subscribe({
      next: (created: LigneDynamiqueResponseDto) => {
        section.lignes.push({
          id: created.id,
          ordre: created.ordre ?? ordre,
          detail: created.detail ?? payload.detail ?? '',
          description: created.description ?? payload.description ?? '',
        });
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur ajout ligne', err),
    });
  }

  supprimerLigne(section: Section, index: number): void {
    const ligne = section.lignes[index];
    if (!ligne) return;

    if (!section.id || !ligne.id) {
      section.lignes.splice(index, 1);
      return;
    }

    this.profilService.deleteLigne(section.id, ligne.id).subscribe({
      next: () => {
        section.lignes.splice(index, 1);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Erreur suppression ligne', err),
    });
  }

  onSectionBlur(section: Section): void {
    if (!section.id) return;
    const payload: UpdateSectionDtoPayload = { titre: section.titre ?? '', ordre: section.ordre ?? 0 };
    this.profilService.updateSection(section.id, payload).subscribe({
      next: () => {},
      error: (err) => console.error('Erreur update section', err),
    });
  }

  onLigneBlur(section: Section, ligne: LigneSection): void {
    if (!section.id || !ligne.id) return;
    const payload: UpdateLigneDtoPayload = {
      detail: ligne.detail ?? '',
      description: ligne.description ?? '',
      ordre: ligne.ordre ?? 0,
    };
    this.profilService.updateLigne(section.id, ligne.id, payload).subscribe({
      next: () => {},
      error: (err) => console.error('Erreur update ligne', err),
    });
  }
}