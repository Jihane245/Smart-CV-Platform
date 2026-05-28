import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ProfilService, toAbsolutePhotoUrl } from '../../../core/services/profil.service';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  let authMock: {
    getMe: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  let confirmService: ConfirmService;
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  let profilMock: {
    getMe: ReturnType<typeof vi.fn>;
  };

  function detect(): void {
    fixture.detectChanges(false);
  }

  beforeEach(async () => {
    authMock = {
      getMe: vi.fn().mockReturnValue(
        of({
          givenName: 'Jane',
          surname: 'Doe',
          preferredUsername: 'jdoe',
        }),
      ),
      isAdmin: vi.fn().mockReturnValue(of(false)),
      logout: vi.fn(),
    };

    profilMock = {
      getMe: vi.fn().mockReturnValue(
        of({
          photoUrl: '/uploads/photos/jane.png',
          competences: [],
          titre: '',
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => null },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: AuthService, useValue: authMock },
        // Use real ConfirmService because ConfirmDialog subscribes to `state$`
        ConfirmService,
        { provide: ProfilService, useValue: profilMock },
      ],
    }).compileComponents();

    confirmService = TestBed.inject(ConfirmService);
    confirmSpy = vi.spyOn(confirmService, 'confirm').mockResolvedValue(false);

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    detect();
    await fixture.whenStable();
    detect();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set displayName and initials from auth getMe', () => {
      expect(authMock.getMe).toHaveBeenCalled();
      expect(component.displayName).toBe('Jane Doe');
      expect(component.userInitials).toBe('JD');
    });

    it('should fallback to preferredUsername when no given/surname', async () => {
      authMock.getMe.mockReturnValueOnce(
        of({ givenName: null, surname: null, preferredUsername: 'jdoe' }),
      );
      const f = TestBed.createComponent(SidebarComponent);
      f.detectChanges(false);
      await f.whenStable();
      expect(f.componentInstance.displayName).toBe('jdoe');
      expect(f.componentInstance.userInitials).toBe('?');
    });

    it('should fallback identity on auth error', async () => {
      authMock.getMe.mockReturnValueOnce(throwError(() => new Error('401')));
      const f = TestBed.createComponent(SidebarComponent);
      f.detectChanges(false);
      await f.whenStable();
      expect(f.componentInstance.displayName).toBe('Utilisateur');
      expect(f.componentInstance.userInitials).toBe('U');
    });

    it('should set photoUrl from profil (absolute)', () => {
      expect(profilMock.getMe).toHaveBeenCalled();
      expect(component.photoUrl).toBe(toAbsolutePhotoUrl('/uploads/photos/jane.png'));
    });

    it('should keep photoUrl null on profil error', async () => {
      profilMock.getMe.mockReturnValueOnce(throwError(() => new Error('fail')));
      const f = TestBed.createComponent(SidebarComponent);
      f.detectChanges(false);
      await f.whenStable();
      expect(f.componentInstance.photoUrl).toBeNull();
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle isCollapsed', () => {
      expect(component.isCollapsed).toBe(false);
      component.toggleSidebar();
      expect(component.isCollapsed).toBe(true);
      component.toggleSidebar();
      expect(component.isCollapsed).toBe(false);
    });
  });

  describe('logout', () => {
    it('should not logout when confirm is false', async () => {
      confirmSpy.mockResolvedValueOnce(false);
      await component.logout();
      expect(authMock.logout).not.toHaveBeenCalled();
    });

    it('should logout when confirm is true', async () => {
      confirmSpy.mockResolvedValueOnce(true);
      await component.logout();
      expect(authMock.logout).toHaveBeenCalled();
    });
  });
});

