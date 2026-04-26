import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateComponentDto } from '../../../../core/services/admin.service';
import { findDescriptor, ComponentDescriptor } from '../template-catalog';
import { sampleFor } from '../sample-cv-data';

// ─────────────────────────────────────────────────────────────────────────
// Composant qui rend visuellement un composant CV (infos-perso, expériences,
// compétences, etc.) à partir de :
//   - sa configuration template (titre, fields cachés, style)
//   - et des sample data fournies par l'admin builder.
// ─────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-cv-component-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-component-renderer.html',
  styleUrl: './cv-component-renderer.scss',
})
export class CvComponentRenderer {
  @Input({ required: true }) component!: TemplateComponentDto;
  @Input() accentColor = '#6b8068';

  // ─── Helpers de configuration du composant ─────────────────────────────
  get descriptor(): ComponentDescriptor | null {
    return findDescriptor(this.component.type) ?? null;
  }

  get hiddenFields(): string[] {
    const cfg = this.component.config ?? {};
    return Array.isArray(cfg['hiddenFields']) ? (cfg['hiddenFields'] as string[]) : [];
  }

  isVisible(fieldKey: string): boolean {
    return !this.hiddenFields.includes(fieldKey);
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

  // ─── Données affichées (sample data) ───────────────────────────────────
  get data(): any {
    return sampleFor(this.component.type);
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
