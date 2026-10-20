import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Select } from './select';

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
