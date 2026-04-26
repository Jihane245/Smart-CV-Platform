import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { GenerateCv } from './generate-cv';

describe('GenerateCv', () => {
  let component: GenerateCv;
  let fixture: ComponentFixture<GenerateCv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateCv],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateCv);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait démarrer à l’étape 1', () => {
    expect(component.etapeActive).toBe(1);
    expect(component.etapesCompletes).toEqual([]);
  });

  describe('allerEtape', () => {
    it('ne devrait pas permettre de sauter trop loin', () => {
      component.allerEtape(3);
      expect(component.etapeActive).toBe(1);
    });

    it('devrait permettre d’aller à l’étape suivante quand l’étape 1 est complétée', () => {
      component.etapesCompletes = [1];
      component.allerEtape(2);
      expect(component.etapeActive).toBe(2);
    });
  });

  describe('analyser', () => {
    it('ne devrait rien faire si offreTexte est vide', () => {
      component.offreTexte = '   ';
      component.analyser();
      expect(component.analyseEnCours).toBe(false);
      expect(component.etapeActive).toBe(1);
      expect(component.etapesCompletes).toEqual([]);
    });

    it('devrait passer en étape 2 après analyse', () => {
      vi.useFakeTimers();
      component.offreTexte = 'Une offre de test';

      component.analyser();
      expect(component.analyseEnCours).toBe(true);

      vi.advanceTimersByTime(1200);

      expect(component.analyseEnCours).toBe(false);
      expect(component.etapesCompletes.includes(1)).toBe(true);
      expect(component.etapeActive).toBe(2);
      vi.useRealTimers();
    });
  });

  describe('navigation étapes 3 et 4', () => {
    it('allerEtape3 devrait marquer étape 2 complète et aller à l’étape 3', () => {
      component.etapeActive = 2;
      component.allerEtape3();
      expect(component.etapesCompletes.includes(2)).toBe(true);
      expect(component.etapeActive).toBe(3);
    });

    it('generer devrait marquer étape 3 complète et aller à l’étape 4', () => {
      component.etapeActive = 3;
      component.generer();
      expect(component.etapesCompletes.includes(3)).toBe(true);
      expect(component.etapeActive).toBe(4);
    });
  });

  describe('helpers', () => {
    it('estComplete devrait retourner true si l’étape est dans etapesCompletes', () => {
      component.etapesCompletes = [1, 3];
      expect(component.estComplete(1)).toBe(true);
      expect(component.estComplete(2)).toBe(false);
      expect(component.estComplete(3)).toBe(true);
    });

    it('statutCompetence devrait retourner le bon symbole', () => {
      expect(component.statutCompetence('maitrise')).toBe('✓');
      expect(component.statutCompetence('partiel')).toBe('~');
      expect(component.statutCompetence('renforcer')).toBe('✕');
    });
  });
});

