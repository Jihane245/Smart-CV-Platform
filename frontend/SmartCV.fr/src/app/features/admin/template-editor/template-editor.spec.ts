import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { TemplateEditor } from './template-editor';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AuthService } from '../../../core/services/auth.service';

describe('TemplateEditor', () => {
  let fixture: ComponentFixture<TemplateEditor>;
  let component: TemplateEditor;
  let router: Router;

  let adminServiceMock: {
    getTemplateById: ReturnType<typeof vi.fn>;
    createTemplate: ReturnType<typeof vi.fn>;
    updateTemplate: ReturnType<typeof vi.fn>;
  };

  let notifMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
  };

  let confirmMock: {
    confirm: ReturnType<typeof vi.fn>;
  };

  let authMock: {
    logout: ReturnType<typeof vi.fn>;
    getMe: ReturnType<typeof vi.fn>;
    getStatus: ReturnType<typeof vi.fn>;
  };

  function detect(): void {
    fixture.detectChanges(false);
  }

  function makeRouteWithId(id?: number) {
    return {
      snapshot: {
        paramMap: convertToParamMap(id ? { id: String(id) } : {}),
      },
    } as Partial<ActivatedRoute>;
  }

  beforeEach(async () => {
    adminServiceMock = {
      getTemplateById: vi.fn().mockReturnValue(
        of({
          id: 5,
          nom: 'Template X',
          couleur: '#123456',
          lignes: [],
          structure: {
            layout: 'sidebar-left',
            couleurPrimaire: '#123456',
            boxes: [
              {
                id: 'main',
                label: 'Main',
                style: { background: '#fff', textColor: '#000', accentColor: '#123456', padding: '12px' },
                components: [
                  { id: 'cmp-1', type: 'resume', titre: 'Résumé', config: {} },
                ],
              },
            ],
            sections: [],
          },
        }),
      ),
      createTemplate: vi.fn().mockReturnValue(of({ id: 99 })),
      updateTemplate: vi.fn().mockReturnValue(of({ id: 5 })),
    };

    notifMock = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    };

    confirmMock = {
      confirm: vi.fn().mockResolvedValue(true),
    };

    authMock = {
      logout: vi.fn(),
      getMe: vi.fn().mockReturnValue(of({ claims: [] })),
      getStatus: vi.fn().mockReturnValue(
        of({
          isAuthenticated: true,
          identityName: 'admin',
          preferredUsername: 'admin',
          email: 'admin@example.com',
          name: 'Admin User',
          givenName: 'Admin',
          surname: 'User',
        }),
      ),
    };

    // Avoid any side effects from localStorage in loadCustomFonts()
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [TemplateEditor],
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: adminServiceMock },
        { provide: NotificationService, useValue: notifMock },
        { provide: ConfirmService, useValue: confirmMock },
        { provide: AuthService, useValue: authMock },
        { provide: ActivatedRoute, useValue: makeRouteWithId(undefined) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateEditor);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true as any);
    detect();
    await fixture.whenStable();
    detect();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit (create mode)', () => {
    it('should default to create mode and build initial boxes', () => {
      expect(component.mode).toBe('create');
      expect(component.templateId).toBeNull();
      expect(component.boxes.length).toBeGreaterThan(0);
    });
  });

  describe('ngOnInit (edit mode)', () => {
    it('should load template when route has id', async () => {
      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [TemplateEditor],
          providers: [
            provideRouter([]),
            { provide: AdminService, useValue: adminServiceMock },
            { provide: NotificationService, useValue: notifMock },
            { provide: ConfirmService, useValue: confirmMock },
            { provide: AuthService, useValue: authMock },
            { provide: ActivatedRoute, useValue: makeRouteWithId(5) },
          ],
        })
        .compileComponents();

      const f = TestBed.createComponent(TemplateEditor);
      const cmp = f.componentInstance;
      const r = TestBed.inject(Router);
      vi.spyOn(r, 'navigate').mockResolvedValue(true as any);

      f.detectChanges(false);
      await f.whenStable();
      f.detectChanges(false);

      expect(cmp.mode).toBe('edit');
      expect(cmp.templateId).toBe(5);
      expect(adminServiceMock.getTemplateById).toHaveBeenCalledWith(5);
      expect(cmp.nom).toBe('Template X');
      expect(cmp.couleur).toBe('#123456');
      expect(cmp.boxes.length).toBe(1);
      expect(cmp.totalComponents()).toBe(1);
    });

    it('should navigate to /admin when template load fails', async () => {
      adminServiceMock.getTemplateById.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );

      await TestBed.resetTestingModule()
        .configureTestingModule({
          imports: [TemplateEditor],
          providers: [
            provideRouter([]),
            { provide: AdminService, useValue: adminServiceMock },
            { provide: NotificationService, useValue: notifMock },
            { provide: ConfirmService, useValue: confirmMock },
            { provide: AuthService, useValue: authMock },
            { provide: ActivatedRoute, useValue: makeRouteWithId(5) },
          ],
        })
        .compileComponents();

      const f = TestBed.createComponent(TemplateEditor);
      const r = TestBed.inject(Router);
      const navSpy = vi.spyOn(r, 'navigate').mockResolvedValue(true as any);
      f.detectChanges(false);
      await f.whenStable();

      expect(notifMock.error).toHaveBeenCalled();
      expect(navSpy).toHaveBeenCalledWith(['/admin']);
    });
  });

  describe('changerLayout', () => {
    it('should apply immediately when there are no components', () => {
      component.boxes.forEach(b => (b.components = []));
      const old = component.layoutId;
      component.changerLayout(old === 'sidebar-left' ? 'sidebar-right' : 'sidebar-left');
      expect(component.layoutId).not.toBe(old);
    });

    it('should confirm when there are components and apply on ok', async () => {
      component.boxes[0].components = [{ id: 'cmp-1', type: 'resume', titre: 'Résumé', config: {} } as any];
      confirmMock.confirm.mockResolvedValueOnce(true);
      const old = component.layoutId;
      component.changerLayout(old === 'sidebar-left' ? 'sidebar-right' : 'sidebar-left');
      // wait promise microtask
      await Promise.resolve();
      expect(confirmMock.confirm).toHaveBeenCalled();
      expect(component.layoutId).not.toBe(old);
      expect(component.totalComponents()).toBe(1);
    });

    it('should not apply when confirm cancelled', async () => {
      component.boxes[0].components = [{ id: 'cmp-1', type: 'resume', titre: 'Résumé', config: {} } as any];
      confirmMock.confirm.mockResolvedValueOnce(false);
      const old = component.layoutId;
      component.changerLayout(old === 'sidebar-left' ? 'sidebar-right' : 'sidebar-left');
      await Promise.resolve();
      expect(component.layoutId).toBe(old);
    });
  });

  describe('onCouleurChange', () => {
    it('should update sidebar/header background and main accentColor', () => {
      component.boxes = [
        { id: 'sidebar', label: 'Sidebar', style: { background: '#000', accentColor: '#000' }, components: [] },
        { id: 'main', label: 'Main', style: { background: '#fff', accentColor: '#000' }, components: [] },
      ] as any;
      component.couleur = '#ff0000';
      component.onCouleurChange();
      expect(component.boxes[0].style.background).toBe('#ff0000');
      expect(component.boxes[1].style.accentColor).toBe('#ff0000');
    });
  });

  describe('enregistrer', () => {
    it('should warn when nom is empty', () => {
      component.nom = '   ';
      component.enregistrer();
      expect(notifMock.warning).toHaveBeenCalled();
      expect(adminServiceMock.createTemplate).not.toHaveBeenCalled();
    });

    it('should warn when template has no components', () => {
      component.nom = 'Template';
      component.boxes.forEach(b => (b.components = []));
      component.enregistrer();
      expect(notifMock.warning).toHaveBeenCalledWith('Template vide', expect.any(String));
      expect(adminServiceMock.createTemplate).not.toHaveBeenCalled();
    });

    it('should create template in create mode and navigate to /admin', async () => {
      component.mode = 'create';
      component.nom = 'Mon template';
      component.boxes = [
        { id: 'main', label: 'Main', style: {}, components: [{ id: 'cmp-1', type: 'resume', config: {} }] },
      ] as any;

      component.enregistrer();
      await fixture.whenStable();

      expect(adminServiceMock.createTemplate).toHaveBeenCalled();
      expect(notifMock.success).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should update template in edit mode', async () => {
      component.mode = 'edit';
      component.templateId = 5;
      component.nom = 'Mon template';
      component.boxes = [
        { id: 'main', label: 'Main', style: {}, components: [{ id: 'cmp-1', type: 'resume', config: {} }] },
      ] as any;

      component.enregistrer();
      await fixture.whenStable();

      expect(adminServiceMock.updateTemplate).toHaveBeenCalledWith(5, expect.any(Object));
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should show error when save fails', async () => {
      adminServiceMock.createTemplate.mockReturnValueOnce(
        throwError(() => ({ message: 'fail' })),
      );
      component.mode = 'create';
      component.nom = 'Mon template';
      component.boxes = [
        { id: 'main', label: 'Main', style: {}, components: [{ id: 'cmp-1', type: 'resume', config: {} }] },
      ] as any;

      component.enregistrer();
      await fixture.whenStable();

      expect(notifMock.error).toHaveBeenCalled();
      expect(component.saving).toBe(false);
    });
  });

  describe('annuler', () => {
    it('should navigate to /admin when confirmed', async () => {
      confirmMock.confirm.mockResolvedValueOnce(true);
      component.annuler();
      await Promise.resolve();
      expect(confirmMock.confirm).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should not navigate when cancelled', async () => {
      confirmMock.confirm.mockResolvedValueOnce(false);
      component.annuler();
      await Promise.resolve();
      expect(router.navigate).not.toHaveBeenCalledWith(['/admin']);
    });
  });

  describe('logout', () => {
    it('should call authService.logout when confirmed', async () => {
      confirmMock.confirm.mockResolvedValueOnce(true);
      await component.logout();
      expect(authMock.logout).toHaveBeenCalled();
    });

    it('should not logout when cancelled', async () => {
      confirmMock.confirm.mockResolvedValueOnce(false);
      await component.logout();
      expect(authMock.logout).not.toHaveBeenCalled();
    });
  });
});

