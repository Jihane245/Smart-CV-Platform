import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generate-cv',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Generate CV</h2>
      <p>Créez un CV depuis votre profil et une offre d'emploi.</p>
    </div>
  `,
  styles: [`.page { font-family: 'Lato', sans-serif; color: #5C4220; }
    h2 { font-family: 'Playfair Display', serif; font-size: 1.75rem; margin: 0 0 0.5rem; }
    p  { color: #9A7B55; margin: 0; }`]
})
export class GenerateCv {}