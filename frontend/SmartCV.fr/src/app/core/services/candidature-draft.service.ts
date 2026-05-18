import { Injectable } from '@angular/core';
import { StatutCandidature } from '../models/models';
import { GenerateCvState } from './generate-cv-state.service';

export interface CandidatureDraft {
  entreprise?: string;
  poste?: string;
  /** Date locale au format yyyy-MM-dd (input type="date") */
  date?: string;
  statut?: StatutCandidature;
  cvId?: number;
}

@Injectable({ providedIn: 'root' })
export class CandidatureDraftService {
  private draft: CandidatureDraft | null = null;

  setDraft(draft: CandidatureDraft): void {
    this.draft = { ...draft };
  }

  /** Lit le brouillon une seule fois (consommé à l'arrivée sur la page candidatures). */
  consumeDraft(): CandidatureDraft | null {
    const d = this.draft;
    this.draft = null;
    return d ? { ...d } : null;
  }

  hasDraft(): boolean {
    return this.draft !== null;
  }
}

export function buildCandidatureDraftFromGenerateCv(state: GenerateCvState): CandidatureDraft {
  const poste = (state.titreCv || state.titre || '').trim();
  const entreprise = extractEntrepriseFromOffre(state.offreTexte || state.resumeIA || '');

  return {
    entreprise: entreprise || undefined,
    poste: poste || undefined,
    date: todayLocalDateInput(),
    statut: StatutCandidature.enregistree,
    cvId: state.cvCreeId ?? undefined,
  };
}

function todayLocalDateInput(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Heuristique légère sur le texte d'offre — l'utilisateur peut corriger ensuite. */
export function extractEntrepriseFromOffre(text: string): string {
  const t = text.trim();
  if (!t) return '';

  const labeled = t.match(
    /(?:entreprise|société|societe|company|employeur)\s*[:：]\s*([^\n,;]+)/i,
  );
  if (labeled?.[1]) return labeled[1].trim();

  const chez = t.match(/\bchez\s+([A-ZÀ-Ÿ][A-Za-zÀ-ÿ0-9&\s.'-]{2,60})/i);
  if (chez?.[1]) return chez[1].trim();

  const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    if (line.length < 4 || line.length > 80) continue;
    if (/^(poste|mission|profil|description|nous |vous |recherche|contexte)/i.test(line)) continue;
    if (/recrute|recherche|hiring|offre d/i.test(line) && /^[A-ZÀ-Ÿ]/.test(line)) {
      return line.replace(/\s*[-–—]\s*.*$/, '').trim();
    }
  }

  return '';
}
