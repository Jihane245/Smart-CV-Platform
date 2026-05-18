import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateComponentDto } from '../../../../core/services/admin.service';
import { findDescriptor, ComponentDescriptor } from '../template-catalog';
import { sampleFor } from '../sample-cv-data';

// ─────────────────────────────────────────────────────────────────────────
// Composant qui rend visuellement un composant CV (infos-perso, expériences,
// compétences, etc.) à partir de :
//   - sa configuration template (titre, fields cachés, style)
//   - et des sample data fournies par l'admin builder.
// ─────────────────────────────────────────────────────────────────────────
// ─── i18n (placeholders + libellés boutons internes) ───────────────────────
const TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    prenom: 'Prénom', nom: 'Nom', email: 'email', tel: 'téléphone', adresse: 'adresse',
    linkedin: 'linkedin', github: 'github', site: 'site',
    poste: 'Poste', entreprise: 'Entreprise', lieu: 'Lieu',
    dateDebut: 'Début', dateFin: 'Fin', description: 'Description',
    diplome: 'Diplôme', etablissement: 'Établissement', mention: 'Mention / description',
    competence: 'Compétence', langue: 'Langue', niveau: 'Niveau',
    projet: 'Projet', lien: 'lien', technos: 'Technologies',
    certification: 'Certification', organisme: 'Organisme', date: 'Date',
    contact: 'Contact', interets: 'Centres d\'intérêt (séparés par virgules)',
    titrePoste: 'Intitulé du poste', resume: 'Résumé professionnel', texteLibre: 'Texte libre',
    addExperience: '+ Ajouter une expérience',
    addFormation: '+ Ajouter une formation',
    addCompetence: '+ Ajouter une compétence',
    addLangue: '+ Ajouter une langue',
    addProjet: '+ Ajouter un projet',
    addCertification: '+ Ajouter une certification',
    addReference: '+ Ajouter une référence',
    remove: 'Supprimer',
  },
  en: {
    prenom: 'First name', nom: 'Last name', email: 'email', tel: 'phone', adresse: 'address',
    linkedin: 'linkedin', github: 'github', site: 'website',
    poste: 'Job title', entreprise: 'Company', lieu: 'Location',
    dateDebut: 'Start', dateFin: 'End', description: 'Description',
    diplome: 'Degree', etablissement: 'School', mention: 'Honors / description',
    competence: 'Skill', langue: 'Language', niveau: 'Level',
    projet: 'Project', lien: 'link', technos: 'Technologies',
    certification: 'Certification', organisme: 'Issuer', date: 'Date',
    contact: 'Contact', interets: 'Interests (comma-separated)',
    titrePoste: 'Job title', resume: 'Professional summary', texteLibre: 'Free text',
    addExperience: '+ Add experience',
    addFormation: '+ Add education',
    addCompetence: '+ Add skill',
    addLangue: '+ Add language',
    addProjet: '+ Add project',
    addCertification: '+ Add certification',
    addReference: '+ Add reference',
    remove: 'Remove',
  },
  ar: {
    prenom: 'الاسم الأول', nom: 'اللقب', email: 'البريد', tel: 'الهاتف', adresse: 'العنوان',
    linkedin: 'لينكدإن', github: 'غيت‌هاب', site: 'الموقع',
    poste: 'الوظيفة', entreprise: 'الشركة', lieu: 'المكان',
    dateDebut: 'البداية', dateFin: 'النهاية', description: 'الوصف',
    diplome: 'الشهادة', etablissement: 'المؤسسة', mention: 'الميزة / الوصف',
    competence: 'مهارة', langue: 'لغة', niveau: 'المستوى',
    projet: 'مشروع', lien: 'رابط', technos: 'التقنيات',
    certification: 'شهادة', organisme: 'الجهة', date: 'التاريخ',
    contact: 'الاتصال', interets: 'الاهتمامات (مفصولة بفواصل)',
    titrePoste: 'المنصب', resume: 'الملخص المهني', texteLibre: 'نص حر',
    addExperience: '+ إضافة خبرة',
    addFormation: '+ إضافة تكوين',
    addCompetence: '+ إضافة مهارة',
    addLangue: '+ إضافة لغة',
    addProjet: '+ إضافة مشروع',
    addCertification: '+ إضافة شهادة',
    addReference: '+ إضافة مرجع',
    remove: 'حذف',
  },
  es: {
    prenom: 'Nombre', nom: 'Apellido', email: 'email', tel: 'teléfono', adresse: 'dirección',
    linkedin: 'linkedin', github: 'github', site: 'sitio',
    poste: 'Puesto', entreprise: 'Empresa', lieu: 'Ubicación',
    dateDebut: 'Inicio', dateFin: 'Fin', description: 'Descripción',
    diplome: 'Título', etablissement: 'Centro', mention: 'Mención / descripción',
    competence: 'Competencia', langue: 'Idioma', niveau: 'Nivel',
    projet: 'Proyecto', lien: 'enlace', technos: 'Tecnologías',
    certification: 'Certificación', organisme: 'Organismo', date: 'Fecha',
    contact: 'Contacto', interets: 'Intereses (separados por comas)',
    titrePoste: 'Puesto', resume: 'Resumen profesional', texteLibre: 'Texto libre',
    addExperience: '+ Añadir experiencia',
    addFormation: '+ Añadir formación',
    addCompetence: '+ Añadir competencia',
    addLangue: '+ Añadir idioma',
    addProjet: '+ Añadir proyecto',
    addCertification: '+ Añadir certificación',
    addReference: '+ Añadir referencia',
    remove: 'Eliminar',
  },
};

