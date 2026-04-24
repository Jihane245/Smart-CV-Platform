import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface CompetenceAnalysee {
  nom: string;
  statut: 'maitrise' | 'partiel' | 'renforcer';
}

@Component({
  selector: 'app-generate-cv',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './generate-cv.html',
  styleUrl: './generate-cv.scss',
})
export class GenerateCv {

  // ─── Navigation ────────────────────────────────────────────────────────────
  etapeActive = 1;
  etapesCompletes: number[] = [];

  etapes = [
    { num: 1, label: "Offre d'emploi" },
    { num: 2, label: 'Analyse IA' },
    { num: 3, label: 'Choix du template' },
    { num: 4, label: 'Validation & export' },
  ];

  // ─── Étape 1 — Offre d'emploi ───────────────────────────────────────────
  offreTexte = '';
  analyseEnCours = false;

  // ─── Étape 2 — Analyse IA ───────────────────────────────────────────────
  // TODO: remplacer par les données retournées par POST /api/cv/analyser-offre
  scoreCompatibilite = 78;
  scoreLabel = 'Bon match';

  competencesAnalysees: CompetenceAnalysee[] = [
    { nom: 'React.js', statut: 'maitrise' },
    { nom: 'Node.js', statut: 'maitrise' },
    { nom: 'Git', statut: 'maitrise' },
    { nom: 'PostgreSQL', statut: 'maitrise' },
    { nom: 'Docker', statut: 'partiel' },
    { nom: 'CI/CD', statut: 'partiel' },
    { nom: 'Next.js', statut: 'renforcer' },
    { nom: 'MongoDB', statut: 'renforcer' },
  ];

  recommandations = [
    'Mettez en avant votre expérience React dans le résumé',
    'Mentionnez vos notions Docker même partielles',
    'Ajoutez MongoDB si vous avez des bases',
  ];

  // ─── Étape 3 — Template ─────────────────────────────────────────────────
  templates = ['Moderne', 'Classique', 'Minimaliste'];
  templateSelectionne = 'Moderne';

  couleurs = ['#6B4E2A', '#3B5E3A', '#8B1A1A', '#1A3A5E'];
  couleurAccent = '#6B4E2A';

  langues = ['Français', 'Anglais', 'Arabe', 'Espagnol'];
  langueSelectionnee = 'Français';

  // ─── Étape 4 — Validation ───────────────────────────────────────────────
  // TODO: résumé optimisé retourné par l'IA POST /api/cv/generer
  resumeEdite = "Développeur Full Stack avec 2 ans d'expérience en React et Node.js, à la recherche d'un poste stimulant pour contribuer à des projets innovants.";
  titreCv = 'Développeur Full Stack – Capgemini';
  scoreApresOptimisation = 84;
  pointsGagnes = 6;

  // ─── Données mock profil (CV preview) ──────────────────────────────────
  // TODO: charger depuis GET /api/profil/me
  prenomMock = 'Jihane';
  nomMock = 'El Ghazrani';
  titreMock = 'Développeur Full Stack';
  emailMock = 'jihane@email.com';
  villeMock = 'Casablanca';
  linkedinMock = 'linkedin.com/in/jihane';
  resumeMock = "Développeur Full Stack avec 2 ans d'expérience en React et Node.js. Habitué aux environnements Agile, je cherche à contribuer à des projets innovants chez Capgemini.";

  competencesMock = [
    { nom: 'React.js', pct: 90 },
    { nom: 'Node.js', pct: 80 },
    { nom: 'PostgreSQL', pct: 70 },
    { nom: 'Docker', pct: 60 },
    { nom: 'Git / CI-CD', pct: 75 },
  ];

  experiencesMock = [
    {
      poste: 'Développeur Full Stack',
      entreprise: 'StartupTech Casablanca',
      periode: 'Jan 2023 – Présent',
      description: 'Développement React/Node.js, APIs REST, déploiement Docker.',
    },
    {
      poste: 'Stage Développeur Web',
      entreprise: 'Agence Digitale Rabat',
      periode: 'Juin – Août 2022',
      description: 'Refonte UI, optimisation requêtes PostgreSQL.',
    },
  ];

  formationMock = {
    etablissement: 'ENSA Tanger',
    diplome: 'Génie Informatique',
    debut: '2021',
    fin: '2024',
  };

  languesMock = [
    { langue: 'Arabe', niveau: 'Natif' },
    { langue: 'Français', niveau: 'Courant' },
    { langue: 'Anglais', niveau: 'Pro' },
  ];

  // ─── Méthodes navigation ────────────────────────────────────────────────
  allerEtape(n: number): void {
    if (n <= Math.max(...this.etapesCompletes, 1) + 1) {
      this.etapeActive = n;
    }
  }

  etapePrecedente(): void {
    if (this.etapeActive > 1) this.etapeActive--;
  }

  analyser(): void {
    if (!this.offreTexte.trim()) return;
    this.analyseEnCours = true;
    // TODO: appel API → POST /api/cv/analyser-offre { texteOffre: this.offreTexte }
    // this.cvService.analyserOffre(this.offreTexte).subscribe({ next: (res) => { ... } })
    setTimeout(() => {
      this.analyseEnCours = false;
      this.etapesCompletes.push(1);
      this.etapeActive = 2;
    }, 1200);
  }

  analyserImage(): void {
    // TODO: ouvrir file picker, envoyer image → POST /api/cv/analyser-image
    console.log('Analyse image — TODO');
  }

  allerEtape3(): void {
    this.etapesCompletes.push(2);
    this.etapeActive = 3;
  }

  generer(): void {
    // TODO: appel API → POST /api/cv/generer { templateId, couleur, langue }
    this.etapesCompletes.push(3);
    this.etapeActive = 4;
  }

  telechargerPdf(): void {
    // TODO: GET /api/cv/:id/pdf → télécharger le fichier
    console.log('Télécharger PDF — TODO');
  }

  enregistrerCandidature(): void {
    // TODO: POST /api/candidatures { cvId, offreId }
    console.log('Enregistrer candidature — TODO');
  }

  estComplete(n: number): boolean {
    return this.etapesCompletes.includes(n);
  }

  statutCompetence(statut: string): string {
    if (statut === 'maitrise') return '✓';
    if (statut === 'partiel') return '~';
    return '✕';
  }
}