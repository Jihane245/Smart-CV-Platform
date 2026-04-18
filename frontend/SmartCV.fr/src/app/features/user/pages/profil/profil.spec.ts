import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService, AuthStatus } from '../../../../core/services/auth.service';
import { ProfilMeResponse, ProfilService } from '../../../../core/services/profil.service';
import { MonProfil } from './profil';
import { NiveauCompetence } from '../../../../core/models/models';

describe('MonProfil', () => {
  let fixture: ComponentFixture<MonProfil>;
  let component: MonProfil;

  let authServiceMock: {
    getStatus: ReturnType<typeof vi.fn>;
  };

  let profilServiceMock: {
    getMe: ReturnType<typeof vi.fn>;
    updateMe: ReturnType<typeof vi.fn>;
    addCompetence: ReturnType<typeof vi.fn>;
    deleteCompetence: ReturnType<typeof vi.fn>;
    addExperience: ReturnType<typeof vi.fn>;
    updateExperience: ReturnType<typeof vi.fn>;
    addFormation: ReturnType<typeof vi.fn>;
    updateFormation: ReturnType<typeof vi.fn>;
  };

  const statusOk: AuthStatus = {
    isAuthenticated: true,
    identityName: 'jdoe',
    preferredUsername: 'jdoe',
    email: 'jane@example.com',
    name: 'Jane Doe',
    givenName: 'Jane',
    surname: 'Doe',
  };

  function baseProfil(overrides: Partial<ProfilMeResponse> = {}): ProfilMeResponse {
    return {
      id: 42,
      titre: 'Développeur',
      telephone: '0600000000',
      adresse: 'Casablanca',
      linkedIn: 'linkedin.com/in/jane',
      description: 'Résumé professionnel assez long pour la complétude.',
      competences: [],
      experiences: [],
      formations: [],
      certificats: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    authServiceMock = {
      getStatus: vi.fn().mockReturnValue(of(statusOk)),
    };

    profilServiceMock = {
      getMe: vi.fn().mockReturnValue(of(baseProfil())),
      updateMe: vi.fn().mockReturnValue(of(baseProfil())),
      addCompetence: vi.fn().mockReturnValue(of({})),
      deleteCompetence: vi.fn().mockReturnValue(of(void 0)),
      addExperience: vi.fn().mockReturnValue(of({ idExp: 99 })),
      updateExperience: vi.fn().mockReturnValue(of(void 0)),
      addFormation: vi.fn().mockReturnValue(of({ idFrmt: 88 })),
      updateFormation: vi.fn().mockReturnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [MonProfil],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ProfilService, useValue: profilServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MonProfil);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load auth status and profil, then clear loading', () => {
      expect(authServiceMock.getStatus).toHaveBeenCalled();
      expect(profilServiceMock.getMe).toHaveBeenCalled();
      expect(component.loading).toBe(false);
      expect(component.prenom).toBe('Jane');
      expect(component.nom).toBe('Doe');
      expect(component.email).toBe('jane@example.com');
      expect(component.initiales).toBe('JD');
      expect(component.titre).toBe('Développeur');
      expect(component.ville).toBe('Casablanca');
    });

    it('should apply competences with normalized niveau', async () => {
      profilServiceMock.getMe.mockReturnValue(
        of(
          baseProfil({
            competences: [
              { idComp: 1, nom: 'Angular', niveau: 2, categorie: 'Web' },
            ],
          })
        )
      );

      const f = TestBed.createComponent(MonProfil);
      f.detectChanges();
      await f.whenStable();

      expect(f.componentInstance.competences.length).toBe(1);
      expect(f.componentInstance.competences[0].nom).toBe('Angular');
      expect(f.componentInstance.competences[0].niveau).toBe(NiveauCompetence.Avance);
    });

    it('should tolerate auth error', async () => {
      authServiceMock.getStatus.mockReturnValue(throwError(() => new Error('network')));

      const f = TestBed.createComponent(MonProfil);
      f.detectChanges();
      await f.whenStable();

      expect(f.componentInstance.prenom).toBe('');
      expect(f.componentInstance.loading).toBe(false);
    });

    it('should tolerate profil error', async () => {
      profilServiceMock.getMe.mockReturnValue(throwError(() => new Error('401')));

      const f = TestBed.createComponent(MonProfil);
      f.detectChanges();
      await f.whenStable();

      expect(f.componentInstance.titre).toBe('');
      expect(f.componentInstance.loading).toBe(false);
    });
  });

  describe('experienceActuelle / onExperienceActuelleChange', () => {
    it('should be true when dateFin is empty', () => {
      const exp = {
        idExp: 1,
        profilId: 1,
        poste: 'X',
        entreprise: 'Y',
        dateDebut: '2024-01-01',
        description: '',
      };
      expect(component.experienceActuelle(exp as any)).toBe(true);
    });

    it('should clear dateFin when marking as current', () => {
      const exp = {
        idExp: 1,
        profilId: 1,
        poste: 'X',
        entreprise: 'Y',
        dateDebut: '2024-01-01',
        dateFin: '2025-01-01',
        description: '',
      };
      component.onExperienceActuelleChange(exp as any, true);
      expect(exp.dateFin).toBeUndefined();
    });
  });

  describe('ajouterCompetence', () => {
    it('should not call API when name is empty', () => {
      component.nouvelleCompetence = '   ';
      component.ajouterCompetence();
      expect(profilServiceMock.addCompetence).not.toHaveBeenCalled();
    });

    it('should POST then reload profil', async () => {
      component.nouvelleCompetence = 'Docker';
      component.ajouterCompetence();
      await fixture.whenStable();

      expect(profilServiceMock.addCompetence).toHaveBeenCalledWith({
        nom: 'Docker',
        niveau: 1,
        categorie: '',
      });
      expect(profilServiceMock.getMe).toHaveBeenCalled();
      expect(component.nouvelleCompetence).toBe('');
      expect(component.ajoutCompetenceVisible).toBe(false);
    });
  });

  describe('supprimerCompetence', () => {
    it('should no-op when idComp missing', () => {
      component.competences = [
        {
          idComp: 0,
          profilId: 1,
          nom: 'x',
          niveau: NiveauCompetence.Debutant,
          categorie: '',
        },
      ];
      component.supprimerCompetence(0);
      expect(profilServiceMock.deleteCompetence).not.toHaveBeenCalled();
    });

    it('should DELETE then remove locally', async () => {
      component.competences = [
        {
          idComp: 7,
          profilId: 1,
          nom: 'Git',
          niveau: NiveauCompetence.Expert,
          categorie: '',
        },
      ];
      component.supprimerCompetence(0);
      await fixture.whenStable();

      expect(profilServiceMock.deleteCompetence).toHaveBeenCalledWith(7);
      expect(component.competences.length).toBe(0);
    });
  });

  describe('ajouterExperience / ajouterFormation', () => {
    it('should append a draft experience', () => {
      const n = component.experiences.length;
      component.ajouterExperience();
      expect(component.experiences.length).toBe(n + 1);
      const last = component.experiences[component.experiences.length - 1];
      expect(last.idExp).toBe(0);
      expect(last.poste).toBe('');
    });

    it('should append a draft formation', () => {
      const n = component.formations.length;
      component.ajouterFormation();
      expect(component.formations.length).toBe(n + 1);
      const last = component.formations[component.formations.length - 1];
      expect(last.idFrmt).toBe(0);
      expect(last.annee).toBe(new Date().getFullYear());
    });
  });

  describe('enregistrer', () => {
    it('should PUT profil then reload when no nested rows', async () => {
      profilServiceMock.getMe.mockClear();

      component.enregistrer();
      await fixture.whenStable();

      expect(profilServiceMock.updateMe).toHaveBeenCalledWith({
        titre: component.titre,
        telephone: component.telephone,
        adresse: component.ville,
        linkedIn: component.linkedIn,
        description: component.resume,
      });
      expect(profilServiceMock.addExperience).not.toHaveBeenCalled();
      expect(profilServiceMock.getMe).toHaveBeenCalled();
      expect(component.saving).toBe(false);
    });

    it('should POST new experience and PUT existing', async () => {
      const expPayload: ProfilMeResponse['experiences'] = [
        {
          idExp: 0,
          profilId: 42,
          poste: 'Junior',
          entreprise: 'ACME',
          dateDebut: '2024-06-01T00:00:00.000Z',
          dateFin: undefined,
          description: 'Stage',
        },
        {
          idExp: 5,
          profilId: 42,
          poste: 'Senior',
          entreprise: 'Other',
          dateDebut: '2022-01-01T00:00:00.000Z',
          dateFin: '2023-12-31T00:00:00.000Z',
          description: '',
        },
      ];
      profilServiceMock.updateMe.mockReturnValueOnce(
        of(
          baseProfil({
            experiences: expPayload,
          })
        )
      );

      component.experiences = [
        {
          idExp: 0,
          profilId: 42,
          poste: 'Junior',
          entreprise: 'ACME',
          dateDebut: '2024-06-01',
          dateFin: undefined,
          description: 'Stage',
        },
        {
          idExp: 5,
          profilId: 42,
          poste: 'Senior',
          entreprise: 'Other',
          dateDebut: '2022-01-01',
          dateFin: '2023-12-31',
          description: '',
        },
      ];

      component.enregistrer();
      await fixture.whenStable();

      expect(profilServiceMock.addExperience).toHaveBeenCalledTimes(1);
      expect(profilServiceMock.updateExperience).toHaveBeenCalledWith(5, expect.any(Object));
      expect(profilServiceMock.getMe).toHaveBeenCalled();
      expect(component.saving).toBe(false);
    });

    it('should POST new formation and PUT existing', async () => {
      const formPayload: ProfilMeResponse['formations'] = [
        {
          idFrmt: 0,
          profilId: 42,
          diplome: 'Licence',
          etablissement: 'Uni',
          annee: 2021,
          mention: '',
        },
        {
          idFrmt: 3,
          profilId: 42,
          diplome: 'Master',
          etablissement: 'School',
          annee: 2023,
          mention: 'Bien',
        },
      ];
      profilServiceMock.updateMe.mockReturnValueOnce(
        of(
          baseProfil({
            formations: formPayload,
          })
        )
      );

      component.formations = [
        {
          idFrmt: 0,
          profilId: 42,
          diplome: 'Licence',
          etablissement: 'Uni',
          annee: 2021,
          mention: '',
        },
        {
          idFrmt: 3,
          profilId: 42,
          diplome: 'Master',
          etablissement: 'School',
          annee: 2023,
          mention: 'Bien',
        },
      ];

      component.enregistrer();
      await fixture.whenStable();

      expect(profilServiceMock.addFormation).toHaveBeenCalledTimes(1);
      expect(profilServiceMock.updateFormation).toHaveBeenCalledWith(3, expect.any(Object));
    });

    it('should log on updateMe error', async () => {
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      profilServiceMock.updateMe.mockReturnValueOnce(throwError(() => new Error('fail')));

      component.enregistrer();
      await fixture.whenStable();

      expect(errSpy).toHaveBeenCalled();
      expect(component.saving).toBe(false);
      errSpy.mockRestore();
    });
  });

  describe('sections locales', () => {
    it('should ajouterSection / supprimerSection', () => {
      component.ajouterSection();
      expect(component.sections.length).toBe(1);
      component.supprimerSection(0);
      expect(component.sections.length).toBe(0);
    });

    it('should ajouterLigne / supprimerLigne', () => {
      component.ajouterSection();
      const s = component.sections[0];
      const len = s.lignes.length;
      component.ajouterLigne(s);
      expect(s.lignes.length).toBe(len + 1);
      component.supprimerLigne(s, 1);
      expect(s.lignes.length).toBe(len);
    });
  });
});
