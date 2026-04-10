import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonProfil } from './mon-profil';

describe('MonProfil', () => {
  let component: MonProfil;
  let fixture: ComponentFixture<MonProfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonProfil],
    }).compileComponents();

    fixture = TestBed.createComponent(MonProfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
