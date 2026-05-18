import { describe, it, expect } from 'vitest';
import { StatutCandidature } from '../models/models';
import {
  buildCandidatureDraftFromGenerateCv,
  extractEntrepriseFromOffre,
} from './candidature-draft.service';
import { GenerateCvState } from './generate-cv-state.service';

describe('candidature-draft.service', () => {
  it('extractEntrepriseFromOffre devrait lire un libellé Entreprise:', () => {
    const text = 'Poste Dev\nEntreprise: Synara Tech\nDescription…';
    expect(extractEntrepriseFromOffre(text)).toBe('Synara Tech');
  });

  it('buildCandidatureDraftFromGenerateCv devrait utiliser titreCv et la date du jour', () => {
    const state = {
      titreCv: 'Développeur Angular',
      titre: 'Ingénieur logiciel',
      offreTexte: 'Entreprise: ACME Corp',
      resumeIA: '',
      cvCreeId: 42,
    } as GenerateCvState;

    const draft = buildCandidatureDraftFromGenerateCv(state);
    expect(draft.poste).toBe('Développeur Angular');
    expect(draft.entreprise).toBe('ACME Corp');
    expect(draft.cvId).toBe(42);
    expect(draft.statut).toBe(StatutCandidature.enregistree);
    expect(draft.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
