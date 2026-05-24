import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CompetenceUpgrade } from './competence-upgrade';
import {
  CompetenceUpgradeService,
  GapSessionDetailDto,
  QuestionDto,
} from '../../../../core/services/competence-upgrade.service';
import { ProfilService } from '../../../../core/services/profil.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { GapSessionStateService } from '../../../../core/services/gap-session-state.service';

describe('CompetenceUpgrade', () => {
  let fixture: ComponentFixture<CompetenceUpgrade>;
  let component: CompetenceUpgrade;

  let competenceUpgradeServiceMock: {
    getGapSessionDetail: ReturnType<typeof vi.fn>;
    genererTest: ReturnType<typeof vi.fn>;
    evaluerTest: ReturnType<typeof vi.fn>;
    genererRoadmap: ReturnType<typeof vi.fn>;
    marquerRoadmapSuivie: ReturnType<typeof vi.fn>;
    repasserTest: ReturnType<typeof vi.fn>;
    linkRoadmapToSkill: ReturnType<typeof vi.fn>;
    getRoadmapDetail: ReturnType<typeof vi.fn>;
  };

  let profilServiceMock: { getMe: ReturnType<typeof vi.fn> };
  let notifMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };
  let gapSessionStateMock: { consume: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  const QUESTIONS: QuestionDto[] = [
    { numero: 1, enonce: 'Q1', options: ['A', 'B', 'C', 'D'] },
    { numero: 2, enonce: 'Q2', options: ['A2', 'B2', 'C2', 'D2'] },
  ];

  const SESSION_DETAIL: GapSessionDetailDto = {
    id: 1,
    texteOffre: 'Offre développeur',
    titreOffre: 'Dev Full Stack',
    entreprise: 'ACME',
    scoreCompatibilite: 72,
    createdAt: '2026-01-01T00:00:00Z',
    skills: [
      { id: 1, nomCompetence: 'Docker', priorite: 'haute', roadmapId: null },
      { id: 2, nomCompetence: 'K8s', priorite: 'renforcer', roadmapId: null },
    ],
  };

  function detect(): void {
    fixture.detectChanges(false);
  }

  async function setupComponent(options?: {
    sessionDetail?: GapSessionDetailDto | null;
    sessionId?: number | null;
    querySessionId?: string | null;
  }): Promise<void> {
    const detail = options?.sessionDetail !== undefined ? options.sessionDetail : SESSION_DETAIL;
    const sessionId = options?.sessionId !== undefined ? options.sessionId : (detail?.id ?? 1);

    gapSessionStateMock.consume.mockReturnValue({ detail, sessionId });

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [CompetenceUpgrade],
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: {
                  get: (key: string) =>
                    key === 'sessionId'
                      ? (options?.querySessionId ?? String(sessionId ?? ''))
                      : null,
                },
              },
            },
          },
          { provide: Router, useValue: routerMock },
          { provide: CompetenceUpgradeService, useValue: competenceUpgradeServiceMock },
          { provide: ProfilService, useValue: profilServiceMock },
          { provide: NotificationService, useValue: notifMock },
          { provide: GapSessionStateService, useValue: gapSessionStateMock },
        ],
      })
      .compileComponents();

    fixture = TestBed.createComponent(CompetenceUpgrade);
    component = fixture.componentInstance;
    detect();
    await fixture.whenStable();
    detect();
  }

  beforeEach(() => {
    competenceUpgradeServiceMock = {
      getGapSessionDetail: vi.fn().mockReturnValue(of(SESSION_DETAIL)),
      genererTest: vi.fn().mockReturnValue(
        of({ testId: 10, nomCompetence: 'Docker', questions: QUESTIONS }),
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
      linkRoadmapToSkill: vi.fn().mockReturnValue(of(void 0)),
      getRoadmapDetail: vi.fn().mockReturnValue(
        of({
          roadmapId: 99,
          userId: 1,
          nomCompetence: 'Docker',
          niveauDepart: 'Intermediaire',
          createdAt: '2026-01-01',
          etapes: [],
          nombreEtapes: 0,
          roadmapSuivie: false,
          completee: false,
          test: null,
          phase: 'AParcourir',
          phaseLibelle: 'À parcourir',
          prochaineAction: '',
          progression: 0,
          peutPasserTestFinal: false,
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

    gapSessionStateMock = {
      consume: vi.fn(),
    };

    routerMock = { navigate: vi.fn().mockResolvedValue(true) };
  });

  it('should create and load session from GapSessionStateService', async () => {
    await setupComponent();
    expect(component).toBeTruthy();
    expect(profilServiceMock.getMe).toHaveBeenCalled();
    expect(component.sessionId).toBe(1);
    expect(component.skills.length).toBe(2);
    expect(component.skills[0].nomCompetence).toBe('Docker');
    expect(component.pageStep).toBe(1);
    expect(component.chargementSession).toBe(false);
  });

  it('should fetch session detail when only sessionId is in state', async () => {
    await setupComponent({ sessionDetail: null, sessionId: 1 });
    expect(competenceUpgradeServiceMock.getGapSessionDetail).toHaveBeenCalledWith(1);
    expect(component.skills.length).toBe(2);
  });

  it('should redirect to generate-cv when no session id', async () => {
    await setupComponent({
      sessionDetail: null,
      sessionId: null,
      querySessionId: null,
    });
    expect(notifMock.error).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/user/generate-cv']);
  });

  describe('navigation', () => {
    beforeEach(async () => {
      await setupComponent();
    });

    it('estComplete should reflect pageStep', () => {
      component.pageStep = 4;
      expect(component.estComplete(1)).toBe(true);
      expect(component.estComplete(4)).toBe(false);
    });

    it('allerEtape2 should go to step 2', () => {
      component.allerEtape2();
      expect(component.pageStep).toBe(2);
    });
  });

  describe('lancerTest', () => {
    beforeEach(async () => {
      await setupComponent();
    });

    it('should call genererTest when selecting a fresh skill', async () => {
      component.selectionnerSkill(0);
      await fixture.whenStable();
      detect();

      expect(component.activeSkillIndex).toBe(0);
      expect(component.pageStep).toBe(3);
      expect(competenceUpgradeServiceMock.genererTest).toHaveBeenCalledWith('Docker');
      expect(component.activeSkill?.testId).toBe(10);
      expect(component.activeSkill?.questions.length).toBe(2);
      expect(component.chargementTest).toBe(false);
    });

    it('should return to step 2 when test has no questions', async () => {
      competenceUpgradeServiceMock.genererTest.mockReturnValueOnce(
        of({ testId: 1, nomCompetence: 'Docker', questions: [] }),
      );
      component.selectionnerSkill(0);
      await fixture.whenStable();
      detect();

      expect(notifMock.error).toHaveBeenCalled();
      expect(component.pageStep).toBe(2);
    });

    it('should show error when genererTest fails', async () => {
      competenceUpgradeServiceMock.genererTest.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );
      component.selectionnerSkill(0);
      await fixture.whenStable();
      detect();

      expect(notifMock.error).toHaveBeenCalledWith('Erreur lors de la génération du test.');
      expect(component.pageStep).toBe(2);
    });
  });

  describe('questionSuivante -> evaluerTest -> genererRoadmap', () => {
    beforeEach(async () => {
      await setupComponent();
      component.selectionnerSkill(0);
      await fixture.whenStable();
      detect();
    });

    it('should advance questions then evaluate and generate roadmap', async () => {
      component.choisirReponse('A');
      component.questionSuivante();
      component.choisirReponse('B2');
      component.questionSuivante();
      await fixture.whenStable();
      detect();

      expect(competenceUpgradeServiceMock.evaluerTest).toHaveBeenCalledWith(
        10,
        expect.arrayContaining([{ Numero: 1, ReponseChoisie: 'A' }]),
      );
      expect(competenceUpgradeServiceMock.genererRoadmap).toHaveBeenCalledWith(10);
      expect(component.pageStep).toBe(4);
      expect(component.activeSkill?.roadmapId).toBe(99);
      expect(component.activeSkill?.etapesRoadmap.length).toBe(1);
    });

    it('should go back to step 2 when evaluation fails', async () => {
      competenceUpgradeServiceMock.evaluerTest.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );
      component.questionCourante = 1;
      component.reponseSelectionnee = 'B2';
      component.questionSuivante();
      await fixture.whenStable();
      detect();

      expect(notifMock.error).toHaveBeenCalledWith(
        "Erreur lors de l'évaluation. Veuillez réessayer.",
      );
      expect(component.pageStep).toBe(2);
    });
  });

  describe('genererRoadmap fallback', () => {
    beforeEach(async () => {
      await setupComponent();
      component.selectionnerSkill(0);
      await fixture.whenStable();
      detect();
      component.choisirReponse('A');
      component.questionSuivante();
      component.choisirReponse('B2');
    });

    it('should build fallback roadmap when API fails', async () => {
      competenceUpgradeServiceMock.genererRoadmap.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );
      component.questionSuivante();
      await fixture.whenStable();
      detect();

      expect(component.activeSkill?.etapesRoadmap.length).toBeGreaterThan(0);
      expect(component.chargementRoadmap).toBe(false);
      expect(component.pageStep).toBe(4);
    });
  });

  describe('parcours', () => {
    beforeEach(async () => {
      await setupComponent();
      component.selectionnerSkill(0);
      await fixture.whenStable();
      detect();
      const skill = component.activeSkill!;
      skill.roadmapId = 99;
      skill.etapesRoadmap = [
        { ordre: 1, type: 'video', titre: 't', description: '', url: null, duree: null },
      ];
      skill.etapesCompletees = [false];
      skill.step = 'parcours';
      component.pageStep = 5;
    });

    it('progressionParcours should compute %', () => {
      expect(component.progressionParcours).toBe(0);
      component.toggleEtape(0);
      expect(component.progressionParcours).toBe(100);
      expect(component.toutesEtapesCompletees).toBe(true);
    });
  });

  describe('certification', () => {
    beforeEach(async () => {
      await setupComponent();
      component.selectionnerSkill(0);
      await fixture.whenStable();
      detect();
      const skill = component.activeSkill!;
      skill.testId = 10;
      skill.questions = QUESTIONS;
      skill.roadmapId = 99;
    });

    it('passerCertification should mark roadmap followed and show certif UI', async () => {
      component.passerCertification();
      await fixture.whenStable();
      detect();

      expect(competenceUpgradeServiceMock.marquerRoadmapSuivie).toHaveBeenCalledWith(99);
      expect(component.pageStep).toBe(6);
      expect(component.questionsCertif.length).toBe(2);
    });

    it('voirResultat should validate skill on success', async () => {
      component.passerCertification();
      component.choisirReponseCertif('A');
      component.questionSuivanteCertif();
      component.reponseSelectionneCertif = 'B2';
      component.voirResultat();
      await fixture.whenStable();
      detect();

      expect(competenceUpgradeServiceMock.repasserTest).toHaveBeenCalled();
      expect(component.pageStep).toBe(7);
      expect(component.activeSkill?.competenceValidee).toBe(true);
      expect(component.profilCompetences).toContain('Docker');
    });

    it('voirResultat should show retry UI when not validated', async () => {
      competenceUpgradeServiceMock.repasserTest.mockReturnValueOnce(
        of({
          score: 60,
          niveau: 'Debutant',
          competenceAjoutee: false,
          message: 'continue',
          peutReessayer: true,
        }),
      );
      component.passerCertification();
      component.reponseSelectionneCertif = 'A';
      component.voirResultat();
      await fixture.whenStable();
      detect();

      expect(component.pageStep).toBe(6);
      expect(component.resultatCertifAffiche).toBe(true);
      expect(component.peutReessayer).toBe(true);
    });
  });

  describe('continuerCompetencesRestantes', () => {
    beforeEach(async () => {
      await setupComponent();
      component.skills[0].competenceValidee = true;
      component.pageStep = 7;
    });

    it('should reset flow for next non-validated skill', () => {
      component.continuerCompetencesRestantes();
      expect(component.activeSkillIndex).toBe(1);
      expect(component.pageStep).toBe(2);
      expect(component.skillsNonValides.length).toBe(1);
      expect(component.skillsNonValides[0].nomCompetence).toBe('K8s');
    });
  });
});
