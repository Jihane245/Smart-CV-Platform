import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatePreview } from './template-preview';

describe('TemplatePreview', () => {
  let fixture: ComponentFixture<TemplatePreview>;
  let component: TemplatePreview;

  function detect(): void {
    fixture.detectChanges(false);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplatePreview],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplatePreview);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.structure = { sections: [] } as any;
    detect();
    expect(component).toBeTruthy();
  });

  describe('computed getters', () => {
    it('layoutId should fallback to sidebar-left', () => {
      component.structure = null;
      expect(component.layoutId).toBe('sidebar-left');
    });

    it('boxes should fallback to []', () => {
      component.structure = { sections: [] } as any;
      expect(component.boxes).toEqual([]);
    });

    it('hasBoxes should be true only if some box has components', () => {
      component.structure = {
        sections: [],
        layout: 'sidebar-left',
        boxes: [
          { id: 'sidebar', label: 'Sidebar', style: {}, components: [] },
          { id: 'main', label: 'Main', style: {}, components: [{ id: 'c1', type: 'resume', titre: 'Résumé', config: {} }] },
        ],
      } as any;
      expect(component.hasBoxes).toBe(true);
    });

    it('hasBoxes should be false when boxes empty or all empty', () => {
      component.structure = {
        sections: [],
        layout: 'sidebar-left',
        boxes: [{ id: 'main', label: 'Main', style: {}, components: [] }],
      } as any;
      expect(component.hasBoxes).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('should show empty message when hasBoxes is false', () => {
      component.structure = { sections: [] } as any;
      detect();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent ?? '').toContain("Ce template n'a pas encore été construit");
    });

    it('should render boxes and cv-component-renderers when hasBoxes is true', () => {
      component.couleur = '#ff0000';
      component.structure = {
        sections: [],
        layout: 'sidebar-right',
        boxes: [
          {
            id: 'main',
            label: 'Main',
            style: { background: '#fff', textColor: '#111', padding: '10px', accentColor: '' },
            components: [
              { id: 'c1', type: 'resume', titre: 'Résumé', config: {} },
              { id: 'c2', type: 'photo', titre: '', config: {} },
            ],
          },
        ],
      } as any;
      detect();

      const root = fixture.nativeElement.querySelector('.tpl-preview') as HTMLElement | null;
      expect(root).toBeTruthy();
      expect(root?.getAttribute('data-layout')).toBe('sidebar-right');

      const boxes = fixture.nativeElement.querySelectorAll('.tpl-preview-box');
      expect(boxes.length).toBe(1);

      const cmps = fixture.nativeElement.querySelectorAll('app-cv-component-renderer');
      expect(cmps.length).toBe(2);
    });
  });
});

