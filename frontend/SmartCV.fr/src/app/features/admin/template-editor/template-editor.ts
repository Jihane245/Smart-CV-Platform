import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AdminService,
  TemplateSectionDto,
  AdminTemplateDto
} from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-editor.html',
  styleUrl: './template-editor.scss',
})
export class TemplateEditor implements OnInit {

  mode: 'create' | 'edit' = 'create';
  templateId: number | null = null;
  loading = false;
  saving = false;

  nom = '';
  couleur = '#6b8068';
  sections: TemplateSectionDto[] = [];

  typesChamp = [
    { value: 'text', label: 'Texte court' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Téléphone' },
    { value: 'date', label: 'Date' },
    { value: 'long_text', label: 'Texte long' },
    { value: 'list', label: 'Liste' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private notif: NotificationService,
    private confirmService: ConfirmService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.mode = 'edit';
      this.templateId = Number(idParam);
      this.chargerTemplate(this.templateId);
    } else {
      this.ajouterSection();
    }
  }

  chargerTemplate(id: number): void {
    this.loading = true;
    this.adminService.getTemplateById(id).subscribe({
      next: (t: AdminTemplateDto) => {
        console.log('📥 [DEBUG] Template chargé pour édition :', t);
        this.zone.run(() => {
          this.nom = t.nom;
          this.couleur = t.couleur;
          this.sections = t.structure?.sections ?? [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('❌ [DEBUG] Erreur chargement template :', err);
        this.notif.error('Impossible de charger le template', err?.message);
        this.router.navigate(['/admin']);
      }
    });
  }

  ajouterSection(): void {
    this.sections.push({
      titre: 'Nouvelle section',
      ordre: this.sections.length + 1,
      couleur: '#6b8068',
      champs: []
    });
  }

  supprimerSection(index: number): void {
    this.confirmService.confirm({
      title: 'Supprimer la section',
      message: 'Voulez-vous vraiment supprimer cette section et tous ses champs ?',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger'
    }).then((ok) => {
      if (!ok) return;
      this.zone.run(() => {
        this.sections.splice(index, 1);
        this.sections.forEach((s, i) => s.ordre = i + 1);
        this.cdr.detectChanges();
      });
    });
  }

  monterSection(index: number): void {
    if (index <= 0) return;
    [this.sections[index - 1], this.sections[index]] = [this.sections[index], this.sections[index - 1]];
    this.sections.forEach((s, i) => s.ordre = i + 1);
  }

  descendreSection(index: number): void {
    if (index >= this.sections.length - 1) return;
    [this.sections[index], this.sections[index + 1]] = [this.sections[index + 1], this.sections[index]];
    this.sections.forEach((s, i) => s.ordre = i + 1);
  }

  ajouterChamp(sectionIndex: number): void {
    const section = this.sections[sectionIndex];
    section.champs.push({
      nom: '',
      label: '',
      type: 'text',
      placeholder: '',
      requis: false,
      ordre: section.champs.length + 1
    });
  }

  supprimerChamp(sectionIndex: number, champIndex: number): void {
    this.sections[sectionIndex].champs.splice(champIndex, 1);
    this.sections[sectionIndex].champs.forEach((c, i) => c.ordre = i + 1);
  }

  enregistrer(): void {
    if (!this.nom.trim()) {
      this.notif.warning('Nom obligatoire', 'Veuillez saisir un nom pour le template.');
      return;
    }
    this.saving = true;
    const payload = {
      nom: this.nom.trim(),
      couleur: this.couleur,
      structure: { sections: this.sections }
    };

    const request$ = this.mode === 'edit' && this.templateId
      ? this.adminService.updateTemplate(this.templateId, payload)
      : this.adminService.createTemplate(payload);

    request$.subscribe({
      next: () => {
        this.zone.run(() => {
          this.saving = false;
          this.cdr.detectChanges();
        });
        this.notif.success(
          this.mode === 'edit' ? 'Template modifié avec succès' : 'Template créé avec succès'
        );
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.zone.run(() => {
          this.saving = false;
          this.cdr.detectChanges();
        });
        console.error('Erreur sauvegarde template', err);
        this.notif.error('Erreur lors de la sauvegarde', err?.error?.message || err?.message);
      }
    });
  }

  annuler(): void {
    this.confirmService.confirm({
      title: 'Annuler les modifications',
      message: 'Toutes les modifications non sauvegardées seront perdues. Continuer ?',
      confirmText: 'Oui, annuler',
      cancelText: 'Non, revenir',
      type: 'warning'
    }).then((ok) => {
      if (ok) this.router.navigate(['/admin']);
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DÉCONNEXION (immédiate, sans confirmation)
  // ─────────────────────────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout();
  }
}
