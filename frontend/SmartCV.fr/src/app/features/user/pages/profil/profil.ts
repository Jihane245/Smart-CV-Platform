import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES — À déplacer dans models/profil.model.ts quand le backend sera prêt
// Elles devront correspondre exactement aux types retournés par l'API
// ─────────────────────────────────────────────────────────────────────────────
interface Experience {
  poste: string;
  entreprise: string;
  periode: string;
  description: string;
  actuel: boolean;
}

interface Formation {
  etablissement: string;
  diplome: string;
  debut: string;
  fin: string;
}

interface LigneSection {
  detail: string;
  description: string;
}

interface Section {
  titre: string;
  lignes: LigneSection[];
}

// TODO: créer src/app/core/models/profil.model.ts avec ces interfaces
// export interface ProfilUtilisateur {
//   id: string;
//   prenom: string;
//   nom: string;
//   email: string;
//   telephone: string;
//   ville: string;
//   linkedin: string;
//   resume: string;
//   competences: string[];
//   experiences: Experience[];
//   formations: Formation[];
//   completude: number;
// }

@Component({
  selector: 'app-mon-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
})

// TODO: injecter ProfilService quand le backend sera prêt
// import { ProfilService } from '../../../../core/services/profil.service';
// Générer avec : ng g service core/services/profil
export class MonProfil implements OnInit {

  // ─────────────────────────────────────────────────────────────────────────
  // DONNÉES MOCK — À remplacer par les données retournées par l'API
  // TODO: supprimer ces valeurs en dur et les charger via ProfilService.getProfil()
  // ─────────────────────────────────────────────────────────────────────────
  prenom = 'Jihane';
  nom = 'El Ghazrani';
  email = 'jihane@email.com';
  telephone = '+212 6 00 00 00 00';
  ville = 'Casablanca';
  linkedin = 'linkedin.com/in/jihane';
  resume = 'Développeur Full Stack passionné avec 2 ans d\'expérience en React et Node.js. Je cherche un poste stimulant pour contribuer à des projets innovants.';

  // TODO: charger depuis l'API → GET /api/profil/me
  competences = ['React.js', 'Node.js', 'Git', 'PostgreSQL', 'Docker', 'REST API', 'Figma'];

  // TODO: charger depuis l'API → GET /api/profil/me/experiences
  experiences: Experience[] = [
    {
      poste: 'Développeur Full Stack',
      entreprise: 'StartupTech Casablanca',
      periode: 'Jan 2023 – Présent · 2 ans',
      description: 'Développement de fonctionnalités React/Node.js, intégration d\'APIs REST, déploiement Docker.',
      actuel: true,
    },
    {
      poste: 'Stage Développeur Web',
      entreprise: 'Agence Digitale Rabat',
      periode: 'Juin – Août 2022 · 3 mois',
      description: 'Refonte de l\'interface utilisateur, optimisation des requêtes PostgreSQL.',
      actuel: false,
    },
  ];

  // TODO: charger depuis l'API → GET /api/profil/me/formations
  formations: Formation[] = [
    {
      etablissement: 'ENSA Tanger',
      diplome: 'Génie Informatique',
      debut: '2021',
      fin: '2024'
    },
  ];

  sections: Section[] = [];
  

  // TODO: calculer côté backend et recevoir dans la réponse GET /api/profil/me
  completude = 72;

  // TODO: générer depuis prenom + nom retournés par l'API
  initiales = 'JG';

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAT LOCAL UI — ces variables restent dans le composant, pas dans l'API
  // ─────────────────────────────────────────────────────────────────────────
  nouvelleCompetence = '';
  ajoutCompetenceVisible = false;

  ngOnInit(): void {
    // TODO: remplacer le contenu de cette méthode par l'appel API :
    //
    // this.profilService.getProfil().subscribe({
    //   next: (data) => {
    //     this.prenom = data.prenom;
    //     this.nom = data.nom;
    //     this.email = data.email;
    //     this.telephone = data.telephone;
    //     this.ville = data.ville;
    //     this.linkedin = data.linkedin;
    //     this.resume = data.resume;
    //     this.competences = data.competences;
    //     this.experiences = data.experiences;
    //     this.formations = data.formations;
    //     this.completude = data.completude;
    //     this.initiales = data.prenom[0] + data.nom[0];
    //   },
    //   error: (err) => console.error('Erreur chargement profil', err),
    // });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // COMPÉTENCES
  // ─────────────────────────────────────────────────────────────────────────
  ajouterCompetence(): void {
    if (this.nouvelleCompetence.trim()) {
      this.competences.push(this.nouvelleCompetence.trim());
      this.nouvelleCompetence = '';
      this.ajoutCompetenceVisible = false;

      // TODO: appel API → POST /api/profil/me/competences
      // this.profilService.ajouterCompetence(this.nouvelleCompetence).subscribe(...)
    }
  }

  supprimerCompetence(index: number): void {
    this.competences.splice(index, 1);

    // TODO: appel API → DELETE /api/profil/me/competences/:index
    // this.profilService.supprimerCompetence(index).subscribe(...)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EXPÉRIENCES
  // ─────────────────────────────────────────────────────────────────────────
  ajouterExperience(): void {
    this.experiences.push({
      poste: '',
      entreprise: '',
      periode: '',
      description: '',
      actuel: false,
    });

    // TODO: appel API → POST /api/profil/me/experiences
    // this.profilService.ajouterExperience(nouvelleExp).subscribe(...)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FORMATIONS
  // ─────────────────────────────────────────────────────────────────────────
  ajouterFormation(): void {
    this.formations.push({
      etablissement: '',
      diplome: '',
      debut: '',
      fin: ''
    });

    // TODO: appel API → POST /api/profil/me/formations
    // this.profilService.ajouterFormation(nouvelleFormation).subscribe(...)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ENREGISTRER — bouton principal
  // ─────────────────────────────────────────────────────────────────────────
  enregistrer(): void {
    // TODO: remplacer par l'appel API → PUT /api/profil/me
    //
    // const payload: ProfilUtilisateur = {
    //   prenom: this.prenom,
    //   nom: this.nom,
    //   email: this.email,
    //   telephone: this.telephone,
    //   ville: this.ville,
    //   linkedin: this.linkedin,
    //   resume: this.resume,
    //   competences: this.competences,
    //   experiences: this.experiences,
    //   formations: this.formations,
    // };
    //
    // this.profilService.mettreAJourProfil(payload).subscribe({
    //   next: () => console.log('Profil mis à jour avec succès'),
    //   error: (err) => console.error('Erreur mise à jour', err),
    // });

    console.log('Profil enregistré (mock)');
  }

  ajouterSection(): void {
    this.sections.push({
      titre: 'Section #',
      lignes: [
        { detail: 'Détail 1', description: '' },
        { detail: 'Détail 2', description: '' },
      ],
    });
    // TODO: POST /api/profil/me/sections
  }

  supprimerSection(index: number): void {
    this.sections.splice(index, 1);
    // TODO: DELETE /api/profil/me/sections/:id
  }

  ajouterLigne(section: Section): void {
    section.lignes.push({ detail: `Détail ${section.lignes.length + 1}`, description: '' });
    // TODO: POST /api/profil/me/sections/:id/lignes
  }

  supprimerLigne(section: Section, index: number): void {
    section.lignes.splice(index, 1);
    // TODO: DELETE /api/profil/me/sections/:id/lignes/:index
  }


}