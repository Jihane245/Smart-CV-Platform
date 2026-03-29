import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h2>Profil</h2>
      <p>Gérez vos informations personnelles.</p>
    </div>
  `,
  styles: [`.page { font-family: 'Lato', sans-serif; color: #5C4220; }
    h2 { font-family: 'Playfair Display', serif; font-size: 1.75rem; margin: 0 0 0.5rem; }
    p  { color: #9A7B55; margin: 0; }`]
})
export class Profile {}