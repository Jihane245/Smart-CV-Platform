import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import {
  AdminService,
  AdminTemplateDto,
  TemplateBoxDto,
  TemplateComponentDto,
  TemplateComponentType,
  TemplateLayoutId,
} from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AuthService } from '../../../core/services/auth.service';

import {
  COMPONENT_CATALOG,
  ComponentDescriptor,
  LAYOUTS,
  LayoutDescriptor,
  buildBoxesForLayout,
  findDescriptor,
  findLayout,
} from './template-catalog';
import { CvComponentRenderer } from './cv-component-renderer/cv-component-renderer';
import { AdminSidebarComponent } from '../../../shared/layout/admin-sidebar/admin-sidebar.component';
import {
  GOOGLE_FONTS,
  GoogleFont,
  GoogleFontCategory,
  FONT_CATEGORY_LABELS,
  loadGoogleFont,
} from './google-fonts';

export interface CustomField {
  id: string;
  key: string;    // ex: "twitter" — généré à partir du label
  label: string;  // ex: "Twitter"
}

// Élément unifié de la liste des champs (standard du catalogue OU perso ajouté)
export interface DisplayField {
  key: string;
  label: string;
  isCustom: boolean;
  customId?: string;
}

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, CvComponentRenderer, AdminSidebarComponent],
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
  layoutId: TemplateLayoutId = 'sidebar-left';
  boxes: TemplateBoxDto[] = [];

  selectedComponentId: string | null = null;

  readonly catalog: ComponentDescriptor[] = COMPONENT_CATALOG;
  readonly layouts: LayoutDescriptor[] = LAYOUTS;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private notif: NotificationService,
    private confirmService: ConfirmService,
    private authService: AuthService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALISATION
  // ─────────────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCustomFonts();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.mode = 'edit';
      this.templateId = Number(idParam);
      this.chargerTemplate(this.templateId);
    } else {
      this.boxes = buildBoxesForLayout(this.layoutId, this.couleur);
    }
  }

  chargerTemplate(id: number): void {
    this.loading = true;
    this.adminService.getTemplateById(id).subscribe({
      next: (t: AdminTemplateDto) => {
        this.zone.run(() => {
          this.nom = t.nom;
          this.couleur = t.couleur || '#6b8068';

          const struct = t.structure;
          if (struct?.boxes && struct.layout) {
            // Nouveau format builder visuel
            this.layoutId = struct.layout;
            this.boxes = struct.boxes.map((b) => ({
              ...b,
              components: b.components.map((c) => ({ ...c })),
            }));
            if (struct.couleurPrimaire) this.couleur = struct.couleurPrimaire;
          } else {
            // Template legacy → on initialise un layout vide
            this.layoutId = 'sidebar-left';
            this.boxes = buildBoxesForLayout(this.layoutId, this.couleur);
            if (struct?.sections?.length) {
              this.notif.info(
                'Template au format ancien',
                'Ce template a été créé avec l\'ancien éditeur. Vous pouvez maintenant le reconstruire dans le builder visuel.',
              );
            }
          }

          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Erreur chargement template :', err);
        this.notif.error('Impossible de charger le template', err?.message);
        this.router.navigate(['/admin']);
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT
  // ─────────────────────────────────────────────────────────────────────────
  changerLayout(id: TemplateLayoutId): void {
    if (id === this.layoutId) return;

    const totalComponents = this.boxes.reduce((n, b) => n + b.components.length, 0);

    const apply = () => {
      const newBoxes = buildBoxesForLayout(id, this.couleur);
      // On essaie de préserver les composants en les regroupant dans la première box
      const allComponents = this.boxes.flatMap((b) => b.components);
      if (newBoxes.length > 0 && allComponents.length > 0) {
        newBoxes[0].components = allComponents;
      }
      this.layoutId = id;
      this.boxes = newBoxes;
      this.cdr.detectChanges();
    };

    if (totalComponents === 0) {
      apply();
      return;
    }

    this.confirmService.confirm({
      title: 'Changer de layout',
      message: `Tous les composants (${totalComponents}) seront regroupés dans la première zone du nouveau layout. Continuer ?`,
      confirmText: 'Changer',
      cancelText: 'Annuler',
      type: 'warning',
    }).then((ok) => {
      if (ok) this.zone.run(apply);
    });
  }

  onCouleurChange(): void {
    // Met à jour la couleur primaire des boxes "sidebar" / "header"
    this.boxes = this.boxes.map((b) => {
      if (b.id === 'sidebar' || b.id === 'header') {
        return { ...b, style: { ...b.style, background: this.couleur } };
      }
      // accentColor des box "main"
      if (b.id === 'main' || b.id === 'left' || b.id === 'right') {
        return { ...b, style: { ...b.style, accentColor: this.couleur } };
      }
      return b;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DRAG & DROP
  // ─────────────────────────────────────────────────────────────────────────
  catalogDropListId = 'catalog';
  get boxDropListIds(): string[] {
    return [this.catalogDropListId, ...this.boxes.map((b) => `box-${b.id}`)];
  }

  onCatalogDrop(_event: CdkDragDrop<ComponentDescriptor[]>): void {
    // Drop sur le catalogue : on ignore (pas de retour vers le catalogue).
    // sortingDisabled empêche déjà le réordonnancement interne.
    return;
  }

  onBoxDrop(event: CdkDragDrop<TemplateComponentDto[]>, targetBox: TemplateBoxDto): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(targetBox.components, event.previousIndex, event.currentIndex);
      return;
    }

    if (event.previousContainer.id === this.catalogDropListId) {
      // Drop depuis le catalogue → instancie un nouveau composant
      const descriptor = event.item.data as ComponentDescriptor;
      const newComponent: TemplateComponentDto = {
        id: this.uid(),
        type: descriptor.type,
        titre: descriptor.defaultTitre,
        config: {},
      };
      targetBox.components.splice(event.currentIndex, 0, newComponent);
      this.selectedComponentId = newComponent.id;
      return;
    }

    // Déplacement entre deux boxes
    transferArrayItem(
      event.previousContainer.data as TemplateComponentDto[],
      targetBox.components,
      event.previousIndex,
      event.currentIndex,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS COMPOSANTS
  // ─────────────────────────────────────────────────────────────────────────
  ajouterComposant(box: TemplateBoxDto, descriptor: ComponentDescriptor): void {
    const c: TemplateComponentDto = {
      id: this.uid(),
      type: descriptor.type,
      titre: descriptor.defaultTitre,
      config: {},
    };
    box.components.push(c);
    this.selectedComponentId = c.id;
  }

  supprimerComposant(box: TemplateBoxDto, index: number): void {
    const removed = box.components.splice(index, 1)[0];
    if (removed && this.selectedComponentId === removed.id) {
      this.selectedComponentId = null;
    }
  }

  selectionner(component: TemplateComponentDto): void {
    this.selectedComponentId = component.id;
  }

  monterComposant(box: TemplateBoxDto, index: number): void {
    if (index <= 0) return;
    [box.components[index - 1], box.components[index]] = [box.components[index], box.components[index - 1]];
  }

  descendreComposant(box: TemplateBoxDto, index: number): void {
    if (index >= box.components.length - 1) return;
    [box.components[index], box.components[index + 1]] = [box.components[index + 1], box.components[index]];
  }

  get selectedComponent(): TemplateComponentDto | null {
    if (!this.selectedComponentId) return null;
    for (const b of this.boxes) {
      const c = b.components.find((x) => x.id === this.selectedComponentId);
      if (c) return c;
    }
    return null;
  }

  get selectedDescriptor(): ComponentDescriptor | null {
    const c = this.selectedComponent;
    return c ? findDescriptor(c.type) ?? null : null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIG DU COMPOSANT SÉLECTIONNÉ (toggle champs visibles, style)
  // ─────────────────────────────────────────────────────────────────────────
  // ─── Polices : système (toujours disponibles) + Google Fonts ajoutées ──
  readonly systemFontFamilies: { value: string; label: string }[] = [
    { value: 'inherit',                             label: 'Par défaut (Georgia)' },
    { value: '"Helvetica Neue", Arial, sans-serif', label: 'Helvetica' },
    { value: '"Times New Roman", serif',            label: 'Times New Roman' },
    { value: '"Courier New", monospace',            label: 'Courier New' },
    { value: '"Trebuchet MS", sans-serif',          label: 'Trebuchet MS' },
    { value: 'Verdana, sans-serif',                 label: 'Verdana' },
  ];

  // Polices Google ajoutées par l'admin (persistées dans localStorage,
  // pas supprimables côté UI).
  addedGoogleFonts: { value: string; label: string }[] = [];

  // Picker Google Fonts
  fontPickerOpen = false;
  fontPickerSearch = '';
  fontPickerCategory: GoogleFontCategory | 'all' = 'all';

  readonly googleFonts: GoogleFont[] = GOOGLE_FONTS;
  readonly fontCategoryLabels = FONT_CATEGORY_LABELS;
  readonly fontCategories: { id: GoogleFontCategory | 'all'; label: string }[] = [
    { id: 'all',         label: 'Toutes' },
    { id: 'sans-serif',  label: 'Sans-serif' },
    { id: 'serif',       label: 'Serif' },
    { id: 'display',     label: 'Display' },
    { id: 'handwriting', label: 'Manuscrite' },
    { id: 'monospace',   label: 'Monospace' },
  ];

  get fontFamilies(): { value: string; label: string }[] {
    return [...this.systemFontFamilies, ...this.addedGoogleFonts];
  }

  // Liste filtrée par catégorie + recherche dans le picker
  get filteredGoogleFonts(): GoogleFont[] {
    const q = this.fontPickerSearch.trim().toLowerCase();
    return this.googleFonts.filter((f) => {
      if (this.fontPickerCategory !== 'all' && f.category !== this.fontPickerCategory) return false;
      if (q && !f.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  isFontAdded(font: GoogleFont): boolean {
    return this.addedGoogleFonts.some((f) => f.value === font.cssFamily);
  }

  ouvrirPickerPolices(): void {
    this.fontPickerOpen = true;
    this.fontPickerSearch = '';
    this.fontPickerCategory = 'all';
    // Charge un échantillon de polices pour la preview
    this.googleFonts.forEach((f) => loadGoogleFont(f.name));
  }

  fermerPickerPolices(): void {
    this.fontPickerOpen = false;
  }

  ajouterGoogleFont(font: GoogleFont): void {
    if (this.isFontAdded(font)) return;
    loadGoogleFont(font.name);
    this.addedGoogleFonts.push({
      value: font.cssFamily,
      label: font.name,
    });
    this.persistGoogleFonts();

    // Applique tout de suite au composant sélectionné
    if (this.selectedComponent) {
      this.setConfigValue(this.selectedComponent, 'fontFamily', font.cssFamily);
    }
    this.notif.success('Police ajoutée', `« ${font.name} » est disponible dans la liste.`);
  }

  // Helper template : récupère le `cssFamily` à utiliser pour la preview
  // dans le picker (au cas où la police n'est pas encore complètement chargée).
  fontPreviewStyle(font: GoogleFont): string {
    return font.cssFamily;
  }

  private readonly googleFontsStorageKey = 'smartcv:adminGoogleFonts';

  private loadCustomFonts(): void {
    try {
      const raw = localStorage.getItem(this.googleFontsStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.addedGoogleFonts = parsed.filter(
          (f) => f && typeof f.value === 'string' && typeof f.label === 'string',
        );
        // Réinjecte chaque police au démarrage pour qu'elle s'affiche
        this.addedGoogleFonts.forEach((f) => loadGoogleFont(f.label));
      }
    } catch {
      // ignore
    }
  }

  private persistGoogleFonts(): void {
    try {
      localStorage.setItem(this.googleFontsStorageKey, JSON.stringify(this.addedGoogleFonts));
    } catch {
      // ignore
    }
  }

  private ensureConfig(c: TemplateComponentDto): Record<string, unknown> {
    if (!c.config) c.config = {};
    return c.config as Record<string, unknown>;
  }

  isFieldVisible(c: TemplateComponentDto, fieldKey: string): boolean {
    const cfg = c.config ?? {};
    const hidden = Array.isArray(cfg['hiddenFields']) ? (cfg['hiddenFields'] as string[]) : [];
    return !hidden.includes(fieldKey);
  }

  toggleField(c: TemplateComponentDto, fieldKey: string): void {
    const cfg = this.ensureConfig(c);
    const hidden = Array.isArray(cfg['hiddenFields']) ? [...(cfg['hiddenFields'] as string[])] : [];
    const idx = hidden.indexOf(fieldKey);
    if (idx >= 0) hidden.splice(idx, 1);
    else hidden.push(fieldKey);
    cfg['hiddenFields'] = hidden;
  }

  getConfigValue<T = unknown>(c: TemplateComponentDto | null, key: string, fallback: T): T {
    if (!c) return fallback;
    const v = c.config?.[key];
    return (v === undefined || v === null) ? fallback : (v as T);
  }

  setConfigValue(c: TemplateComponentDto, key: string, value: unknown): void {
    const cfg = this.ensureConfig(c);
    cfg[key] = value;
  }

  // ─── Champs personnalisés (ajoutés par l'admin) ────────────────────────
  newCustomFieldLabel = '';

  getCustomFields(c: TemplateComponentDto | null): CustomField[] {
    if (!c) return [];
    const v = c.config?.['customFields'];
    return Array.isArray(v) ? (v as CustomField[]) : [];
  }

  // Liste unifiée des champs (standards du catalogue + persos), pour affichage
  // dans la section "Champs affichés" sans aucune différence visuelle.
  getAllFields(c: TemplateComponentDto | null, descriptor: ComponentDescriptor | null): DisplayField[] {
    if (!c || !descriptor) return [];
    const standards: DisplayField[] = descriptor.fields.map((f) => ({
      key: f.key, label: f.label, isCustom: false,
    }));
    const customs: DisplayField[] = this.getCustomFields(c).map((f) => ({
      key: f.key, label: f.label, isCustom: true, customId: f.id,
    }));
    return [...standards, ...customs];
  }

  ajouterChampPerso(c: TemplateComponentDto): void {
    const label = this.newCustomFieldLabel.trim();
    if (!label) return;

    const key = this.toKey(label);
    if (!key) {
      this.notif.warning('Nom invalide', 'Veuillez saisir un nom pour le champ.');
      return;
    }

    // Évite la collision avec un champ standard ou un autre perso déjà ajouté
    const descriptor = findDescriptor(c.type);
    const existingKeys = [
      ...(descriptor?.fields.map((f) => f.key) ?? []),
      ...this.getCustomFields(c).map((f) => f.key),
    ];
    let finalKey = key;
    let i = 2;
    while (existingKeys.includes(finalKey)) {
      finalKey = `${key}_${i++}`;
    }

    const cfg = this.ensureConfig(c);
    const list = Array.isArray(cfg['customFields'])
      ? [...(cfg['customFields'] as CustomField[])]
      : [];
    list.push({
      id: 'fld-' + Math.random().toString(36).slice(2, 11),
      key: finalKey,
      label,
    });
    cfg['customFields'] = list;
    this.newCustomFieldLabel = '';
  }

  supprimerChampPerso(c: TemplateComponentDto, fieldId: string): void {
    const cfg = this.ensureConfig(c);
    const list = Array.isArray(cfg['customFields']) ? (cfg['customFields'] as CustomField[]) : [];
    const removed = list.find((f) => f.id === fieldId);
    cfg['customFields'] = list.filter((f) => f.id !== fieldId);

    // Nettoie aussi la liste hiddenFields si la clé y était
    if (removed) {
      const hidden = Array.isArray(cfg['hiddenFields']) ? (cfg['hiddenFields'] as string[]) : [];
      cfg['hiddenFields'] = hidden.filter((k) => k !== removed.key);
    }
  }

  // Normalise un label en clé technique (ex: "Adresse 2" → "adresse_2")
  private toKey(label: string): string {
    return label
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  trackByFieldId = (_: number, f: CustomField) => f.id;
  trackByDisplayKey = (_: number, f: DisplayField) => f.key;

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  descriptorOf(type: TemplateComponentType): ComponentDescriptor | null {
    return findDescriptor(type) ?? null;
  }

  totalComponents(): number {
    return this.boxes.reduce((n, b) => n + b.components.length, 0);
  }

  trackBoxById = (_: number, b: TemplateBoxDto) => b.id;
  trackComponentById = (_: number, c: TemplateComponentDto) => c.id;
  trackByType = (_: number, d: ComponentDescriptor) => d.type;

  private uid(): string {
    return 'cmp-' + Math.random().toString(36).slice(2, 11);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SAUVEGARDE
  // ─────────────────────────────────────────────────────────────────────────
  enregistrer(): void {
    if (!this.nom.trim()) {
      this.notif.warning('Nom obligatoire', 'Veuillez saisir un nom pour le template.');
      return;
    }
    if (this.totalComponents() === 0) {
      this.notif.warning(
        'Template vide',
        'Ajoutez au moins un composant CV avant de sauvegarder.',
      );
      return;
    }

    this.saving = true;
    const payload = {
      nom: this.nom.trim(),
      couleur: this.couleur,
      structure: {
        sections: [], // legacy vide
        layout: this.layoutId,
        couleurPrimaire: this.couleur,
        boxes: this.boxes,
      },
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
          this.mode === 'edit' ? 'Template modifié avec succès' : 'Template créé avec succès',
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
      },
    });
  }

  annuler(): void {
    this.confirmService.confirm({
      title: 'Annuler les modifications',
      message: 'Toutes les modifications non sauvegardées seront perdues. Continuer ?',
      confirmText: 'Oui, annuler',
      cancelText: 'Non, revenir',
      type: 'warning',
    }).then((ok) => {
      if (ok) this.router.navigate(['/admin']);
    });
  }

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
