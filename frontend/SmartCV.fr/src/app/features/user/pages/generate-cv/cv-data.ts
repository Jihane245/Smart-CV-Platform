import { TemplateComponentType } from '../../../../core/services/admin.service';
import {
  ProfilMeResponse,
  SectionDynamiqueResponseDto,
  LigneDynamiqueResponseDto,
  normalizeCompetenceNiveau,
  toAbsolutePhotoUrl,
} from '../../../../core/services/profil.service';

export type CvData = Record<TemplateComponentType, any>;

// Modèles "vides" pour ajouter une nouvelle ligne dans une liste éditable
export const EMPTY_ITEM: Partial<Record<TemplateComponentType, () => any>> = {
  experiences:    () => ({ poste: '', entreprise: '', lieu: '', dateDebut: '', dateFin: '', description: '' }),
  formations:     () => ({ diplome: '', etablissement: '', lieu: '', dateDebut: '', dateFin: '', description: '' }),
  competences:    () => ({ nom: '', niveau: 3 }),
  langues:        () => ({ nom: '', niveau: '' }),
  projets:        () => ({ nom: '', description: '', lien: '', technos: '' }),
  certifications: () => ({ nom: '', organisme: '', date: '' }),
  references:     () => ({ nom: '', poste: '', contact: '' }),
};

const NIVEAU_DOTS: Record<string, number> = {
  Debutant: 2,
  Intermediaire: 3,
  Avance: 4,
  Expert: 5,
};

export interface UserHeaderInfos {
  prenom: string;
  nom: string;
  email: string;
}

export const PRESENT_LABEL: Record<string, string> = {
  fr: 'Présent',
  en: 'Present',
  ar: 'الآن',
  es: 'Presente',
};

export function presentLabelFor(lang: string): string {
  return PRESENT_LABEL[lang] ?? PRESENT_LABEL['fr'];
}

// Liste des "Présent"/"Present"/etc. pour détecter une valeur auto-générée non modifiée par l'user
export const ALL_PRESENT_VALUES: string[] = Object.values(PRESENT_LABEL);

// Ajoute un item vide si la liste est vide, pour que l'user voie au moins une ligne à remplir
function ensureOne<T extends TemplateComponentType>(type: T, list: any[]): any[] {
  if (list.length > 0) return list;
  const factory = EMPTY_ITEM[type];
  return factory ? [factory()] : [];
}

// Reconnaît à quel type de composant CV correspond une section dynamique du profil,
// en se basant sur le titre saisi par l'user
function detectSectionType(titre: string): TemplateComponentType | null {
  const t = (titre || '').toLowerCase().trim();
  if (/lang/.test(t))                                       return 'langues';
  if (/proj/.test(t))                                       return 'projets';
  if (/(certif)/.test(t))                                   return 'certifications';
  if (/(référ|refer|réf\.|ref\.)/.test(t))                  return 'references';
  if (/(intérêt|interet|loisir|interest|hobby|hobbies)/.test(t)) return 'centres-interet';
  return null;
}

function mapLignesToItems(type: TemplateComponentType, lignes: LigneDynamiqueResponseDto[]): any {
  const sortedLignes = [...lignes].sort((a, b) => a.ordre - b.ordre);
  switch (type) {
    case 'langues':
      return sortedLignes.map(l => ({ nom: l.detail || '', niveau: l.description || '' }));
    case 'projets':
      return sortedLignes.map(l => ({ nom: l.detail || '', description: l.description || '', lien: '', technos: '' }));
    case 'certifications':
      return sortedLignes.map(l => ({ nom: l.detail || '', organisme: l.description || '', date: '' }));
    case 'references':
      return sortedLignes.map(l => ({ nom: l.detail || '', poste: l.description || '', contact: '' }));
    case 'centres-interet':
      return { items: sortedLignes.map(l => l.detail || '').filter(Boolean).join(', ') };
    default:
      return null;
  }
}

export function buildCvDataFromProfil(
  profil: ProfilMeResponse,
  user: UserHeaderInfos,
  lang: string = 'fr',
  sections: SectionDynamiqueResponseDto[] = [],
): CvData {
  const photoUrl = toAbsolutePhotoUrl(profil.photoUrl) ?? '';
  const presentLabel = PRESENT_LABEL[lang] ?? PRESENT_LABEL['fr'];

  const experiences = (profil.experiences ?? []).map((e) => ({
    poste: e.poste ?? '',
    entreprise: e.entreprise ?? '',
    lieu: '',
    dateDebut: e.dateDebut ? formatDate(e.dateDebut) : '',
    dateFin: e.dateFin ? formatDate(e.dateFin) : presentLabel,
    description: e.description ?? '',
  }));

  const formations = (profil.formations ?? []).map((f) => ({
    diplome: f.diplome ?? '',
    etablissement: f.etablissement ?? '',
    lieu: '',
    dateDebut: f.annee ? String(f.annee) : '',
    dateFin: '',
    description: f.mention ?? '',
  }));

  const competences = (profil.competences ?? []).map((c) => ({
    nom: c.nom,
    niveau: NIVEAU_DOTS[normalizeCompetenceNiveau(c.niveau)] ?? 3,
  }));

  const certifications = (profil.certificats ?? []).map((c: any) => ({
    nom: c?.nom ?? '',
    organisme: c?.organisme ?? '',
    date: c?.date ?? '',
  }));

  // ── Mapping des sections dynamiques du profil vers les types de composants CV
  // (langues, projets, certifications, références, centres d'intérêt) basé sur leur titre.
  const fromSections: Partial<Record<TemplateComponentType, any>> = {};
  for (const section of sections ?? []) {
    const type = detectSectionType(section.titre);
    if (!type) continue;
    const mapped = mapLignesToItems(type, section.lignes ?? []);
    if (mapped == null) continue;
    fromSections[type] = mapped;
  }

  return {
    'infos-personnelles': {
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      tel: profil.telephone ?? '',
      adresse: profil.adresse ?? '',
      linkedin: profil.linkedIn ?? '',
      github: '',
      site: '',
    },
    'photo': { url: photoUrl },
    'titre-poste': { titre: profil.titre ?? '' },
    'resume': { texte: profil.description ?? '' },
    'experiences':    ensureOne('experiences',    experiences),
    'formations':     ensureOne('formations',     formations),
    'competences':    ensureOne('competences',    competences),
    'langues':        ensureOne('langues',        fromSections['langues']        ?? []),
    'projets':        ensureOne('projets',        fromSections['projets']        ?? []),
    'certifications': ensureOne('certifications', fromSections['certifications'] ?? certifications),
    'centres-interet': fromSections['centres-interet'] ?? { items: '' },
    'references':     ensureOne('references',     fromSections['references']     ?? []),
    'texte-libre':    { texte: '' },
  };
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
