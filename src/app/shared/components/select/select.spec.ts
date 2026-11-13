import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Select } from './select';
import {
  STICKY_NOTE_FONT_OPTIONS,
  STICKY_NOTE_FONT_SIZE_OPTIONS,
} from '../../constants/common.constants';

describe('Select', () => {
  let component: Select;
  let fixture: ComponentFixture<Select>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Select],
    }).compileComponents();

    fixture = TestBed.createComponent(Select);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('previews font families and selects a searched font with the keyboard', () => {
    fixture.componentRef.setInput('options', STICKY_NOTE_FONT_OPTIONS);
    fixture.componentRef.setInput('searchable', true);
    fixture.componentRef.setInput('dropdownTitle', 'Note font');
    component.open();
    const panel = document.querySelector(`[data-select-owner="${component.selectId}"]`)!;
    const search = panel.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(search.getAttribute('aria-label')).toBe('Search Note font');
    search.value = '  lOrA  ';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const options = panel.querySelectorAll<HTMLElement>('[role="option"]');
    expect(options.length).toBe(1);
    const preview = options[0].querySelector('strong')!;
    expect(preview.textContent).toContain('Lora');
    expect(preview.style.fontFamily).toContain('Lora');
    expect(preview.style.fontSize).toBe('18px');

    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(component.value).toBe('LORA');
    expect(component.isOpen).toBe(false);
    const selected = fixture.nativeElement.querySelector('.app-select-single-value');
    expect(selected.style.fontFamily).toContain('Lora');
    component.open();
    expect(panel.querySelectorAll('[role="option"]').length).toBe(STICKY_NOTE_FONT_OPTIONS.length);
  });

  it('previews actual font sizes and recovers from an empty search', () => {
    fixture.componentRef.setInput('options', STICKY_NOTE_FONT_SIZE_OPTIONS);
    fixture.componentRef.setInput('searchable', true);
    component.open();
    const panel = document.querySelector(`[data-select-owner="${component.selectId}"]`)!;
    const search = panel.querySelector<HTMLInputElement>('input[type="search"]')!;
    const previews = panel.querySelectorAll<HTMLElement>('.app-select-option-copy strong');
    expect(Array.from(previews, (preview) => preview.style.fontSize)).toEqual([
      '13px',
      '14px',
      '15px',
      '16px',
    ]);

    search.value = '99';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(panel.querySelectorAll('[role="option"]').length).toBe(0);
    expect(panel.textContent).toContain('No options found');
    panel.querySelector<HTMLButtonElement>('button[aria-label="Clear search"]')!.click();
    fixture.detectChanges();
    expect(panel.querySelectorAll('[role="option"]').length).toBe(4);

    search.value = '16';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    panel.querySelector<HTMLButtonElement>('[role="option"]')!.click();
    expect(component.value).toBe(16);
  });

  it('always shows a heading and prefers the explicit dropdown title', () => {
    fixture.componentRef.setInput('ariaLabel', 'Choose workspace');
    component.open();
    const panel = document.querySelector(`[data-select-owner="${component.selectId}"]`)!;
    expect(panel.querySelector('header strong')?.textContent).toContain('Choose workspace');
    fixture.componentRef.setInput('dropdownTitle', 'Workspace');
    fixture.detectChanges();
    expect(panel.querySelector('header strong')?.textContent).toContain('Workspace');
  });

  it('defaults to no shadow and does not apply shadow classes', () => {
    expect(component.resolvedShadow).toBe('none');
    expect(component.wrapperClasses['app-select-has-shadow']).toBeFalsy();
    expect(component.wrapperClasses['app-select-shadow-none']).toBeFalsy();
  });

  it('applies shadow classes when shadow="upside" is set', () => {
    component.shadow = 'upside';
    expect(component.resolvedShadow).toBe('upside');
    expect(component.wrapperClasses['app-select-has-shadow']).toBe(true);
    expect(component.wrapperClasses['app-select-shadow-upside']).toBe(true);
  });

  it('applies shadow classes when shadow="sm" is set', () => {
    component.shadow = 'sm';
    expect(component.resolvedShadow).toBe('sm');
    expect(component.wrapperClasses['app-select-has-shadow']).toBe(true);
    expect(component.wrapperClasses['app-select-shadow-sm']).toBe(true);
  });

  it('resolves boolean true to upside shadow', () => {
    component.shadow = true;
    expect(component.resolvedShadow).toBe('upside');
    expect(component.wrapperClasses['app-select-has-shadow']).toBe(true);
    expect(component.wrapperClasses['app-select-shadow-upside']).toBe(true);
  });

  it('resolves boolean false to none', () => {
    component.shadow = false;
    expect(component.resolvedShadow).toBe('none');
    expect(component.wrapperClasses['app-select-has-shadow']).toBeFalsy();
  });
});
