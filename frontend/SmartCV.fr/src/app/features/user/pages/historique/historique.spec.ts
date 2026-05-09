import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Historique } from './historique';
import { CvService, PdfHistorique, BACKEND_ORIGIN } from '../../../../core/services/cv.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmService } from '../../../../core/services/confirm.service';

describe('Historique', () => {
  let fixture: ComponentFixture<Historique>;
  let component: Historique;
  let router: Router;

  let cvServiceMock: {
    getMesPdfs: ReturnType<typeof vi.fn>;
    supprimerCv: ReturnType<typeof vi.fn>;
  };

  let authServiceMock: {
    getStatus: ReturnType<typeof vi.fn>;
  };

  let notifMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  let confirmMock: {
    confirm: ReturnType<typeof vi.fn>;
  };

  function detect(): void {
    fixture.detectChanges(false);
  }

  const pdf = (overrides: Partial<PdfHistorique> = {}): PdfHistorique => ({
    id: 1,
    cvId: 10,
    fileName: 'cv_10.pdf',
    cloudUrl: '/pdfs/cv_10.pdf',
    dateCreation: '2026-05-01T10:00:00.000Z',
    nomTemplate: 'Template A',
    ...overrides,
  });

  beforeEach(async () => {
    cvServiceMock = {
      getMesPdfs: vi.fn().mockReturnValue(of([pdf()])),
      supprimerCv: vi.fn().mockReturnValue(of(void 0)),
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

    notifMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    confirmMock = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Historique],
      providers: [
        provideRouter([]),
        { provide: CvService, useValue: cvServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NotificationService, useValue: notifMock },
        { provide: ConfirmService, useValue: confirmMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Historique);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true as any);
    detect();
    await fixture.whenStable();
    detect();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('charger', () => {
    it('should load pdfs and user status', () => {
      expect(cvServiceMock.getMesPdfs).toHaveBeenCalled();
      expect(authServiceMock.getStatus).toHaveBeenCalled();
      expect(component.chargement).toBe(false);
      expect(component.totalPdfs).toBe(1);
      expect(component.pdfs.length).toBe(1);
      expect(component.firstIndexAffiche).toBe(1);
      expect(component.lastIndexAffiche).toBe(1);
    });

    it('should show error when loading fails', async () => {
      cvServiceMock.getMesPdfs.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );

      const f = TestBed.createComponent(Historique);
      f.detectChanges(false);
      await f.whenStable();
      f.detectChanges(false);

      expect(notifMock.error).toHaveBeenCalledWith("Impossible de charger l'historique des PDFs.");
      expect(f.componentInstance.chargement).toBe(false);
    });
  });

  describe('pagination', () => {
    it('totalPages should be at least 1', () => {
      (component as any).pdfsAll = [];
      component.totalPdfs = 0;
      expect(component.totalPages).toBe(1);
    });

    it('pageSuivante/pagePrecedente should move within bounds and scroll top', () => {
      const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const many = Array.from({ length: 21 }).map((_, i) => pdf({ id: i + 1, cvId: 100 + i }));
      (component as any).pdfsAll = many;
      component.totalPdfs = many.length;
      component.pageCourante = 0;

      component.pageSuivante();
      expect(component.pageCourante).toBe(1);
      expect(scrollSpy).toHaveBeenCalled();

      component.pagePrecedente();
      expect(component.pageCourante).toBe(0);

      scrollSpy.mockRestore();
    });
  });

  describe('displayName', () => {
    it('should prefer pdf captured prenom/nom', () => {
      const name = component.displayName(pdf({ prenom: 'Ana', nom: 'B' }));
      expect(name).toBe('CV_B_Ana.pdf');
    });

    it('should fallback to logged user prenom/nom', () => {
      const name = component.displayName(pdf({ prenom: null, nom: null }));
      expect(name).toBe('CV_Doe_Jane.pdf');
    });

    it('should fallback to fileName when no names', () => {
      // wipe internal identity
      (component as any).prenom = '';
      (component as any).nom = '';
      const name = component.displayName(pdf({ prenom: null, nom: null, fileName: 'tech.pdf' }));
      expect(name).toBe('tech.pdf');
    });
  });

  describe('pdfUrl/voir/modifier', () => {
    it('pdfUrl should build absolute backend url', () => {
      expect(component.pdfUrl(pdf({ cloudUrl: '/pdfs/x.pdf' }))).toBe(`${BACKEND_ORIGIN}/pdfs/x.pdf`);
    });

    it('voir should open a new tab', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      component.voir(pdf({ cloudUrl: '/pdfs/x.pdf' }));
      expect(openSpy).toHaveBeenCalledWith(`${BACKEND_ORIGIN}/pdfs/x.pdf`, '_blank', 'noopener');
      openSpy.mockRestore();
    });

    it('modifier should navigate to generate-cv with cvId', () => {
      component.modifier(pdf({ cvId: 77 }));
      expect(router.navigate).toHaveBeenCalledWith(['/user/generate-cv'], {
        queryParams: { cvId: 77 },
      });
    });
  });

  describe('supprimer', () => {
    it('should no-op when user cancels', async () => {
      confirmMock.confirm.mockResolvedValueOnce(false);
      await component.supprimer(pdf({ cvId: 10 }));
      expect(cvServiceMock.supprimerCv).not.toHaveBeenCalled();
    });

    it('should delete CV and remove related PDFs', async () => {
      const list = [pdf({ id: 1, cvId: 10 }), pdf({ id: 2, cvId: 11 }), pdf({ id: 3, cvId: 10 })];
      (component as any).pdfsAll = list;
      component.totalPdfs = list.length;
      component.pageCourante = 0;

      await component.supprimer(pdf({ cvId: 10 }));
      expect(cvServiceMock.supprimerCv).toHaveBeenCalledWith(10);
      expect(component.totalPdfs).toBe(1);
      expect(component.pdfs.length).toBe(1);
      expect(notifMock.success).toHaveBeenCalledWith('CV supprimé.');
    });

    it('should show error when delete fails', async () => {
      cvServiceMock.supprimerCv.mockReturnValueOnce(throwError(() => new Error('fail')));
      await component.supprimer(pdf({ cvId: 10 }));
      expect(notifMock.error).toHaveBeenCalledWith('Erreur lors de la suppression.');
    });

    it('should adjust pageCourante when last page becomes empty', async () => {
      // make 11 pdfs so there are 2 pages (PAGE_SIZE=10)
      const many = Array.from({ length: 11 }).map((_, i) => pdf({ id: i + 1, cvId: i < 10 ? i + 1 : 999 }));
      // last page contains only cvId 999
      (component as any).pdfsAll = many;
      component.totalPdfs = many.length;
      component.pageCourante = 1;

      await component.supprimer(pdf({ cvId: 999 }));
      expect(component.pageCourante).toBe(0);
    });
  });
});

