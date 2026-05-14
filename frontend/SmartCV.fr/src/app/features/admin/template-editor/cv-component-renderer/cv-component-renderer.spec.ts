import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CvComponentRenderer } from './cv-component-renderer';

describe('CvComponentRenderer', () => {
  let fixture: ComponentFixture<CvComponentRenderer>;
  let component: CvComponentRenderer;

  function detect(): void {
    fixture.detectChanges(false);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvComponentRenderer],
    }).compileComponents();

    fixture = TestBed.createComponent(CvComponentRenderer);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.component = { id: 'cmp-1', type: 'resume', titre: 'Résumé', config: {} } as any;
    detect();
    expect(component).toBeTruthy();
  });

  describe('i18n t()', () => {
    it('should fallback to fr and to key', () => {
      component.component = { id: 'cmp-1', type: 'resume', titre: 'Résumé', config: {} } as any;
      component.lang = 'xx';
      expect(component.t('prenom')).toBe('Prénom');
      expect(component.t('unknown_key')).toBe('unknown_key');
    });
  });

  describe('visibility', () => {
    it('isVisible should account for admin hiddenFields + userHiddenFields', () => {
      component.component = {
        id: 'cmp-1',
        type: 'infos-personnelles',
        titre: 'Infos',
        config: { hiddenFields: ['email'] },
      } as any;
      component.userHiddenFields = ['tel'];
      expect(component.isVisible('prenom')).toBe(true);
      expect(component.isVisible('email')).toBe(false);
      expect(component.isVisible('tel')).toBe(false);
    });

    it('visibleCustomFields should filter hidden custom fields', () => {
      component.component = {
        id: 'cmp-1',
        type: 'infos-personnelles',
        titre: 'Infos',
        config: {
          hiddenFields: ['twitter'],
          customFields: [
            { id: 'f1', key: 'twitter', label: 'Twitter' },
            { id: 'f2', key: 'mastodon', label: 'Mastodon' },
          ],
        },
      } as any;
      expect(component.customFields.length).toBe(2);
      expect(component.visibleCustomFields.map((f) => f.key)).toEqual(['mastodon']);
    });
  });

  describe('styles', () => {
    it('should compute titleColor/textColor/fontSize/fontFamily from config', () => {
      component.accentColor = '#00ff00';
      component.component = {
        id: 'cmp-1',
        type: 'resume',
        titre: 'Résumé',
        config: { titleColor: '#111111', textColor: '#222222', fontSize: 16, fontFamily: 'Verdana' },
      } as any;
      expect(component.titleColor).toBe('#111111');
      expect(component.textColor).toBe('#222222');
      expect(component.fontSize).toBe('16px');
      expect(component.fontFamily).toBe('Verdana');
    });

    it('should fallback titleColor to accentColor and fontSize to 13px', () => {
      component.accentColor = '#00ff00';
      component.component = { id: 'cmp-1', type: 'resume', titre: 'Résumé', config: {} } as any;
      expect(component.titleColor).toBe('#00ff00');
      expect(component.fontSize).toBe('13px');
    });
  });

  describe('data source and events', () => {
    it('should use realData when provided and emit dataChange on edit', () => {
      component.component = { id: 'cmp-1', type: 'infos-personnelles', titre: 'Infos', config: {} } as any;
      component.editable = true;
      component.realData = { prenom: 'Jane', nom: 'Doe', email: 'a@b.com', tel: '', adresse: '' };

      const spy = vi.fn();
      component.dataChange.subscribe(spy);

      detect();
      component.realData.prenom = 'Janet';
      component.onChange();
      expect(spy).toHaveBeenCalledWith(component.realData);
    });

    it('should not emit dataChange when not editable', () => {
      component.component = { id: 'cmp-1', type: 'infos-personnelles', titre: 'Infos', config: {} } as any;
      component.editable = false;
      component.realData = { prenom: 'Jane', nom: 'Doe' };
      const spy = vi.fn();
      component.dataChange.subscribe(spy);
      component.onChange();
      expect(spy).not.toHaveBeenCalled();
    });

    it('hideField should emit fieldHide', () => {
      component.component = { id: 'cmp-1', type: 'infos-personnelles', titre: 'Infos', config: {} } as any;
      const spy = vi.fn();
      component.fieldHide.subscribe(spy);
      component.hideField('email');
      expect(spy).toHaveBeenCalledWith('email');
    });
  });

  describe('editable list helpers', () => {
    it('addItem/removeItem should mutate realData arrays and emit dataChange', () => {
      component.component = { id: 'cmp-1', type: 'experiences', titre: 'Exp', config: {} } as any;
      component.editable = true;
      component.realData = [];

      const spy = vi.fn();
      component.dataChange.subscribe(spy);

      component.addItem();
      expect(component.realData.length).toBe(1);
      expect(spy).toHaveBeenCalledWith(component.realData);

      component.removeItem(0);
      expect(component.realData.length).toBe(0);
    });

    it('addItem should no-op when realData is not an array', () => {
      component.component = { id: 'cmp-1', type: 'experiences', titre: 'Exp', config: {} } as any;
      component.editable = true;
      component.realData = { not: 'array' };
      component.addItem();
      expect(Array.isArray(component.realData)).toBe(false);
    });
  });

  describe('template rendering (smoke)', () => {
    it('should render editable infos-personnelles inputs and remove buttons', () => {
      component.component = {
        id: 'cmp-1',
        type: 'infos-personnelles',
        titre: 'Infos',
        config: {},
      } as any;
      component.editable = true;
      component.realData = {
        prenom: 'Jane',
        nom: 'Doe',
        email: 'jane@example.com',
        tel: '0600000000',
        adresse: 'Paris',
        linkedin: '',
        github: '',
        site: '',
      };
      detect();

      const inputs = fixture.nativeElement.querySelectorAll('input.ed');
      expect(inputs.length).toBeGreaterThan(0);
      const rm = fixture.nativeElement.querySelector('button.ed-rm-field') as HTMLButtonElement | null;
      expect(rm).toBeTruthy();
    });

    it('should render competences rating dots and allow click to change niveau', () => {
      component.component = { id: 'cmp-1', type: 'competences', titre: 'Skills', config: {} } as any;
      component.editable = true;
      component.realData = [{ nom: 'Angular', niveau: 2 }];

      const spy = vi.fn();
      component.dataChange.subscribe(spy);

      detect();
      const dots = fixture.nativeElement.querySelectorAll('.dot.dot-clickable');
      expect(dots.length).toBe(5);

      // click 4th dot -> niveau = 4
      (dots[3] as HTMLElement).click();
      detect();
      expect(component.realData[0].niveau).toBe(4);
      expect(spy).toHaveBeenCalled();
    });
  });
});

