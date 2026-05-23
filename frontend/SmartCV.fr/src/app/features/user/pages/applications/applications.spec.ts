import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { StatutCandidature } from '../../../../core/models/models';
import { CandidatureService } from '../../../../core/services/candidature.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CandidatureDraftService } from '../../../../core/services/candidature-draft.service';
import { Applications } from './applications';

describe('Applications', () => {
  let fixture: ComponentFixture<Applications>;
  let component: Applications;

  let candidatureServiceMock: {
    getMesCandidatures: ReturnType<typeof vi.fn>;
    getStats: ReturnType<typeof vi.fn>;
    ajouter: ReturnType<typeof vi.fn>;
    changerStatut: ReturnType<typeof vi.fn>;
  };

  let notifMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  let candidatureDraftMock: {
    consumeDraft: ReturnType<typeof vi.fn>;
  };

  const statsBase = {
    total: 10,
    actives: 8,
    acceptees: 1,
    refusees: 2,
    enCours: 5,
    tauxAcceptation: 10,
    parStatut: {
      enregistree: 1,
      envoyee: 2,
      recue: 1,
      enCoursExamen: 1,
      entretien: 1,
      acceptee: 1,
      refusee: 2,
      archivee: 1,
    },
  };

  beforeEach(async () => {
    const origGetElementById = document.getElementById.bind(document);
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'nouvelle-candidature') {
        return { scrollIntoView: vi.fn() } as unknown as HTMLElement;
      }
      return origGetElementById(id);
    });
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    candidatureServiceMock = {
      getMesCandidatures: vi.fn().mockReturnValue(
        of([
          {
            id: 1,
            entreprise: 'ACME',
            poste: 'Frontend',
            dateEnvoi: '2026-01-10T00:00:00.000Z',
            statut: StatutCandidature.envoyee,
          },
        ]),
      ),
      getStats: vi.fn().mockReturnValue(of(statsBase)),
      ajouter: vi.fn().mockReturnValue(of({ id: 123 })),
      changerStatut: vi.fn().mockReturnValue(of({})),
    };

    notifMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    candidatureDraftMock = {
      consumeDraft: vi.fn().mockReturnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [Applications],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              fragment: null,
              paramMap: { get: () => null },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: CandidatureService, useValue: candidatureServiceMock },
        { provide: CandidatureDraftService, useValue: candidatureDraftMock },
        { provide: NotificationService, useValue: notifMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Applications);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('brouillon generate-cv', () => {
    it('should prefill form when draft is consumed', async () => {
      candidatureDraftMock.consumeDraft.mockReturnValueOnce({
        entreprise: 'Synara',
        poste: 'Dev Frontend',
        date: '2026-05-18',
        statut: StatutCandidature.enregistree,
      });

      const f = TestBed.createComponent(Applications);
      const c = f.componentInstance;
      f.detectChanges();
      await f.whenStable();

      expect(c.formEntreprise).toBe('Synara');
      expect(c.formPoste).toBe('Dev Frontend');
      expect(c.formDate).toBe('2026-05-18');
      expect(c.formStatut).toBe(StatutCandidature.enregistree);
      expect(c.prefillActif).toBe(true);
      expect(notifMock.info).toHaveBeenCalled();
    });
  });

  describe('ngOnInit/recharger', () => {
    it('should load candidatures and stats, then clear loading', () => {
      expect(candidatureServiceMock.getMesCandidatures).toHaveBeenCalled();
      expect(candidatureServiceMock.getStats).toHaveBeenCalled();
      expect(component.chargement).toBe(false);
      expect(component.candidatures.length).toBe(1);
      expect(component.stats?.total).toBe(10);
    });

    it('should tolerate load error and show notification', async () => {
      candidatureServiceMock.getMesCandidatures.mockReturnValue(
        throwError(() => new Error('network')),
      );

      const f = TestBed.createComponent(Applications);
      f.detectChanges();
      await f.whenStable();

      expect(notifMock.error).toHaveBeenCalledWith('Impossible de charger vos candidatures.');
      expect(f.componentInstance.candidatures).toEqual([]);
      expect(f.componentInstance.stats).toBeNull();
      expect(f.componentInstance.chargement).toBe(false);
    });

    it('should set chargement only when not silencieux', async () => {
      const f = TestBed.createComponent(Applications);
      f.detectChanges();
      await f.whenStable();

      f.componentInstance.chargement = false;
      f.componentInstance.recharger(true);
      expect(f.componentInstance.chargement).toBe(false);
    });
  });

  describe('computed stats', () => {
    it('nombreReponses should sum accepted/refused/received/in review/interview', () => {
      component.stats = statsBase as any;
      expect(component.nombreReponses).toBe(1 + 2 + 1 + 1 + 1);
    });

    it('tauxReponsePct should be 0 when total is 0', () => {
      component.stats = { ...(statsBase as any), total: 0 };
      expect(component.tauxReponsePct).toBe(0);
    });

    it('tauxAcceptationPct should mirror stats', () => {
      component.stats = statsBase as any;
      expect(component.tauxAcceptationPct).toBe(10);
    });

    it('pieGradient should return fallback when no stats', () => {
      component.stats = null;
      expect(component.pieGradient).toContain('conic-gradient');
    });
  });

  describe('statutPillClass', () => {
    it('should map known statuses to classes', () => {
      expect(component.statutPillClass(StatutCandidature.acceptee)).toBe('pill-acceptee');
      expect(component.statutPillClass(StatutCandidature.refusee)).toBe('pill-refusee');
      expect(component.statutPillClass(StatutCandidature.envoyee)).toBe('pill-envoyee');
      expect(component.statutPillClass(StatutCandidature.archivee)).toBe('pill-archivee');
      expect(component.statutPillClass(StatutCandidature.recue)).toBe('pill-attente');
    });
  });

  describe('onStatutChange', () => {
    it('should no-op when selecting the same status', () => {
      const row = component.candidatures[0];
      const sel = document.createElement('select');
      sel.appendChild(new Option('old', row.statut));
      sel.value = row.statut;
      component.onStatutChange(row, { target: sel } as any);
      expect(candidatureServiceMock.changerStatut).not.toHaveBeenCalled();
    });

    it('should update row status and refresh stats on success', async () => {
      // Sans detectChanges : on teste la logique sans lier le template (évite NG0100 sur [disabled]/[ngClass])
      const f = TestBed.createComponent(Applications);
      const c = f.componentInstance;
      const row = {
        id: 1,
        entreprise: 'ACME',
        poste: 'Frontend',
        dateEnvoi: '2026-01-10T00:00:00.000Z',
        statut: StatutCandidature.envoyee,
      };
      c.candidatures = [row];

      const sel = document.createElement('select');
      sel.appendChild(new Option('old', row.statut));
      sel.appendChild(new Option('new', StatutCandidature.acceptee));
      sel.value = StatutCandidature.acceptee;

      candidatureServiceMock.changerStatut.mockReturnValueOnce(of({}));
      candidatureServiceMock.getStats.mockReturnValueOnce(
        of({ ...(statsBase as any), tauxAcceptation: 42 }),
      );

      c.onStatutChange(row, { target: sel } as any);
      await f.whenStable();

      expect(candidatureServiceMock.changerStatut).toHaveBeenCalledWith(1, StatutCandidature.acceptee);
      expect(row.statut).toBe(StatutCandidature.acceptee);
      expect(notifMock.success).toHaveBeenCalledWith('Statut mis à jour.');
      expect(c.majStatutId).toBeNull();
      expect(c.stats?.tauxAcceptation).toBe(42);
    });

    it('should revert select value and show error on failure', async () => {
      const row = component.candidatures[0];
      const old = row.statut;
      const sel = document.createElement('select');
      sel.appendChild(new Option('old', old));
      sel.appendChild(new Option('new', StatutCandidature.refusee));
      sel.value = StatutCandidature.refusee;

      candidatureServiceMock.changerStatut.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );

      component.onStatutChange(row, { target: sel } as any);
      await fixture.whenStable();

      expect(notifMock.error).toHaveBeenCalledWith('Impossible de mettre à jour le statut.');
      expect(sel.value).toBe(old);
      expect(component.majStatutId).toBeNull();
    });
  });

  describe('ajouter', () => {
    it('should require entreprise and poste', () => {
      component.formEntreprise = '   ';
      component.formPoste = '';
      component.formDate = '2026-03-01';

      component.ajouter();
      expect(notifMock.error).toHaveBeenCalledWith('Renseignez au moins l’entreprise et le poste.');
      expect(candidatureServiceMock.ajouter).not.toHaveBeenCalled();
    });

    it('should require date', () => {
      component.formEntreprise = 'ACME';
      component.formPoste = 'Dev';
      component.formDate = '';

      component.ajouter();
      expect(notifMock.error).toHaveBeenCalledWith('Indiquez la date d’envoi.');
      expect(candidatureServiceMock.ajouter).not.toHaveBeenCalled();
    });

    it('should create candidature, optionally chain status, then reload silently', async () => {
      const spyReload = vi.spyOn(component, 'recharger');

      component.formEntreprise = 'ACME';
      component.formPoste = 'Dev';
      component.formDate = '2026-03-01';
      component.formStatut = StatutCandidature.acceptee;

      component.ajouter();
      await fixture.whenStable();

      expect(candidatureServiceMock.ajouter).toHaveBeenCalledWith({
        entreprise: 'ACME',
        poste: 'Dev',
        dateEnvoi: expect.any(String),
        notes: null,
      });
      expect(candidatureServiceMock.changerStatut).toHaveBeenCalledWith(123, StatutCandidature.acceptee);
      expect(notifMock.success).toHaveBeenCalledWith('Candidature enregistrée.');

      expect(component.formEntreprise).toBe('');
      expect(component.formPoste).toBe('');
      expect(component.formDate).toBe('');
      expect(component.formStatut).toBe(StatutCandidature.envoyee);
      expect(spyReload).toHaveBeenCalledWith(true);
    });

    it('should show error when add fails', async () => {
      candidatureServiceMock.ajouter.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );

      component.formEntreprise = 'ACME';
      component.formPoste = 'Dev';
      component.formDate = '2026-03-01';

      component.ajouter();
      await fixture.whenStable();

      expect(notifMock.error).toHaveBeenCalledWith('Impossible d’enregistrer la candidature.');
    });
  });
});

