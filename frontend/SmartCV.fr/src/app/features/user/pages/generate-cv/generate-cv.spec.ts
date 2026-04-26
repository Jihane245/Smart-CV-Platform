import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { GenerateCv } from './generate-cv';

describe('GenerateCv', () => {
  let component: GenerateCv;
  let fixture: ComponentFixture<GenerateCv>;

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

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

  it('le bouton analyser devrait être désactivé si offreTexte est vide', () => {
    component.offreTexte = '   ';
    fixture.detectChanges();
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button.btn-primary');
    expect(btn).toBeTruthy();
    expect(btn?.disabled).toBe(true);
  });

  it('le bouton analyser devrait être activé si offreTexte contient du texte', () => {
    component.offreTexte = 'Une offre';
    fixture.detectChanges();
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button.btn-primary');
    expect(btn).toBeTruthy();
    expect(btn?.disabled).toBe(false);
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

    it("devrait permettre d'aller à l'étape 2 si l'étape 1 est complétée via le stepper", () => {
      component.etapesCompletes = [1];
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.stepper-item'));
      expect(items.length).toBeGreaterThanOrEqual(4);
      items[1].triggerEventHandler('click', new MouseEvent('click'));
      fixture.detectChanges();
      expect(component.etapeActive).toBe(2);
    });

    it("ne devrait pas changer d'étape via le stepper si l'étape cible est trop loin", () => {
      fixture.detectChanges();
      const items = fixture.debugElement.queryAll(By.css('.stepper-item'));
      expect(items.length).toBeGreaterThanOrEqual(4);
      items[2].triggerEventHandler('click', new MouseEvent('click'));
      fixture.detectChanges();
      expect(component.etapeActive).toBe(1);
    });
  });

  describe('etapePrecedente', () => {
    it("ne devrait pas descendre en dessous de l'étape 1", () => {
      component.etapeActive = 1;
      component.etapePrecedente();
      expect(component.etapeActive).toBe(1);
    });

    it("devrait revenir à l'étape précédente", () => {
      component.etapeActive = 3;
      component.etapePrecedente();
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
      component.offreTexte = 'Une offre de test';
      vi.useFakeTimers();

      component.analyser();
      expect(component.analyseEnCours).toBe(true);

      vi.advanceTimersByTime(1200);

      expect(component.analyseEnCours).toBe(false);
      expect(component.etapesCompletes.includes(1)).toBe(true);
      expect(component.etapeActive).toBe(2);
    });

    it("devrait afficher 'Analyse en cours…' pendant l'analyse", () => {
      component.offreTexte = 'Une offre de test';
      vi.useFakeTimers();
      component.analyser();
      fixture.detectChanges();
      const btnText = (fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement | null)
        ?.textContent?.trim();
      expect(btnText).toContain('Analyse en cours');

      // On valide la fin de l'analyse via l'état du composant (le runner vitest ici
      // ne charge pas zone.js/testing, et un second detectChanges peut déclencher NG0100).
      vi.advanceTimersByTime(1200);
      expect(component.analyseEnCours).toBe(false);
      expect(component.etapeActive).toBe(2);
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

    it('devrait afficher le résumé édité dans le preview à l’étape 4', () => {
      component.resumeEdite = 'Résumé modifié';
      component.etapeActive = 4;
      fixture.detectChanges();
      const previewText = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(previewText).toContain('Résumé modifié');
    });
  });

  describe('actions TODO', () => {
    it('analyserImage devrait logger un message', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      component.analyserImage();
      expect(spy).toHaveBeenCalled();
    });

    it('telechargerPdf devrait logger un message', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      component.telechargerPdf();
      expect(spy).toHaveBeenCalled();
    });

    it('enregistrerCandidature devrait logger un message', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      component.enregistrerCandidature();
      expect(spy).toHaveBeenCalled();
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

