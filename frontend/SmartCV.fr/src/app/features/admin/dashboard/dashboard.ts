import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES — À déplacer dans core/models/admin.model.ts quand le backend sera prêt
// ─────────────────────────────────────────────────────────────────────────────

// TODO: correspondra à GET /api/admin/stats
interface Stat {
  label: string;
  valeur: number;
  delta: number;
  couleur: 'green' | 'beige' | 'red';
  historique: number[];
}

// TODO: correspondra à GET /api/admin/utilisateurs
interface Utilisateur {
  initiales: string;
  couleurAvatar: string;
  nom: string;
  role: string;
  email: string;
  cvGeneres: number;
  inscritLe: string;
  actif: boolean;
}

// TODO: correspondra à GET /api/admin/templates
interface Template {
  nom: string;
  couleur: string;
  lignes: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

  // ─────────────────────────────────────────────────────────────────────────
  // DONNÉES MOCK — À remplacer par appels API via AdminService
  // TODO: ng g service core/services/admin
  // ─────────────────────────────────────────────────────────────────────────

  // TODO: GET /api/admin/stats
  stats: Stat[] = [
    {
      label: 'UTILISATEURS INSCRITS',
      valeur: 142,
      delta: 18,
      couleur: 'green',
      historique: [40, 55, 45, 60, 50, 70, 90],
    },
    {
      label: 'CV GÉNÉRÉS',
      valeur: 1284,
      delta: 214,
      couleur: 'beige',
      historique: [60, 60, 65, 70, 75, 90, 110],
    },
    {
      label: 'CANDIDATURES ENREGISTRÉES',
      valeur: 3871,
      delta: 562,
      couleur: 'red',
      historique: [30, 40, 45, 50, 60, 75, 120],
    },
  ];

  // TODO: GET /api/admin/utilisateurs?search=&page=1
  utilisateurs: Utilisateur[] = [
    {
      initiales: 'JG', couleurAvatar: '#6b8068',
      nom: 'Jihane El Ghazrani', role: 'Étudiante',
      email: 'jihane@email.com', cvGeneres: 12,
      inscritLe: 'Jan 2025', actif: true,
    },
    {
      initiales: 'AM', couleurAvatar: '#8b7355',
      nom: 'Amine Mansouri', role: 'Jeune diplômé',
      email: 'amine@email.com', cvGeneres: 8,
      inscritLe: 'Fév 2025', actif: true,
    },
    {
      initiales: 'SB', couleurAvatar: '#9b1c1c',
      nom: 'Sara Benali', role: 'Étudiante Master',
      email: 'sara@email.com', cvGeneres: 5,
      inscritLe: 'Mars 2025', actif: false,
    },
    {
      initiales: 'YE', couleurAvatar: '#7a6040',
      nom: 'Youssef El Amrani', role: 'Chercheur d\'emploi',
      email: 'youssef@email.com', cvGeneres: 21,
      inscritLe: 'Déc 2024', actif: true,
    },
  ];

  // TODO: GET /api/admin/templates
  templates: Template[] = [
    { nom: 'Moderne', couleur: '#5c4220', lignes: ['#8b7355', '#c8b89a', '#c8b89a'] },
    { nom: 'Classique', couleur: '#9b1c1c', lignes: ['#c8a882', '#e8d5b8', '#e8d5b8'] },
    { nom: 'Minimaliste', couleur: '#6b8068', lignes: ['#a0b09a', '#d0dace', '#d0dace'] },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // ÉTAT UI
  // ─────────────────────────────────────────────────────────────────────────
  recherche = '';
  initiales = 'JG';

  get utilisateursFiltres(): Utilisateur[] {
    if (!this.recherche.trim()) return this.utilisateurs;
    const q = this.recherche.toLowerCase();
    return this.utilisateurs.filter(
      u => u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS UTILISATEURS
  // ─────────────────────────────────────────────────────────────────────────
  voirUtilisateur(u: Utilisateur): void {
    console.log('Voir:', u);
    // TODO: router.navigate(['/admin/utilisateurs', u.id])
  }

  toggleActif(u: Utilisateur): void {
    u.actif = !u.actif;
    // TODO: PUT /api/admin/utilisateurs/:id/actif { actif: u.actif }
  }

  supprimerUtilisateur(u: Utilisateur): void {
    if (confirm(`Supprimer ${u.nom} ?`)) {
      this.utilisateurs = this.utilisateurs.filter(x => x !== u);
      // TODO: DELETE /api/admin/utilisateurs/:id
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIONS TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────
  editerTemplate(t: Template): void {
    console.log('Éditer template:', t);
    // TODO: router.navigate(['/admin/templates', t.id])
  }

  supprimerTemplate(t: Template): void {
    this.templates = this.templates.filter(x => x !== t);
    // TODO: DELETE /api/admin/templates/:id
  }

  ajouterTemplate(): void {
    console.log('Ajouter template');
    // TODO: router.navigate(['/admin/templates/nouveau'])
  }

  ajouterTemplateGlobal(): void {
    console.log('Ajouter template global');
    // TODO: router.navigate(['/admin/templates/nouveau'])
  }
}
