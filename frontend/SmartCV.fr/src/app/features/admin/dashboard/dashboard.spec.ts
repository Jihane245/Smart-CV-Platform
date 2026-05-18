import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Dashboard } from './dashboard';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AuthService } from '../../../core/services/auth.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        // RouterLink inside admin layout needs ActivatedRoute
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => null },
              queryParamMap: { get: () => null },
            },
          },
        },
        {
          provide: AdminService,
          useValue: {
            getStats: () => of([]),
            getUtilisateurs: () => of([]),
            getTemplates: () => of([]),
            getUtilisateur: () => of(null),
            updateActif: () => of({}),
            deleteUtilisateur: () => of({}),
            deleteTemplate: () => of({}),
            createTemplate: () => of({}),
            updateTemplate: () => of({}),
            getTemplateById: () => of({}),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
            warning: vi.fn(),
            info: vi.fn(),
          },
        },
        {
          provide: ConfirmService,
          useValue: {
            confirm: vi.fn().mockResolvedValue(false),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getMe: vi.fn().mockReturnValue(of({ claims: [] })),
            logout: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges(false);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
