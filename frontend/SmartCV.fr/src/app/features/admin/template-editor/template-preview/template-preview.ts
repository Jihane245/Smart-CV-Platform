import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TemplateBoxDto,
  TemplateLayoutId,
  TemplateStructureDto,
} from '../../../../core/services/admin.service';
import { CvComponentRenderer } from '../cv-component-renderer/cv-component-renderer';

// ─────────────────────────────────────────────────────────────────────────
// Composant standalone qui rend visuellement un template complet (read-only).
// Utilisé dans le modal "Voir un template" du dashboard admin.
// ─────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-template-preview',
  standalone: true,
  imports: [CommonModule, CvComponentRenderer],
  templateUrl: './template-preview.html',
  styleUrl: './template-preview.scss',
})
export class TemplatePreview {
  @Input() structure: TemplateStructureDto | null | undefined = null;
  @Input() couleur = '#6b8068';

  get layoutId(): TemplateLayoutId {
    return (this.structure?.layout as TemplateLayoutId) || 'sidebar-left';
  }

  get boxes(): TemplateBoxDto[] {
    return this.structure?.boxes ?? [];
  }

  get hasBoxes(): boolean {
    return this.boxes.length > 0 && this.boxes.some((b) => b.components.length > 0);
  }

  trackBoxById = (_: number, b: TemplateBoxDto) => b.id;
  trackComponentById = (_: number, c: { id: string }) => c.id;
}