@Component({
  selector: 'app-cv-component-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cv-component-renderer.html',
  styleUrl: './cv-component-renderer.scss',
})
export class CvComponentRenderer {
  @Input({ required: true }) component!: TemplateComponentDto;
  @Input() accentColor = '#6b8068';

  // ─── Mode édition utilisateur (optionnels — défaut = comportement admin) ─
  @Input() realData: any = null;     // si fourni → utilisé à la place des sample data
  @Input() editable = false;         // si true → champs en input ngModel
  @Input() lang: string = 'fr';      // langue UI (placeholders, boutons)
  @Input() userHiddenFields: string[] = [];   // champs masqués par le user (en plus de ceux masqués par l'admin)
  @Output() dataChange = new EventEmitter<any>();
  @Output() fieldHide = new EventEmitter<string>();   // émis quand le user masque un champ

  // ─── Traduction des placeholders et boutons internes ───────────────────
  t(key: string): string {
    return (TRANSLATIONS[this.lang] ?? TRANSLATIONS['fr'])[key] ?? key;
  }

  // ─── Helpers de configuration du composant ─────────────────────────────
  get descriptor(): ComponentDescriptor | null {
    return findDescriptor(this.component.type) ?? null;
  }

  get hiddenFields(): string[] {
    const cfg = this.component.config ?? {};
    return Array.isArray(cfg['hiddenFields']) ? (cfg['hiddenFields'] as string[]) : [];
  }

  isVisible(fieldKey: string): boolean {
    return !this.hiddenFields.includes(fieldKey) && !this.userHiddenFields.includes(fieldKey);
  }

  hideField(fieldKey: string): void {
    this.fieldHide.emit(fieldKey);
  }

  // ─── Style appliqué au composant (police, couleurs) ────────────────────
  get titleColor(): string {
    return (this.component.config?.['titleColor'] as string) || this.accentColor;
  }
  get textColor(): string {
    return (this.component.config?.['textColor'] as string) || 'inherit';
  }
  get fontSize(): string {
    const v = this.component.config?.['fontSize'];
    return typeof v === 'number' ? `${v}px` : '13px';
  }
  get fontFamily(): string {
    return (this.component.config?.['fontFamily'] as string) || 'inherit';
  }

  // ─── Champs personnalisés (ajoutés par l'admin) ────────────────────────
  get customFields(): { id: string; key: string; label: string }[] {
    const v = this.component.config?.['customFields'];
    return Array.isArray(v) ? (v as { id: string; key: string; label: string }[]) : [];
  }

  // Champs persos visibles (non masqués via la checkbox)
  get visibleCustomFields(): { id: string; key: string; label: string }[] {
    return this.customFields.filter((f) => this.isVisible(f.key));
  }

  // ─── Données affichées : realData si fourni, sinon sample data ──────────
  get data(): any {
    return this.realData ?? sampleFor(this.component.type);
  }

  // Notifie le parent (utilisé en mode editable uniquement)
  onChange(): void {
    if (this.editable) this.dataChange.emit(this.realData);
  }

  // ─── Ajout / suppression d'items dans une liste éditable ───────────────
  private static readonly EMPTY_ITEM_FACTORY: Partial<Record<string, () => any>> = {
    experiences:    () => ({ poste: '', entreprise: '', lieu: '', dateDebut: '', dateFin: '', description: '' }),
    formations:     () => ({ diplome: '', etablissement: '', lieu: '', dateDebut: '', dateFin: '', description: '' }),
    competences:    () => ({ nom: '', niveau: 3 }),
    langues:        () => ({ nom: '', niveau: '' }),
    projets:        () => ({ nom: '', description: '', lien: '', technos: '' }),
    certifications: () => ({ nom: '', organisme: '', date: '' }),
    references:     () => ({ nom: '', poste: '', contact: '' }),
  };

  addItem(): void {
    if (!Array.isArray(this.realData)) return;
    const factory = CvComponentRenderer.EMPTY_ITEM_FACTORY[this.component.type];
    if (!factory) return;
    this.realData.push(factory());
    this.onChange();
  }

  removeItem(index: number): void {
    if (!Array.isArray(this.realData)) return;
    this.realData.splice(index, 1);
    this.onChange();
  }

  // Helpers de typage pour le HTML (forcent le retour en `any[]`)
  asArray(v: unknown): any[] {
    return Array.isArray(v) ? v : [];
  }

  // ─── Helpers visuels ───────────────────────────────────────────────────
  initiales(): string {
    const d = this.data;
    const first = (d?.prenom || '').charAt(0).toUpperCase();
    const last = (d?.nom || '').charAt(0).toUpperCase();
    return (first + last) || '?';
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  trackByIndex = (_: number, __: unknown) => _;
}
