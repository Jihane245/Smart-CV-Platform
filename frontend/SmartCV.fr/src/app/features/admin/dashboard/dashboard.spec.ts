import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Dashboard } from './dashboard';
import { AdminService } from '../../../core/services/admin.service';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        {
          provide: AdminService,
          useValue: {
            getStats: () => of([]),
            getUtilisateurs: () => of([]),
            getTemplates: () => of([]),
            updateActif: () => of({}),
            deleteUtilisateur: () => of({}),
            deleteTemplate: () => of({}),
            createTemplate: () => of({}),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
