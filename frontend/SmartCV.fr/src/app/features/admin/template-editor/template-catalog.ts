import {
  TemplateBoxDto,
  TemplateComponentType,
  TemplateLayoutId,
} from '../../../core/services/admin.service';

// ─────────────────────────────────────────────────────────────────────────
// CATALOGUE DE COMPOSANTS CV
// Chaque composant a un schema connu (champs typés) → l'IA sait quoi
// remplir comme placeholders à partir du profil utilisateur.
// ─────────────────────────────────────────────────────────────────────────

export interface ComponentDescriptor {
  type: TemplateComponentType;
  label: string;
  icon: string;
  description: string;
  defaultTitre: string;
  fields: ComponentField[];
}

export interface ComponentField {
  key: string;
  label: string;
  kind: 'string' | 'multiline' | 'list' | 'rating';
}

export const COMPONENT_CATALOG: ComponentDescriptor[] = [
  {
    type: 'infos-personnelles',
    label: 'Informations personnelles',
    icon: '👤',
    description: 'Nom, email, téléphone, adresse, liens',
    defaultTitre: 'Informations',
    fields: [
      { key: 'prenom',  label: 'Prénom',   kind: 'string' },
      { key: 'nom',     label: 'Nom',      kind: 'string' },
      { key: 'email',   label: 'Email',    kind: 'string' },
      { key: 'tel',     label: 'Téléphone',kind: 'string' },
      { key: 'adresse', label: 'Adresse',  kind: 'string' },
      { key: 'linkedin',label: 'LinkedIn', kind: 'string' },
      { key: 'github',  label: 'GitHub',   kind: 'string' },
      { key: 'site',    label: 'Site web', kind: 'string' },
    ],
  },
  {
    type: 'photo',
    label: 'Photo',
    icon: '🖼️',
    description: 'Photo de profil',
    defaultTitre: '',
    fields: [{ key: 'url', label: 'URL de la photo', kind: 'string' }],
  },
  {
    type: 'titre-poste',
    label: 'Titre / Poste',
    icon: '🏷️',
    description: 'Intitulé du poste visé',
    defaultTitre: '',
    fields: [{ key: 'titre', label: 'Titre du poste', kind: 'string' }],
  },
  {
    type: 'resume',
    label: 'Résumé professionnel',
    icon: '📝',
    description: 'Paragraphe d\'introduction',
    defaultTitre: 'Profil',
    fields: [{ key: 'texte', label: 'Résumé', kind: 'multiline' }],
  },
  {
    type: 'experiences',
    label: 'Expériences',
    icon: '💼',
    description: 'Parcours professionnel',
    defaultTitre: 'Expérience professionnelle',
    fields: [
      { key: 'poste',       label: 'Poste',       kind: 'string' },
      { key: 'entreprise',  label: 'Entreprise',  kind: 'string' },
      { key: 'lieu',        label: 'Lieu',        kind: 'string' },
      { key: 'dateDebut',   label: 'Date début',  kind: 'string' },
      { key: 'dateFin',     label: 'Date fin',    kind: 'string' },
      { key: 'description', label: 'Description', kind: 'multiline' },
    ],
  },
  {
    type: 'formations',
    label: 'Formations',
    icon: '🎓',
    description: 'Diplômes et études',
    defaultTitre: 'Formation',
    fields: [
      { key: 'diplome',      label: 'Diplôme',      kind: 'string' },
      { key: 'etablissement',label: 'Établissement',kind: 'string' },
      { key: 'lieu',         label: 'Lieu',         kind: 'string' },
      { key: 'dateDebut',    label: 'Date début',   kind: 'string' },
      { key: 'dateFin',      label: 'Date fin',     kind: 'string' },
      { key: 'description',  label: 'Description',  kind: 'multiline' },
    ],
  },
  {
    type: 'competences',
    label: 'Compétences',
    icon: '⚙️',
    description: 'Hard / soft skills avec niveau',
    defaultTitre: 'Compétences',
    fields: [
      { key: 'nom',    label: 'Compétence', kind: 'string' },
      { key: 'niveau', label: 'Niveau (1-5)', kind: 'rating' },
    ],
  },
  {
    type: 'langues',
    label: 'Langues',
    icon: '🌍',
    description: 'Langues parlées avec niveau',
    defaultTitre: 'Langues',
    fields: [
      { key: 'nom',    label: 'Langue', kind: 'string' },
      { key: 'niveau', label: 'Niveau (A1–C2)', kind: 'string' },
    ],
  },
  {
    type: 'projets',
    label: 'Projets',
    icon: '🚀',
    description: 'Projets personnels ou pro',
    defaultTitre: 'Projets',
    fields: [
      { key: 'nom',         label: 'Nom',         kind: 'string' },
      { key: 'description', label: 'Description', kind: 'multiline' },
      { key: 'lien',        label: 'Lien',        kind: 'string' },
      { key: 'technos',     label: 'Technologies',kind: 'list' },
    ],
  },
  {
    type: 'certifications',
    label: 'Certifications',
    icon: '🏅',
    description: 'Certifications obtenues',
    defaultTitre: 'Certifications',
    fields: [
      { key: 'nom',       label: 'Nom',       kind: 'string' },
      { key: 'organisme', label: 'Organisme', kind: 'string' },
      { key: 'date',      label: 'Date',      kind: 'string' },
    ],
  },
  {
    type: 'centres-interet',
    label: 'Centres d\'intérêt',
    icon: '⭐',
    description: 'Hobbies et passions',
    defaultTitre: 'Centres d\'intérêt',
    fields: [{ key: 'items', label: 'Liste', kind: 'list' }],
  },
  {
    type: 'references',
    label: 'Références',
    icon: '📞',
    description: 'Personnes de référence',
    defaultTitre: 'Références',
    fields: [
      { key: 'nom',     label: 'Nom',     kind: 'string' },
      { key: 'poste',   label: 'Poste',   kind: 'string' },
      { key: 'contact', label: 'Contact', kind: 'string' },
    ],
  },
  {
    type: 'texte-libre',
    label: 'Texte libre',
    icon: '📄',
    description: 'Bloc de texte personnalisé (admin)',
    defaultTitre: 'Section',
    fields: [{ key: 'texte', label: 'Contenu', kind: 'multiline' }],
  },
];

