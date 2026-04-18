import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MonProfil } from './profil';

describe('MonProfil', () => {
  let component: MonProfil;
  let fixture: ComponentFixture<MonProfil>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonProfil],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MonProfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
