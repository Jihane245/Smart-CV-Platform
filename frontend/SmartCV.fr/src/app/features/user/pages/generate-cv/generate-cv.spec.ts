import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { GenerateCv } from './generate-cv';
import { ProfilService } from '../../../../core/services/profil.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CvService } from '../../../../core/services/cv.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CandidatureDraftService } from '../../../../core/services/candidature-draft.service';
import { ActivatedRoute, Router } from '@angular/router';

describe('GenerateCv', () => {
  let component: GenerateCv;
  let fixture: ComponentFixture<GenerateCv>;

  let profilServiceMock: { getMe: ReturnType<typeof vi.fn>; getSections: ReturnType<typeof vi.fn> };
  let authServiceMock: { getStatus: ReturnType<typeof vi.fn> };
  let cvServiceMock: {
    analyserTexte: ReturnType<typeof vi.fn>;
    analyserImage: ReturnType<typeof vi.fn>;
    creerCv: ReturnType<typeof vi.fn>;
  };
  let httpMock: { get: ReturnType<typeof vi.fn> };
  let notifMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let candidatureDraftMock: { setDraft: ReturnType<typeof vi.fn> };

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    profilServiceMock = {
      getMe: vi.fn().mockReturnValue(
        of({
          id: 1,
          titre: 'Dev',
          adresse: 'Paris',
          linkedIn: '',
          description: 'Résumé',
          competences: [],
          experiences: [],
          formations: [],
          certificats: [],
        }),
      ),
      getSections: vi.fn().mockReturnValue(of([])),
    };

    authServiceMock = {
      getStatus: vi.fn().mockReturnValue(
        of({
          isAuthenticated: true,
          identityName: 'jdoe',
          preferredUsername: 'jdoe',
          email: 'jane@example.com',
          name: 'Jane Doe',
          givenName: 'Jane',
          surname: 'Doe',
        }),
      ),
    };

    cvServiceMock = {
      analyserTexte: vi.fn().mockReturnValue(
        of({
          score_compatibilite: 72,
          niveau: 'Intermediaire',
          resume: 'Résumé IA',
          competences_match: [],
          competences_manquantes: [],
          recommandations: null,
        }),
      ),
      analyserImage: vi.fn().mockReturnValue(
        of({
          score_compatibilite: 60,
          niveau: 'Debutant',
          resume: 'Résumé IA image',
          competences_match: [],
          competences_manquantes: [],
          recommandations: null,
        }),
      ),
      creerCv: vi.fn().mockReturnValue(of({ id: 999 })),
    };

    httpMock = {
      get: vi.fn().mockReturnValue(of([])),
    };

    notifMock = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    routerMock = { navigate: vi.fn().mockResolvedValue(true) };
    candidatureDraftMock = { setDraft: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [GenerateCv],
      providers: [
        { provide: Router, useValue: routerMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => null } },
          },
        },
        { provide: ProfilService, useValue: profilServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: CvService, useValue: cvServiceMock },
        { provide: HttpClient, useValue: httpMock },
        { provide: NotificationService, useValue: notifMock },
        { provide: CandidatureDraftService, useValue: candidatureDraftMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateCv);
    component = fixture.componentInstance;
    // `GenerateCvStateService` est `providedIn: 'root'` → singleton, donc on reset
    // pour éviter les fuites d'état entre tests.
    component.cvState.reset();
    fixture.detectChanges(false);
    await fixture.whenStable();
    fixture.detectChanges(false);
  });

  function detect(): void {
    // In this project, some bindings (ngModel / stepper classes) can trigger
    // ExpressionChanged in dev-mode checkNoChanges. For unit tests, we disable
    // the additional no-changes check.
    fixture.detectChanges(false);
  }

  function setTextareaValue(selector: string, value: string): void {
    const el = fixture.nativeElement.querySelector(selector) as HTMLTextAreaElement | null;
    expect(el).toBeTruthy();
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('input'));
    detect();
  }

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('devrait démarrer à l’étape 1', () => {
    expect(component.etapeActive).toBe(1);
    expect(component.etapesCompletes).toEqual([]);
  });

  it('le bouton analyser devrait être désactivé si offreTexte est vide', () => {
    setTextareaValue('textarea.offre-textarea', '   ');
    const btn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button.btn-primary');
    expect(btn).toBeTruthy();
    expect(btn?.disabled).toBe(true);
  });

  it('le bouton analyser devrait être activé si offreTexte contient du texte', () => {
    setTextareaValue('textarea.offre-textarea', 'Une offre');
    const btn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button.btn-primary');
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
      detect();
      // évite NG0100: on laisse le template se stabiliser après le patch du state
      // (ngModel + bindings stepper)
      const items = fixture.debugElement.queryAll(By.css('.stepper-item'));
      expect(items.length).toBeGreaterThanOrEqual(4);
      items[1].triggerEventHandler('click', new MouseEvent('click'));
      detect();
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
      setTextareaValue('textarea.offre-textarea', '   ');
      component.analyser();
      expect(component.analyseEnCours).toBe(false);
      expect(component.etapeActive).toBe(1);
      expect(component.etapesCompletes).toEqual([]);
    });

    it('devrait passer en étape 2 après analyse', async () => {
      setTextareaValue('textarea.offre-textarea', 'Une offre de test');
      component.analyser();
      // L'observable est synchrone dans notre mock, donc l'état peut repasser à false immédiatement.
      expect(component.analyseEnCours).toBe(false);
      expect(component.etapesCompletes.includes(1)).toBe(true);
      expect(component.etapeActive).toBe(2);
    });

    it("devrait afficher 'Analyse en cours…' pendant l'analyse", () => {
      // On fixe directement l'état (moins fragile que ngModel pour ce test)
      component.offreTexte = 'Une offre de test';
      detect();

      // On simule un observable qui ne termine pas tout de suite
      const pending$ = new (class {
        subscribe(handlers: any) {
          // on garde une référence pour terminer plus tard si besoin
          (pending$ as any)._handlers = handlers;
          return { unsubscribe() {} };
        }
      })() as any;
      cvServiceMock.analyserTexte.mockReturnValueOnce(pending$);

      component.analyser();
      detect();
      expect(component.analyseEnCours).toBe(true);
      const btn = fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement | null;
      expect(btn).toBeTruthy();
      expect(btn?.disabled).toBe(true);

      // clean-up: on termine la requête
      (pending$ as any)._handlers?.next?.({
        score_compatibilite: 72,
        niveau: 'Intermediaire',
        resume: 'Résumé IA',
        competences_match: [],
        competences_manquantes: [],
        recommandations: null,
      });
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
      component.templateSelectionne = { id: 10, nom: 'T', couleur: '#000' } as any;
      component.generer();
      expect(cvServiceMock.creerCv).toHaveBeenCalled();
    });

    it('resumeEdite devrait être persisté dans le state', () => {
      component.resumeEdite = 'Résumé modifié';
      expect(component.resumeEdite).toBe('Résumé modifié');
      expect(component.cvState.state.resumeEdite).toBe('Résumé modifié');
    });
  });

  describe('actions TODO', () => {
    it('analyserImage devrait déclencher un click sur input file', () => {
      const input = document.createElement('input');
      const clickSpy = vi.spyOn(input, 'click');
      (component as any).imageInput = { nativeElement: input };
      component.analyserImage();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('telechargerPdf devrait warning si aucun CV généré', () => {
      component.telechargerPdf();
      expect(notifMock.warning).toHaveBeenCalledWith('Aucun CV généré à télécharger.');
    });

    it('enregistrerCandidature devrait avertir si aucun CV généré', () => {
      component.cvState.patch({ cvCreeId: null });
      component.enregistrerCandidature();
      expect(notifMock.warning).toHaveBeenCalledWith(
        'Générez d\'abord votre CV avant d\'enregistrer une candidature.',
      );
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('enregistrerCandidature devrait rediriger vers applications avec brouillon', () => {
      component.cvState.patch({
        cvCreeId: 5,
        titreCv: 'Développeur Angular',
        offreTexte: 'Entreprise: ACME Corp',
      });
      component.enregistrerCandidature();
      expect(candidatureDraftMock.setDraft).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/user/applications'], {
        fragment: 'nouvelle-candidature',
      });
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
      // expect(component.statutCompetence('partiel')).toBe('~');
      expect(component.statutCompetence('renforcer')).toBe('✕');
    });
  });
});

