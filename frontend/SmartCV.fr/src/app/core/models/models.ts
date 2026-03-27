// src/app/core/models/models.ts
// Mirrors backend API.models exactly — field names, types, and enums match C# models.
// Use these types in all services and components.

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum NiveauCompetence {
  Debutant = 'Debutant',
  Intermediaire = 'Intermediaire',
  Avance = 'Avance',
  Expert = 'Expert',
}

export enum NiveauUrgence {
  Basse = 'Basse',
  Normale = 'Normale',
  Haute = 'Haute',
  Critique = 'Critique',
}

export enum RoleUtilisateur {
  Candidat = 'Candidat',
  Admin = 'Admin',
}

export enum StatutCVEnum {
  BROUILLON = 'BROUILLON',
  VALIDER = 'VALIDER',
  TELECHARGER = 'TELECHARGER',
}

export enum StatutCandidature {
  enregistree = 'enregistrée',
  envoyee = 'envoyée',
  recue = 'reçue',
  en_cours_d_examen = 'en_cours_d_examen',
  entretien = 'entretien',
  acceptee = 'acceptée',
  refusee = 'refusée',
  archivee = 'archivée',
}

export enum StatutTraitement {
  EnAttente = 'EnAttente',
  ExtractionEnCours = 'ExtractionEnCours',
  TexteExtrait = 'TexteExtrait',
  AnalyseEnCours = 'AnalyseEnCours',
  AnalyseTerminee = 'AnalyseTerminee',
  Erreur = 'Erreur',
}

export enum TypeContrat {
  CDI = 'CDI',
  CDD = 'CDD',
  Stage = 'Stage',
  Alternance = 'Alternance',
  Freelance = 'Freelance',
  Interim = 'Interim',
  Autre = 'Autre',
}

export enum TypeSourceOffre {
  Lien = 'Lien',
  Capture = 'Capture',
  PDF = 'PDF',
  Texte = 'Texte',
  Manuel = 'Manuel',
}

// ─── Models ───────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  isActif: boolean;
  role: RoleUtilisateur;
  createdAt: string; // ISO date string from API
  profil?: Profil;
  cvs?: Cv[];
  lettresMotivation?: LettreMotivation[];
  candidatures?: Candidature[];
  certificats?: Certificat[];
}

export interface Admin {
  id: number;
  userId: number;
  user?: User;
}

export interface Profil {
  id: number;
  userId: number;
  user?: User;
  titre?: string;
  telephone?: string;
  adresse?: string;
  linkedIn?: string;
  description?: string;
  competences?: Competence[];
  experiences?: Experience[];
  formations?: Formation[];
  certificats?: Certificat[];
}

export interface Competence {
  idComp: number;          // PK is IdComp, not Id
  profilId: number;
  profil?: Profil;
  nom: string;
  niveau: NiveauCompetence;
  categorie?: string;
}

export interface Experience {
  idExp: number;           // PK is IdExp
  profilId: number;
  profil?: Profil;
  poste: string;
  entreprise?: string;
  dateDebut: string;
  dateFin?: string;
  description?: string;
}

export interface Formation {
  idFrmt: number;          // PK is IdFrmt
  profilId: number;
  profil?: Profil;
  diplome?: string;
  etablissement?: string;
  annee?: number;
  mention?: string;
}

export interface Certificat {
  id: number;
  profilId: number;
  profil?: Profil;
  nom: string;
  organisme: string;
  dateObtention: string;
  dateExpiration?: string;
  niveau?: string;
  lienVerification?: string;
  description?: string;
  identifiant?: string;
  estValide: boolean;
  imageUrl?: string;
}

export interface TemplateCv {
  idTemp: number;          // PK is IdTemp
  nom: string;
  format?: string;
  apercuUrl?: string;
  cvs?: Cv[];
}

export interface Cv {
  idCv: number;            // PK is IdCv
  userId: number;
  user?: User;
  offreId?: number;
  offre?: Offre;
  keyWords?: string;
  skillsDetectes?: string; // jsonb on backend, serialized string from API
  scoreCompatibilite?: number;
  dateAnalyse?: string;
  exigences?: string;
  statut: StatutCVEnum;
  templateId?: number;
  template?: TemplateCv;
  candidatures?: Candidature[];
  analyseOffre?: AnalyseOffre;
}

export interface Offre {
  id: number;
  titre: string;
  entreprise?: string;
  description?: string;
  exigences?: string;
  typeContrat?: string;
  datePublication: string;
  dateExpiration?: string;
  urlOffre?: string;
  analyses?: AnalyseOffre[];
  lettresMotivation?: LettreMotivation[];
  candidatures?: Candidature[];
}

export interface AnalyseOffre {
  id: number;
  offreId: number;
  offre?: Offre;
  profilId?: number;
  profil?: Profil;
  motsClesExtraits: string[];    // jsonb → string[]
  competencesRequises: string[]; // jsonb → string[]
  competencesMatch: string[];    // jsonb → string[]
  competencesManquantes: string[]; // jsonb → string[]
  scoreCompatibilite: number;
  resume?: string;
  recommandations?: string;
  dateAnalyse: string;
  aPostule: boolean;
}

export interface LettreMotivation {
  id: number;
  userId: number;
  user?: User;
  offreId: number;
  offre?: Offre;
  contenu?: string;
  dateGeneration: string;
  filePath?: string;
}

export interface Candidature {
  id: number;
  userId: number;
  user?: User;
  cvId: number;            // CVId in C# → cvId in JSON (camelCase)
  cv?: Cv;
  offreId: number;
  offre?: Offre;
  entreprise?: string;
  poste?: string;
  dateEnvoi: string;
  statut: StatutCandidature;
  notes?: string;
}