export function findDescriptor(type: TemplateComponentType): ComponentDescriptor | undefined {
  return COMPONENT_CATALOG.find((c) => c.type === type);
}

// ─────────────────────────────────────────────────────────────────────────
// LAYOUTS DISPONIBLES
// Chaque layout définit la liste des boxes (zones) du template.
// ─────────────────────────────────────────────────────────────────────────

export interface LayoutDescriptor {
  id: TemplateLayoutId;
  label: string;
  preview: string;
  boxes: { id: string; label: string; defaultStyle: 'sidebar' | 'main' | 'header' }[];
}

export const LAYOUTS: LayoutDescriptor[] = [
  {
    id: 'single-column',
    label: 'Une seule colonne',
    preview: '▭',
    boxes: [{ id: 'main', label: 'Contenu principal', defaultStyle: 'main' }],
  },
  {
    id: 'sidebar-left',
    label: 'Sidebar à gauche',
    preview: '▌▭',
    boxes: [
      { id: 'sidebar', label: 'Sidebar gauche',    defaultStyle: 'sidebar' },
      { id: 'main',    label: 'Contenu principal', defaultStyle: 'main' },
    ],
  },
  {
    id: 'sidebar-right',
    label: 'Sidebar à droite',
    preview: '▭▐',
    boxes: [
      { id: 'main',    label: 'Contenu principal', defaultStyle: 'main' },
      { id: 'sidebar', label: 'Sidebar droite',    defaultStyle: 'sidebar' },
    ],
  },
  {
    id: 'header-two-columns',
    label: 'Bandeau + 2 colonnes',
    preview: '▬\n▭▭',
    boxes: [
      { id: 'header', label: 'Bandeau supérieur', defaultStyle: 'header' },
      { id: 'left',   label: 'Colonne gauche',   defaultStyle: 'main' },
      { id: 'right',  label: 'Colonne droite',   defaultStyle: 'main' },
    ],
  },
];

export function findLayout(id: TemplateLayoutId): LayoutDescriptor | undefined {
  return LAYOUTS.find((l) => l.id === id);
}

// Style par défaut d'une box selon son rôle.
export function defaultBoxStyle(
  role: 'sidebar' | 'main' | 'header',
  couleurPrimaire: string,
): TemplateBoxDto['style'] {
  switch (role) {
    case 'sidebar':
      return { background: couleurPrimaire, textColor: '#ffffff', accentColor: '#ffffff', padding: '24px' };
    case 'header':
      return { background: couleurPrimaire, textColor: '#ffffff', accentColor: '#ffffff', padding: '24px' };
    case 'main':
    default:
      return { background: '#ffffff', textColor: '#222222', accentColor: couleurPrimaire, padding: '24px' };
  }
}

// Construit l'état initial des boxes à partir d'un layout.
export function buildBoxesForLayout(
  layoutId: TemplateLayoutId,
  couleurPrimaire: string,
): TemplateBoxDto[] {
  const layout = findLayout(layoutId);
  if (!layout) return [];
  return layout.boxes.map((b) => ({
    id: b.id,
    label: b.label,
    style: defaultBoxStyle(b.defaultStyle, couleurPrimaire),
    components: [],
  }));
}
