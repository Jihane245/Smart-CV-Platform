import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CompetenceUpgrade } from './competence-upgrade';
import {
  CompetenceUpgradeService,
  CompetenceGapDto,
  QuestionDto,
  ReponseDto,
} from '../../../../core/services/competence-upgrade.service';
import { ProfilService } from '../../../../core/services/profil.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GenerateCvStateService } from '../../../../core/services/generate-cv-state.service';

describe('CompetenceUpgrade', () => {
  let fixture: ComponentFixture<CompetenceUpgrade>;
  let component: CompetenceUpgrade;

  let competenceUpgradeServiceMock: {
    genererTest: ReturnType<typeof vi.fn>;
    evaluerTest: ReturnType<typeof vi.fn>;
    genererRoadmap: ReturnType<typeof vi.fn>;
    marquerRoadmapSuivie: ReturnType<typeof vi.fn>;
    repasserTest: ReturnType<typeof vi.fn>;
  };

  let profilServiceMock: {
    getMe: ReturnType<typeof vi.fn>;
  };

  let notifMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  let genCvState: GenerateCvStateService;

  function detect(): void {
    // Some templates with ngModel/bindings can throw NG0100 in checkNoChanges mode.
    fixture.detectChanges(false);
  }

  const QUESTIONS: QuestionDto[] = [
    { Numero: 1, enonce: 'Q1', options: ['A', 'B', 'C', 'D'] },
    { Numero: 2, enonce: 'Q2', options: ['A2', 'B2', 'C2', 'D2'] },
  ];

  beforeEach(async () => {
    competenceUpgradeServiceMock = {
      genererTest: vi.fn().mockReturnValue(
        of({
          testId: 10,
          nomCompetence: 'Docker',
          questions: QUESTIONS,
        }),
      ),
      evaluerTest: vi.fn().mockReturnValue(
        of({
          testId: 10,
          score: 50,
          niveau: 'Intermediaire',
          message: 'ok',
          roadmapNecessaire: true,
        }),
      ),
      genererRoadmap: vi.fn().mockReturnValue(
        of({
          roadmapId: 99,
          nomCompetence: 'Docker',
          niveauDepart: 'Intermediaire',
          objectifFinal: 'Avance',
          etapes: [
            {
              ordre: 1,
              type: 'video',
              titre: 'Video',
              description: 'Watch',
              url: 'https://example.com',
              duree: '1h',
            },
          ],
        }),
      ),
      marquerRoadmapSuivie: vi.fn().mockReturnValue(of(void 0)),
      repasserTest: vi.fn().mockReturnValue(
        of({
          score: 85,
          niveau: 'Avance',
          competenceAjoutee: true,
          message: 'bravo',
          peutReessayer: false,
        }),
      ),
    };

    profilServiceMock = {
      getMe: vi.fn().mockReturnValue(
        of({
          id: 1,
          titre: 'Dev',
          competences: [{ idComp: 1, profilId: 1, nom: 'Angular', niveau: 'Avance' }],
        }),
      ),
    };

    notifMock = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    genCvState = new GenerateCvStateService();
    genCvState.reset();
    genCvState.patch({
      prenom: 'Jane',
      nom: 'Doe',
      competencesAnalysees: [
        { nom: 'Docker', statut: 'renforcer' },
        { nom: 'K8s', statut: 'partiel' },
        { nom: 'Angular', statut: 'maitrise' },
      ],
      niveauLabel: 'Intermediaire',
    } as any);

    await TestBed.configureTestingModule({
      imports: [CompetenceUpgrade],
      providers: [
        provideRouter([]),
        { provide: CompetenceUpgradeService, useValue: competenceUpgradeServiceMock },
        { provide: ProfilService, useValue: profilServiceMock },
        { provide: NotificationService, useValue: notifMock },
        { provide: GenerateCvStateService, useValue: genCvState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CompetenceUpgrade);
    component = fixture.componentInstance;
    detect();
    await fixture.whenStable();
    detect();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load profil and infer gaps from GenerateCvState', () => {
      expect(profilServiceMock.getMe).toHaveBeenCalled();
      // from profil
      expect(component.competencesActuelles).toEqual(['Angular']);
      // from state
      expect(component.competencesManquantes.map(c => c.nom)).toEqual(['Docker', 'K8s']);
      expect(component.totalManquantes).toBe(2);
      expect(component.competencesRequises).toEqual(['Angular +', 'Docker -', 'K8s -']);
      expect(component.profilPrenom).toBe('Jane');
      expect(component.profilNom).toBe('Doe');
    });

    it('should fallback to empty gaps when no analyse', async () => {
      const s = new GenerateCvStateService();
      s.reset();

      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [CompetenceUpgrade],
          providers: [
            provideRouter([]),
            { provide: CompetenceUpgradeService, useValue: competenceUpgradeServiceMock },
            { provide: ProfilService, useValue: profilServiceMock },
            { provide: NotificationService, useValue: notifMock },
            { provide: GenerateCvStateService, useValue: s },
          ],
        })
        .compileComponents();

      const f = TestBed.createComponent(CompetenceUpgrade);
      f.detectChanges(false);
      await f.whenStable();
      f.detectChanges(false);

      expect(f.componentInstance.competencesManquantes).toEqual([]);
      expect(f.componentInstance.chargementGaps).toBe(false);
    });
  });

  describe('navigation', () => {
    it('estComplete should be true for prior steps', () => {
      component.etapeActive = 4;
      expect(component.estComplete(1)).toBe(true);
      expect(component.estComplete(4)).toBe(false);
    });

    it('allerEtape should only allow going backward', () => {
      component.etapeActive = 4;
      component.allerEtape(2);
      expect(component.etapeActive).toBe(2);
      component.allerEtape(6);
      expect(component.etapeActive).toBe(2);
    });
  });

  describe('lancerTest', () => {
    it('should guard when no competence selected', () => {
      component.competenceSelectionnee = null;
      component.lancerTest();
      expect(competenceUpgradeServiceMock.genererTest).not.toHaveBeenCalled();
    });

    it('should call genererTest and populate questions', async () => {
      component.competenceSelectionnee = { nom: 'Docker', priorite: 'haute' };
      component.lancerTest();
      await fixture.whenStable();
      expect(component.etapeActive).toBe(3);
      expect(competenceUpgradeServiceMock.genererTest).toHaveBeenCalledWith('Docker');
      expect(component.testId).toBe(10);
      expect(component.questions.length).toBe(2);
      expect(component.chargementTest).toBe(false);
    });

    it('should return to step 2 when test has no questions', async () => {
      competenceUpgradeServiceMock.genererTest.mockReturnValueOnce(
        of({ testId: 1, nomCompetence: 'Docker', questions: [] }),
      );
      component.competenceSelectionnee = { nom: 'Docker', priorite: 'haute' };
      component.lancerTest();
      await fixture.whenStable();
      expect(notifMock.error).toHaveBeenCalled();
      expect(component.etapeActive).toBe(2);
      expect(component.chargementTest).toBe(false);
    });

    it('should show error when genererTest fails', async () => {
      competenceUpgradeServiceMock.genererTest.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );
      component.competenceSelectionnee = { nom: 'Docker', priorite: 'haute' };
      component.lancerTest();
      await fixture.whenStable();
      expect(notifMock.error).toHaveBeenCalledWith('Erreur lors de la génération du test.');
      expect(component.chargementTest).toBe(false);
    });
  });

  describe('questionSuivante / evaluerTest -> genererRoadmap', () => {
    beforeEach(async () => {
      component.competenceSelectionnee = { nom: 'Docker', priorite: 'haute' };
      component.lancerTest();
      await fixture.whenStable();
    });

    it('should push responses and advance question index', () => {
      component.choisirReponse('A');
      component.questionSuivante();
      expect(component.reponses).toEqual([{ Numero: 1, ReponseChoisie: 'A' } as ReponseDto]);
      expect(component.questionCourante).toBe(1);
    });

    it('should evaluate test after last question and generate roadmap', async () => {
      component.choisirReponse('A');
      component.questionSuivante();
      component.choisirReponse('B2');
      component.questionSuivante();
      await fixture.whenStable();

      expect(competenceUpgradeServiceMock.evaluerTest).toHaveBeenCalledWith(
        10,
        expect.arrayContaining([{ Numero: 1, ReponseChoisie: 'A' }]),
      );
      expect(competenceUpgradeServiceMock.genererRoadmap).toHaveBeenCalledWith(10);
      expect(component.etapeActive).toBe(4);
      expect(component.roadmapId).toBe(99);
      expect(component.roadmapEtapes.length).toBe(1);
      expect(component.etapesCompletees).toEqual([false]);
    });

    it('should show error and go back to step 2 when evaluation fails', async () => {
      competenceUpgradeServiceMock.evaluerTest.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );
      component.questionCourante = 1;
      component.reponseSelectionnee = 'A2';
      component.questionSuivante();
      await fixture.whenStable();

      expect(notifMock.error).toHaveBeenCalledWith("Erreur lors de l'évaluation. Veuillez réessayer.");
      expect(component.etapeActive).toBe(2);
    });
  });

  describe('genererRoadmap fallback', () => {
    it('should build local roadmap when API fails', async () => {
      competenceUpgradeServiceMock.genererRoadmap.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );
      component.competenceSelectionnee = { nom: 'Docker', priorite: 'haute' };
      component.testId = 10;
      component.genererRoadmap();
      await fixture.whenStable();

      expect(component.roadmapEtapes.length).toBeGreaterThan(0);
      expect(component.chargementRoadmap).toBe(false);
      expect(component.etapesCompletees.length).toBe(component.roadmapEtapes.length);
    });
  });

  describe('parcours', () => {
    it('progressionParcours should compute %', () => {
      component.roadmapEtapes = [{ ordre: 1, type: 'video', titre: 't', description: '', url: null, duree: null }];
      component.etapesCompletees = [false];
      expect(component.progressionParcours).toBe(0);
      component.toggleEtape(0);
      expect(component.progressionParcours).toBe(100);
      expect(component.toutesEtapesCompletees).toBe(true);
    });
  });

  describe('certification', () => {
    beforeEach(() => {
      component.competenceSelectionnee = { nom: 'Docker', priorite: 'haute' } as CompetenceGapDto;
      component.questions = QUESTIONS;
      component.roadmapId = 99;
    });

    it('passerCertification should mark roadmap followed then launch certification', async () => {
      component.passerCertification();
      await fixture.whenStable();
      expect(competenceUpgradeServiceMock.marquerRoadmapSuivie).toHaveBeenCalledWith(99);
      expect(component.etapeActive).toBe(6);
      expect(component.questionsCertif.length).toBe(2);
    });

    it('evaluerCertification should go to step 7 on success and append competence', async () => {
      component.lancerCertification();
      component.choisirReponseCertif('A');
      component.questionSuivanteCertif();
      component.reponseSelectionnoCertif = 'B2';
      component.voirResultat();
      await fixture.whenStable();

      expect(competenceUpgradeServiceMock.repasserTest).toHaveBeenCalled();
      expect(component.etapeActive).toBe(7);
      expect(component.competenceValidee).toBe(true);
      expect(component.profilCompetences.some(c => c.includes('Docker'))).toBe(true);
      expect(component.niveauValide).toBe('Avance');
    });

    it('evaluerCertification should show resultat when competence not validated', async () => {
      competenceUpgradeServiceMock.repasserTest.mockReturnValueOnce(
        of({
          score: 60,
          niveau: 'Debutant',
          competenceAjoutee: false,
          message: 'continue',
          peutReessayer: true,
        }),
      );
      component.lancerCertification();
      component.reponseSelectionnoCertif = 'A';
      component.voirResultat();
      await fixture.whenStable();

      expect(component.etapeActive).toBe(6);
      expect(component.resultatCertifAffiche).toBe(true);
      expect(component.peutReessayer).toBe(true);
      expect(component.pointsManquantsCertif).toBe(20);
    });
  });

  describe('continuerCompetencesRestantes', () => {
    it('should reset flow and remove selected competence from missing list', () => {
      component.competencesManquantes = [
        { nom: 'Docker', priorite: 'haute' },
        { nom: 'K8s', priorite: 'renforcer' },
      ];
      component.competenceSelectionnee = { nom: 'Docker', priorite: 'haute' };
      component.testId = 10;
      component.roadmapId = 99;
      component.etapeActive = 7;

      component.continuerCompetencesRestantes();
      expect(component.competencesManquantes.map(c => c.nom)).toEqual(['K8s']);
      expect(component.competenceSelectionnee).toBeNull();
      expect(component.testId).toBe(0);
      expect(component.roadmapId).toBe(0);
      expect(component.etapeActive).toBe(1);
    });
  });
});

