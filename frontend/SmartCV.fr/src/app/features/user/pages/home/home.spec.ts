import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Home } from './home';
import {
  DashboardUserDto,
  DashboardUserService,
} from '../../../../core/services/dashboard-user.service';
import { NotificationService } from '../../../../core/services/notification.service';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let component: Home;

  let dashboardServiceMock: { getDashboard: ReturnType<typeof vi.fn> };
  let notifMock: { error: ReturnType<typeof vi.fn> };

  const sample: DashboardUserDto = {
    nbCv: 2,
    nbLettres: 1,
    nbTests: 3,
    nbRoadmaps: 2,
    nbCompetences: 8,
    scoreCvMoyen: 72.5,
    scoreTestsMoyen: 65,
    tauxReussiteTests: 66.7,
    topCompetencesCv: ['TypeScript', 'Angular'],
    competencesFaibles: ['Docker'],
    recommendation: 'Continue comme ça',
  };

  beforeEach(async () => {
    dashboardServiceMock = { getDashboard: vi.fn(() => of(sample)) };
    notifMock = { error: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: DashboardUserService, useValue: dashboardServiceMock },
        { provide: NotificationService, useValue: notifMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
  });

  it('charge le dashboard au démarrage', () => {
    fixture.detectChanges();
    expect(dashboardServiceMock.getDashboard).toHaveBeenCalled();
    expect(component.dashboard).toEqual(sample);
    expect(component.chargement).toBe(false);
  });

  it('affiche une erreur si le chargement échoue', () => {
    dashboardServiceMock.getDashboard.mockReturnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(notifMock.error).toHaveBeenCalled();
    expect(component.dashboard).toBeNull();
  });
});
