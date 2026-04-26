import { TemplateComponentType } from '../../../core/services/admin.service';

// Données d'exemple affichées dans le builder admin et la preview read-only,
// pour que l'admin voie à quoi ressemblera le CV. Côté user, ces valeurs
// seront remplacées par les vraies données issues du profil + analyse IA.
export const SAMPLE_CV_DATA: Record<TemplateComponentType, unknown> = {
  'infos-personnelles': {
    prenom: 'Marie',
    nom: 'DUPONT',
    email: 'marie.dupont@email.com',
    tel: '+212 6 12 34 56 78',
    adresse: 'Casablanca, Maroc',
    linkedin: 'linkedin.com/in/mariedupont',
    github: 'github.com/mariedupont',
    site: 'mariedupont.dev',
  },
  'photo': {
    url: '',
  },
  'titre-poste': {
    titre: 'Développeuse Full-Stack',
  },
  'resume': {
    texte:
      'Développeuse passionnée avec 5 ans d\'expérience en architectures web modernes. ' +
      'Spécialisée en Angular et .NET, j\'aime concevoir des interfaces intuitives et performantes.',
  },
  'experiences': [
    {
      poste: 'Développeuse Full-Stack Senior',
      entreprise: 'BTP Consulting',
      lieu: 'Casablanca',
      dateDebut: '01/2023',
      dateFin: 'Présent',
      description:
        'Conception d\'applications Angular + .NET. Lead technique sur la plateforme SmartCV.',
    },
    {
      poste: 'Développeuse Front-End',
      entreprise: 'Acme Digital',
      lieu: 'Rabat',
      dateDebut: '06/2020',
      dateFin: '12/2022',
      description: 'Développement d\'interfaces React, intégration d\'APIs REST, mentorat de juniors.',
    },
  ],
  'formations': [
    {
      diplome: 'Master en Génie Logiciel',
      etablissement: 'ENSAT Tanger',
      lieu: 'Tanger',
      dateDebut: '2018',
      dateFin: '2020',
      description: 'Mention Très Bien. Spécialisation systèmes distribués.',
    },
    {
      diplome: 'Licence Informatique',
      etablissement: 'Université Mohammed V',
      lieu: 'Rabat',
      dateDebut: '2015',
      dateFin: '2018',
      description: '',
    },
  ],
  'competences': [
    { nom: 'Angular',     niveau: 5 },
    { nom: '.NET / C#',   niveau: 4 },
    { nom: 'TypeScript',  niveau: 5 },
    { nom: 'PostgreSQL',  niveau: 4 },
    { nom: 'Docker',      niveau: 3 },
  ],
  'langues': [
    { nom: 'Français', niveau: 'Natif' },
    { nom: 'Arabe',    niveau: 'Natif' },
    { nom: 'Anglais',  niveau: 'C1' },
    { nom: 'Espagnol', niveau: 'B1' },
  ],
  'projets': [
    {
      nom: 'SmartCV Platform',
      description: 'Plateforme de génération de CV optimisés par IA selon une offre d\'emploi.',
      lien: 'github.com/mariedupont/smartcv',
      technos: 'Angular, .NET, PostgreSQL, Docker',
    },
    {
      nom: 'Tracker Habits',
      description: 'Application mobile de suivi d\'habitudes quotidiennes.',
      lien: '',
      technos: 'React Native, Firebase',
    },
  ],
  'certifications': [
    { nom: 'AWS Certified Developer', organisme: 'Amazon Web Services', date: '2023' },
    { nom: 'Scrum Master Certified',  organisme: 'Scrum Alliance',      date: '2022' },
  ],
  'centres-interet': {
    items: 'Photographie, Randonnée, Lecture, Cuisine',
  },
  'references': [
    { nom: 'Ahmed BENNANI', poste: 'CTO chez BTP Consulting', contact: 'a.bennani@btp.com' },
  ],
  'texte-libre': {
    texte: 'Bloc de texte personnalisé. Le contenu sera défini par l\'utilisateur.',
  },
};

// Helper : renvoie les sample data d'un type donné
export function sampleFor<T = unknown>(type: TemplateComponentType): T {
  return SAMPLE_CV_DATA[type] as T;
}
