import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';

import { AuthService } from '../../../../core/services/auth.service';
import {
  ExperienceDtoPayload,
  FormationDtoPayload,
  ProfilMeResponse,
  ProfilService,
  normalizeCompetenceNiveau,
} from '../../../../core/services/profil.service';
import { Competence, Experience, Formation } from '../../../../core/models/models';

interface LigneSection {
  detail: string;
  description: string;
}

interface Section {
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

  competences: Competence[] = [];
  experiences: Experience[] = [];
  formations: Formation[] = [];
  sections: Section[] = [];

  completude = 0;
  initiales = '?';

  loading = false;
  saving = false;

  nouvelleCompetence = '';
  ajoutCompetenceVisible = false;

  private profilId = 0;

  constructor(
    private profilService: ProfilService,
    private authService: AuthService
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
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(({ status, profil }) => {
        if (status) {
          this.prenom = status.givenName ?? '';
          this.nom = status.surname ?? '';
          this.email = status.email ?? '';
          this.initiales = this.computeInitiales(this.prenom, this.nom);
        }
        if (profil) {
          this.applyProfil(profil);
        }
        this.recalcCompletude();
      });
  }

  private computeInitiales(prenom: string, nom: string): string {
    const a = prenom.trim().charAt(0);
    const b = nom.trim().charAt(0);
    if (!a && !b) {
      return '?';
    }
    return (a + b).toUpperCase();
  }

  private applyProfil(p: ProfilMeResponse): void {
    this.profilId = p.id;
    this.titre = p.titre ?? '';
    this.telephone = p.telephone ?? '';
    this.ville = p.adresse ?? '';
    this.linkedIn = p.linkedIn ?? '';
    this.resume = p.description ?? '';

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

    this.formations = (p.formations ?? []).map((f) => ({
      idFrmt: f.idFrmt,
      profilId: f.profilId ?? this.profilId,
      diplome: f.diplome ?? '',
      etablissement: f.etablissement ?? '',
      annee: f.annee ?? 0,
      mention: f.mention ?? '',
    }));
  }

  private isoToInputDate(iso: string): string {
    if (!iso) {
      return '';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    return d.toISOString().slice(0, 10);
  }

  private inputDateToIso(date: string): string {
    if (!date) {
      return new Date().toISOString();
    }
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
    let total = 10;
    if (this.titre.trim()) {
      filled++;
    }
    if (this.telephone.trim()) {
      filled++;
    }
    if (this.ville.trim()) {
      filled++;
    }
    if (this.linkedIn.trim()) {
      filled++;
    }
    if (this.resume.trim().length > 20) {
      filled++;
    }
    if (this.competences.length) {
      filled++;
    }
    if (this.experiences.some((e) => e.poste?.trim())) {
      filled++;
    }
    if (this.formations.some((f) => f.diplome?.trim() || f.etablissement?.trim())) {
      filled++;
    }
    if (this.prenom.trim() && this.nom.trim()) {
      filled++;
    }
    if (this.email.trim()) {
      filled++;
    }
    this.completude = Math.round((filled / total) * 100);
  }

  ajouterCompetence(): void {
    const nom = this.nouvelleCompetence.trim();
    if (!nom) {
      return;
    }

    this.profilService
      .addCompetence({
        nom,
        niveau: 1,
        categorie: '',
      })
      .subscribe({
        next: () => {
          this.nouvelleCompetence = '';
          this.ajoutCompetenceVisible = false;
          this.reloadProfil();
        },
        error: (err) => console.error('Erreur ajout compétence', err),
      });
  }

  supprimerCompetence(index: number): void {
    const c = this.competences[index];
    if (!c?.idComp) {
      return;
    }
    this.profilService.deleteCompetence(c.idComp).subscribe({
      next: () => {
        this.competences.splice(index, 1);
        this.recalcCompletude();
      },
      error: (err) => console.error('Erreur suppression compétence', err),
    });
  }

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

  private reloadProfil(): void {
    this.profilService.getMe().subscribe({
      next: (p) => {
        this.applyProfil(p);
        this.recalcCompletude();
      },
      error: (err) => console.error('Erreur rechargement profil', err),
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
          this.applyProfil(p);
          const tasks: Observable<unknown>[] = [];

          for (const exp of this.experiences) {
            const payload = this.toExperiencePayload(exp);
            if (!exp.idExp) {
              tasks.push(this.profilService.addExperience(payload));
            } else {
              tasks.push(this.profilService.updateExperience(exp.idExp, payload));
            }
          }

          for (const f of this.formations) {
            const payload = this.toFormationPayload(f);
            if (!f.idFrmt) {
              tasks.push(this.profilService.addFormation(payload));
            } else {
              tasks.push(this.profilService.updateFormation(f.idFrmt, payload));
            }
          }

          if (!tasks.length) {
            return of(null);
          }
          return forkJoin(tasks);
        }),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: () => this.reloadProfil(),
        error: (err) => console.error('Erreur mise à jour profil', err),
      });
  }

  ajouterSection(): void {
    this.sections.push({
      titre: 'Section #',
      lignes: [
        { detail: 'Détail 1', description: '' },
        { detail: 'Détail 2', description: '' },
      ],
    });
  }

  supprimerSection(index: number): void {
    this.sections.splice(index, 1);
  }

  ajouterLigne(section: Section): void {
    section.lignes.push({
      detail: `Détail ${section.lignes.length + 1}`,
      description: '',
    });
  }

  supprimerLigne(section: Section, index: number): void {
    section.lignes.splice(index, 1);
  }
}
