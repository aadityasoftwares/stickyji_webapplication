import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StickyNote } from './sticky-note';
import { Tooltip } from '../../../shared/components/tooltip/tooltip';

describe('StickyNote', () => {
  let component: StickyNote;
  let fixture: ComponentFixture<StickyNote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StickyNote],
    }).compileComponents();

    fixture = TestBed.createComponent(StickyNote);
    component = fixture.componentInstance;
    component.data = {
      id: 'note-1',
      title: 'Design Sprint',
      description: 'Prepare design assets',
      color: 'YELLOW',
      noteKey: 'ST-000001',
    };
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute tooltipTone matching note color', () => {
    component.data = { ...component.data, color: 'YELLOW' };
    expect(component.tooltipTone).toBe('noteYellow');

    component.data = { ...component.data, color: 'BLUE' };
    expect(component.tooltipTone).toBe('noteBlue');

    component.data = { ...component.data, color: 'WHITE' };
    expect(component.tooltipTone).toBe('paper');
  });

  it('should attach appTooltip directive to interactive elements', () => {
    const tooltipDirectives = fixture.debugElement.queryAll(By.directive(Tooltip));
    expect(tooltipDirectives.length).toBeGreaterThan(0);

    const editBtn = fixture.debugElement.query(By.css('.sticky-note__edit-trigger'));
    expect(editBtn).toBeTruthy();
    const editTooltip = editBtn.injector.get(Tooltip);
    expect(editTooltip.text).toBe('Edit note');
  });
});

